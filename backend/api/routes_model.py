import json
import threading
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any

from backend.config import (
    MODEL_FILE,
    METADATA_FILE,
    METRICS_FILE,
    COMPARISON_FILE
)
from backend.ml.trainer import (
    run_model_training_and_comparison,
    get_training_state,
    TRAINING_STATE
)
from backend.ml.inference import is_model_loaded, load_inference_artifacts

router = APIRouter()

class TrainRequest(BaseModel):
    mode: str = "binary"  # "binary" or "multiclass"
    sample_size: Optional[int] = None

@router.get("/model/status")
def get_model_status():
    trained = is_model_loaded()
    metadata = {}
    if trained and METADATA_FILE.exists():
        try:
            with open(METADATA_FILE, "r") as f:
                metadata = json.load(f)
        except Exception:
            pass
            
    return {
        "is_trained": trained,
        "metadata": metadata,
        "training_state": get_training_state()
    }

def _background_train_task(mode: str, sample_size: Optional[int]):
    try:
        run_model_training_and_comparison(mode=mode, sample_size=sample_size)
        # Reload memory cache with newly trained model
        load_inference_artifacts(force_reload=True)
    except Exception as e:
        print(f"Error during training: {e}")

@router.post("/model/train")
def train_model(req: TrainRequest, background_tasks: BackgroundTasks):
    state = get_training_state()
    if state["is_training"]:
        return {
            "status": "already_running",
            "message": "A model training process is currently active.",
            "state": state
        }
        
    background_tasks.add_task(_background_train_task, req.mode, req.sample_size)
    return {
        "status": "training_started",
        "message": "Model training and multi-algorithm evaluation pipeline initiated in background.",
        "mode": req.mode
    }

@router.get("/model/train/status")
def train_status():
    return get_training_state()

@router.get("/model/metrics")
def get_metrics():
    if not METRICS_FILE.exists():
        raise HTTPException(status_code=404, detail="No evaluation metrics found. Please train a model first.")
    with open(METRICS_FILE, "r") as f:
        metrics = json.load(f)
    return metrics

@router.get("/model/features")
def get_features():
    if not METRICS_FILE.exists():
        raise HTTPException(status_code=404, detail="Model features not found. Please train a model first.")
    with open(METRICS_FILE, "r") as f:
        metrics = json.load(f)
    return {
        "feature_importance": metrics.get("feature_importance", [])
    }

@router.get("/model/comparison")
def get_comparison():
    if not COMPARISON_FILE.exists():
        raise HTTPException(status_code=404, detail="No model comparison data found. Please run training first.")
    with open(COMPARISON_FILE, "r") as f:
        data = json.load(f)
    return data

@router.post("/model/reload")
def reload_model():
    try:
        load_inference_artifacts(force_reload=True)
        return {"status": "reloaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
