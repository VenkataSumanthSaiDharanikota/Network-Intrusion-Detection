import json
from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from backend.config import METRICS_FILE, PROCESSED_DATA_DIR
from backend.database.db import get_all_detection_sessions

router = APIRouter()

@router.get("/analytics/class-distribution")
def get_class_distribution() -> Dict[str, Any]:
    dataset_dist = {}
    summary_file = PROCESSED_DATA_DIR / "dataset_summary.json"
    if summary_file.exists():
        with open(summary_file, "r") as f:
            dataset_dist = json.load(f).get("class_distribution", {})
            
    # Also aggregate real detection distribution from SQLite
    sessions = get_all_detection_sessions(limit=100)
    detection_dist = {}
    total_detected = 0
    for s in sessions:
        breakdown = s.get("attack_breakdown", {})
        for cat, count in breakdown.items():
            detection_dist[cat] = detection_dist.get(cat, 0) + count
            total_detected += count
            
    return {
        "dataset_distribution": dataset_dist,
        "detection_distribution": detection_dist,
        "total_historical_detected": total_detected
    }

@router.get("/analytics/confusion-matrix")
def get_confusion_matrix() -> Dict[str, Any]:
    if not METRICS_FILE.exists():
        raise HTTPException(status_code=404, detail="No evaluation metrics found. Please train a model first.")
    with open(METRICS_FILE, "r") as f:
        metrics = json.load(f)
    return {
        "confusion_matrix": metrics.get("confusion_matrix", {}),
        "test_distribution": metrics.get("test_distribution", {})
    }

@router.get("/analytics/feature-importance")
def get_feature_importance() -> Dict[str, Any]:
    if not METRICS_FILE.exists():
        raise HTTPException(status_code=404, detail="No feature metrics found. Please train a model first.")
    with open(METRICS_FILE, "r") as f:
        metrics = json.load(f)
    return {
        "features": metrics.get("feature_importance", [])
    }

@router.get("/analytics/overview")
def get_overview() -> Dict[str, Any]:
    sessions = get_all_detection_sessions(limit=50)
    metrics = {}
    if METRICS_FILE.exists():
        with open(METRICS_FILE, "r") as f:
            metrics = json.load(f)
            
    total_analyzed = sum(s["total_records"] for s in sessions)
    total_normal = sum(s["normal_count"] for s in sessions)
    total_malicious = sum(s["malicious_count"] for s in sessions)
    
    return {
        "total_sessions": len(sessions),
        "total_records_analyzed": total_analyzed,
        "total_normal": total_normal,
        "total_malicious": total_malicious,
        "malicious_rate_pct": round((total_malicious / total_analyzed) * 100, 2) if total_analyzed > 0 else 0.0,
        "model_accuracy": metrics.get("accuracy"),
        "model_macro_f1": metrics.get("macro_f1"),
        "model_precision": metrics.get("precision"),
        "model_recall": metrics.get("recall")
    }
