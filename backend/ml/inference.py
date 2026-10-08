import json
import uuid
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
import joblib

from backend.config import (
    MODEL_FILE,
    PREPROCESSOR_FILE,
    LABEL_ENCODER_FILE,
    METADATA_FILE,
    FEATURE_COLUMNS,
    ATTACK_CATEGORIES
)
from backend.ml.preprocessor import NIDSPreprocessor
from backend.database.db import save_detection_session

# Cached in-memory model state to avoid disk re-reads on every inference
LOADED_STATE = {
    "model": None,
    "preprocessor": None,
    "label_encoder": None,
    "metadata": None
}

def is_model_loaded() -> bool:
    return (
        MODEL_FILE.exists()
        and PREPROCESSOR_FILE.exists()
        and LABEL_ENCODER_FILE.exists()
        and METADATA_FILE.exists()
    )

def load_inference_artifacts(force_reload: bool = False):
    global LOADED_STATE
    if not is_model_loaded():
        raise FileNotFoundError(
            "Trained model artifacts are not available. Please train or select a model first."
        )
    if LOADED_STATE["model"] is None or force_reload:
        LOADED_STATE["model"] = joblib.load(MODEL_FILE)
        LOADED_STATE["preprocessor"] = NIDSPreprocessor.load(PREPROCESSOR_FILE)
        LOADED_STATE["label_encoder"] = joblib.load(LABEL_ENCODER_FILE)
        with open(METADATA_FILE, "r") as f:
            LOADED_STATE["metadata"] = json.load(f)

def validate_traffic_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Validates uploaded CSV against required NIDS feature specifications.
    Identifies present, missing, and extra columns.
    """
    if df.empty:
        return {
            "is_valid": False,
            "error": "The uploaded CSV file contains 0 records (empty dataset)."
        }
        
    uploaded_cols = [c.strip() for c in df.columns]
    df.columns = uploaded_cols
    
    missing_cols = [col for col in FEATURE_COLUMNS if col not in uploaded_cols]
    present_cols = [col for col in FEATURE_COLUMNS if col in uploaded_cols]
    extra_cols = [col for col in uploaded_cols if col not in FEATURE_COLUMNS]
    
    if len(missing_cols) > 0:
        return {
            "is_valid": False,
            "error": f"Uploaded file is missing {len(missing_cols)} required feature columns.",
            "missing_columns": missing_cols,
            "present_columns": present_cols,
            "total_required": len(FEATURE_COLUMNS),
            "total_present": len(present_cols)
        }
        
    return {
        "is_valid": True,
        "total_records": len(df),
        "columns_count": len(uploaded_cols),
        "present_columns": present_cols,
        "extra_columns": extra_cols
    }

def run_traffic_inference(
    df: pd.DataFrame,
    filename: str = "uploaded_traffic.csv"
) -> Dict[str, Any]:
    """
    Runs genuine machine-learning inference on validated traffic records.
    """
    # 1. Validation
    validation = validate_traffic_dataframe(df)
    if not validation["is_valid"]:
        return {
            "status": "validation_failed",
            "validation": validation
        }
        
    # 2. Artifact verification
    load_inference_artifacts()
    model = LOADED_STATE["model"]
    preprocessor: NIDSPreprocessor = LOADED_STATE["preprocessor"]
    label_encoder = LOADED_STATE["label_encoder"]
    metadata = LOADED_STATE["metadata"]
    
    # 3. Genuine preprocessing transform (strictly using saved pipeline)
    X_proc = preprocessor.transform(df)
    
    # 4. Genuine model prediction
    raw_predictions = model.predict(X_proc)
    predicted_labels = label_encoder.inverse_transform(raw_predictions)
    
    # 5. Prediction probabilities if supported
    probabilities = None
    if hasattr(model, "predict_proba"):
        prob_matrix = model.predict_proba(X_proc)
        # Take highest class probability
        max_probs = np.max(prob_matrix, axis=1)
        probabilities = [round(float(p), 4) for p in max_probs]
    else:
        probabilities = [1.0] * len(predicted_labels)
        
    # 6. Breakdown calculation
    normal_count = 0
    malicious_count = 0
    attack_breakdown: Dict[str, int] = {}
    record_results: List[Dict[str, Any]] = []
    
    for idx, (label, prob) in enumerate(zip(predicted_labels, probabilities)):
        is_normal = (label == "Normal" or label == "normal")
        if is_normal:
            normal_count += 1
            attack_cat = "Normal"
        else:
            malicious_count += 1
            attack_cat = ATTACK_CATEGORIES.get(label.lower(), label if label != "Malicious" else "Malicious Traffic")
            
        attack_breakdown[attack_cat] = attack_breakdown.get(attack_cat, 0) + 1
        
        # Capture relevant row fields for tabular display
        row = df.iloc[idx]
        record_results.append({
            "record_index": idx + 1,
            "protocol_type": str(row.get("protocol_type", "-")),
            "service": str(row.get("service", "-")),
            "flag": str(row.get("flag", "-")),
            "src_bytes": float(row.get("src_bytes", 0.0)) if pd.notna(row.get("src_bytes")) else 0.0,
            "dst_bytes": float(row.get("dst_bytes", 0.0)) if pd.notna(row.get("dst_bytes")) else 0.0,
            "duration": float(row.get("duration", 0.0)) if pd.notna(row.get("duration")) else 0.0,
            "predicted_class": "Normal" if is_normal else "Malicious",
            "attack_category": attack_cat,
            "confidence": prob
        })
        
    total_records = len(df)
    normal_pct = round((normal_count / total_records) * 100, 2) if total_records > 0 else 0.0
    malicious_pct = round((malicious_count / total_records) * 100, 2) if total_records > 0 else 0.0
    avg_conf = round(float(np.mean(probabilities)), 4) if probabilities else 0.0
    
    session_id = f"sess_{uuid.uuid4().hex[:12]}"
    
    # Save session and sample records to SQLite
    save_detection_session(
        session_id=session_id,
        filename=filename,
        total_records=total_records,
        normal_count=normal_count,
        malicious_count=malicious_count,
        model_name=metadata.get("model_name", "Classifier"),
        model_version=metadata.get("version", "1.0.0"),
        attack_breakdown=attack_breakdown,
        avg_confidence=avg_conf,
        sample_records=record_results[:500] # Store up to 500 individual records
    )
    
    return {
        "status": "success",
        "session_id": session_id,
        "filename": filename,
        "model_used": metadata.get("model_name"),
        "model_version": metadata.get("version"),
        "total_records": total_records,
        "normal_count": normal_count,
        "malicious_count": malicious_count,
        "normal_percentage": normal_pct,
        "malicious_percentage": malicious_pct,
        "average_confidence": avg_conf,
        "attack_breakdown": attack_breakdown,
        "records": record_results
    }
