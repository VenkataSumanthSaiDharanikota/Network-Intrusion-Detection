import time
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
import joblib
import pandas as pd
import numpy as np

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder

from backend.config import (
    MODEL_FILE,
    PREPROCESSOR_FILE,
    LABEL_ENCODER_FILE,
    METADATA_FILE,
    METRICS_FILE,
    COMPARISON_FILE,
    DATASET_NAME,
    FEATURE_COLUMNS,
    DEFAULT_CLASSIFICATION_MODE,
    ATTACK_CATEGORIES
)
from backend.ml.dataset_manager import load_raw_dataset
from backend.ml.preprocessor import NIDSPreprocessor
from backend.ml.evaluator import evaluate_model, extract_feature_importance
from backend.database.db import save_training_run

# Global training lock / status flag
TRAINING_STATE = {
    "is_training": False,
    "current_step": "idle",
    "progress_percent": 0,
    "error": None,
    "last_completed": None
}

def get_training_state() -> Dict[str, Any]:
    return TRAINING_STATE

def run_model_training_and_comparison(
    mode: str = DEFAULT_CLASSIFICATION_MODE,
    sample_size: Optional[int] = None
) -> Dict[str, Any]:
    """
    Executes end-to-end ML workflow:
    1. Loads real raw dataset
    2. Encodes target labels according to mode (binary: Normal vs Malicious; multiclass: 5 categories)
    3. Fits preprocessing pipeline on training data ONLY (preventing data leakage)
    4. Trains Logistic Regression, Random Forest, HistGradientBoosting
    5. Computes real metrics on held-out test data
    6. Selects the champion model based on Macro F1 score
    7. Persists artifacts (model, preprocessor, encoder, metadata, metrics, comparison)
    """
    global TRAINING_STATE
    TRAINING_STATE["is_training"] = True
    TRAINING_STATE["current_step"] = "Loading raw dataset"
    TRAINING_STATE["progress_percent"] = 10
    TRAINING_STATE["error"] = None
    
    try:
        train_df, test_df = load_raw_dataset()
        
        if sample_size and sample_size < len(train_df):
            train_df = train_df.sample(n=sample_size, random_state=42)
            
        TRAINING_STATE["current_step"] = "Mapping target labels and attack categories"
        TRAINING_STATE["progress_percent"] = 25
        
        # Label preparation
        if mode == "binary":
            train_df["target"] = np.where(train_df["label"] == "normal", "Normal", "Malicious")
            test_df["target"] = np.where(test_df["label"] == "normal", "Normal", "Malicious")
            class_labels = ["Normal", "Malicious"]
        else: # multiclass
            train_df["target"] = train_df["label"].map(lambda l: ATTACK_CATEGORIES.get(str(l).lower().strip(), "Other"))
            test_df["target"] = test_df["label"].map(lambda l: ATTACK_CATEGORIES.get(str(l).lower().strip(), "Other"))
            class_labels = sorted(list(train_df["target"].unique()))
            
        label_encoder = LabelEncoder()
        label_encoder.fit(class_labels)
        
        y_train = label_encoder.transform(train_df["target"])
        y_test = label_encoder.transform(test_df["target"])
        
        TRAINING_STATE["current_step"] = "Fitting preprocessing pipeline (StandardScaler + OneHotEncoder)"
        TRAINING_STATE["progress_percent"] = 40
        
        preprocessor = NIDSPreprocessor()
        X_train_proc = preprocessor.fit_transform(train_df)
        X_test_proc = preprocessor.transform(test_df)
        
        # Candidate models definition
        candidate_models = {
            "Logistic Regression": {
                "model": LogisticRegression(max_iter=500, random_state=42, solver='lbfgs'),
                "description": "L2-regularized linear classifier with logistic loss. Fast baseline."
            },
            "Random Forest": {
                "model": RandomForestClassifier(n_estimators=100, max_depth=16, random_state=42, n_jobs=-1),
                "description": "Ensemble of 100 decision trees with feature sub-sampling. High non-linear capacity."
            },
            "HistGradientBoosting": {
                "model": HistGradientBoostingClassifier(max_iter=100, max_depth=12, random_state=42),
                "description": "Histogram-based gradient boosted decision trees. Fast gradient boosting for large tabular data."
            }
        }
        
        comparison_results = []
        trained_models = {}
        eval_metrics_dict = {}
        
        total_models = len(candidate_models)
        for idx, (name, config) in enumerate(candidate_models.items(), start=1):
            TRAINING_STATE["current_step"] = f"Training and evaluating candidate model {idx}/{total_models}: {name}"
            TRAINING_STATE["progress_percent"] = 40 + int((idx / total_models) * 45)
            
            clf = config["model"]
            start_time = time.time()
            clf.fit(X_train_proc, y_train)
            train_duration = round(time.time() - start_time, 2)
            
            # Evaluate on held-out test data
            eval_res = evaluate_model(clf, X_test_proc, y_test, class_labels)
            
            trained_models[name] = clf
            eval_metrics_dict[name] = eval_res
            
            comparison_results.append({
                "model_name": name,
                "description": config["description"],
                "accuracy": eval_res["accuracy"],
                "precision": eval_res["precision"],
                "recall": eval_res["recall"],
                "f1_score": eval_res["f1_score"],
                "macro_f1": eval_res["macro_f1"],
                "weighted_f1": eval_res["weighted_f1"],
                "training_time_sec": train_duration
            })
            
        # Model Selection: Champion model selected based on Macro F1 score
        # Macro F1 is the documented academic standard for intrusion detection to balance minority attacks
        best_candidate = max(comparison_results, key=lambda x: x["macro_f1"])
        best_model_name = best_candidate["model_name"]
        best_model = trained_models[best_model_name]
        best_metrics = eval_metrics_dict[best_model_name]
        
        TRAINING_STATE["current_step"] = f"Extracting feature importances for champion: {best_model_name}"
        TRAINING_STATE["progress_percent"] = 90
        
        feature_importance_list = extract_feature_importance(
            best_model,
            preprocessor.transformed_feature_names,
            top_n=25,
            X_val=X_test_proc,
            y_val=y_test
        )
        
        # Save artifacts
        TRAINING_STATE["current_step"] = "Saving trained model and evaluation artifacts"
        TRAINING_STATE["progress_percent"] = 95
        
        MODEL_FILE.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(best_model, MODEL_FILE)
        preprocessor.save(PREPROCESSOR_FILE)
        joblib.dump(label_encoder, LABEL_ENCODER_FILE)
        
        metadata = {
            "model_name": best_model_name,
            "version": "1.0.0",
            "mode": mode,
            "trained_at": datetime.now().isoformat(),
            "dataset_name": DATASET_NAME,
            "train_samples": int(len(train_df)),
            "test_samples": int(len(test_df)),
            "num_features": len(FEATURE_COLUMNS),
            "num_transformed_features": len(preprocessor.transformed_feature_names),
            "classes": class_labels,
            "selection_criteria": "Champion chosen by highest Macro F1 score on held-out test data to avoid majority class bias",
            "hyperparameters": {k: str(v) for k, v in best_model.get_params().items()}
        }
        
        with open(METADATA_FILE, "w") as f:
            json.dump(metadata, f, indent=2)
            
        best_metrics["feature_importance"] = feature_importance_list
        with open(METRICS_FILE, "w") as f:
            json.dump(best_metrics, f, indent=2)
            
        with open(COMPARISON_FILE, "w") as f:
            json.dump({
                "selected_model": best_model_name,
                "selection_criteria": "Highest Macro F1-Score on held-out test set",
                "evaluated_at": datetime.now().isoformat(),
                "models": comparison_results
            }, f, indent=2)
            
        # Log to SQLite
        save_training_run(
            best_model_name,
            best_metrics,
            len(train_df),
            len(test_df)
        )
        
        TRAINING_STATE["is_training"] = False
        TRAINING_STATE["current_step"] = f"Training completed successfully. Champion: {best_model_name}"
        TRAINING_STATE["progress_percent"] = 100
        TRAINING_STATE["last_completed"] = datetime.now().isoformat()
        
        return {
            "status": "success",
            "champion_model": best_model_name,
            "comparison": comparison_results,
            "metadata": metadata,
            "metrics": best_metrics
        }
        
    except Exception as e:
        TRAINING_STATE["is_training"] = False
        TRAINING_STATE["error"] = str(e)
        TRAINING_STATE["current_step"] = f"Failed: {str(e)}"
        raise e
