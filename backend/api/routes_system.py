from fastapi import APIRouter
import platform
from datetime import datetime

from backend.config import APP_VERSION
from backend.ml.dataset_manager import get_dataset_status
from backend.ml.inference import is_model_loaded
from backend.database.db import get_all_detection_sessions

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": APP_VERSION
    }

@router.get("/system/status")
def system_status():
    dataset_info = get_dataset_status()
    model_ready = is_model_loaded()
    sessions = get_all_detection_sessions(limit=5)
    
    total_detections = sum(s["total_records"] for s in sessions)
    total_malicious = sum(s["malicious_count"] for s in sessions)
    
    return {
        "backend_connected": True,
        "app_version": APP_VERSION,
        "os": platform.platform(),
        "python_version": platform.python_version(),
        "dataset_available": dataset_info["is_available"],
        "dataset_name": dataset_info["dataset_name"],
        "model_trained": model_ready,
        "total_historical_sessions": len(sessions),
        "total_historical_records_analyzed": total_detections,
        "total_historical_malicious_detected": total_malicious,
        "system_time": datetime.now().isoformat()
    }
