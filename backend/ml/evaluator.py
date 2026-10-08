import numpy as np
from typing import Dict, Any, List
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

def evaluate_model(
    model: Any,
    X_test: np.ndarray,
    y_test: np.ndarray,
    class_labels: List[str]
) -> Dict[str, Any]:
    """
    Computes genuine evaluation metrics on the held-out test dataset.
    Never returns hardcoded or fabricated values.
    """
    y_pred = model.predict(X_test)
    
    # Core classification metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec_macro = float(precision_score(y_test, y_pred, average='macro', zero_division=0))
    rec_macro = float(recall_score(y_test, y_pred, average='macro', zero_division=0))
    f1_macro = float(f1_score(y_test, y_pred, average='macro', zero_division=0))
    f1_weighted = float(f1_score(y_test, y_pred, average='weighted', zero_division=0))
    
    # Binary/default metrics if 2 classes
    if len(class_labels) == 2:
        prec = float(precision_score(y_test, y_pred, average='binary', zero_division=0))
        rec = float(recall_score(y_test, y_pred, average='binary', zero_division=0))
        f1 = float(f1_score(y_test, y_pred, average='binary', zero_division=0))
    else:
        prec = prec_macro
        rec = rec_macro
        f1 = f1_macro
        
    # Real Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    cm_dict = {
        "matrix": cm.tolist(),
        "labels": class_labels
    }
    
    # Real Classification Report
    cr_dict = classification_report(
        y_test,
        y_pred,
        target_names=class_labels,
        output_dict=True,
        zero_division=0
    )
    
    # Class distribution in test set
    unique_classes, counts = np.unique(y_test, return_counts=True)
    test_distribution = {
        class_labels[c]: int(count) for c, count in zip(unique_classes, counts)
    }
    
    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "macro_f1": round(f1_macro, 4),
        "weighted_f1": round(f1_weighted, 4),
        "macro_precision": round(prec_macro, 4),
        "macro_recall": round(rec_macro, 4),
        "confusion_matrix": cm_dict,
        "classification_report": cr_dict,
        "test_distribution": test_distribution,
        "test_records": int(len(y_test))
    }

def extract_feature_importance(
    model: Any,
    feature_names: List[str],
    top_n: int = 20,
    X_val: Optional[np.ndarray] = None,
    y_val: Optional[np.ndarray] = None
) -> List[Dict[str, Any]]:
    """
    Extracts real feature importances from tree-based models, normalized coefficients from linear models,
    or permutation importance for HistGradientBoosting.
    """
    importances = None
    
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "coef_"):
        coef = model.coef_
        if coef.ndim > 1:
            importances = np.mean(np.abs(coef), axis=0)
        else:
            importances = np.abs(coef)
    elif X_val is not None and y_val is not None:
        try:
            from sklearn.inspection import permutation_importance
            sample_limit = min(500, len(X_val))
            perm_res = permutation_importance(
                model, X_val[:sample_limit], y_val[:sample_limit],
                n_repeats=3, random_state=42, n_jobs=-1
            )
            importances = np.maximum(0, perm_res.importances_mean)
        except Exception:
            importances = None
            
    if importances is None or len(importances) != len(feature_names):
        return []
        
    # Normalize importances so they sum to 1.0 (or percentage)
    total = np.sum(importances)
    if total > 0:
        norm_importances = importances / total
    else:
        norm_importances = importances
        
    # Pair, sort, and rank
    indexed_importances = sorted(
        zip(feature_names, norm_importances),
        key=lambda x: x[1],
        reverse=True
    )
    
    results = []
    for rank, (name, val) in enumerate(indexed_importances[:top_n], start=1):
        results.append({
            "rank": rank,
            "feature": name,
            "importance": round(float(val), 5),
            "percentage": round(float(val) * 100, 2)
        })
        
    return results
