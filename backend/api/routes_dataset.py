from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import Dict, Any, List
from pathlib import Path

from backend.ml.dataset_manager import (
    get_dataset_status,
    download_dataset,
    prepare_dataset_and_samples
)
from backend.config import SAMPLES_DATA_DIR, FEATURE_COLUMNS, ATTACK_CATEGORIES

router = APIRouter()

@router.get("/dataset/status")
def get_status() -> Dict[str, Any]:
    return get_dataset_status()

@router.post("/dataset/download")
def download() -> Dict[str, Any]:
    try:
        return download_dataset()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset download failed: {str(e)}")

@router.post("/dataset/prepare")
def prepare() -> Dict[str, Any]:
    try:
        return prepare_dataset_and_samples()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset preparation failed: {str(e)}")

@router.get("/dataset/features")
def get_features() -> Dict[str, Any]:
    return {
        "features": FEATURE_COLUMNS,
        "total_features": len(FEATURE_COLUMNS),
        "attack_categories": ATTACK_CATEGORIES
    }

@router.get("/dataset/samples")
def list_samples() -> List[Dict[str, Any]]:
    SAMPLES_DATA_DIR.mkdir(parents=True, exist_ok=True)
    sample_files = list(SAMPLES_DATA_DIR.glob("*.csv"))
    res = []
    for f in sample_files:
        res.append({
            "filename": f.name,
            "size_kb": round(f.stat().st_size / 1024, 2),
            "description": (
                "100 Verified Normal Traffic Records" if "normal" in f.name
                else "100 Verified DoS Attack Records" if "dos" in f.name
                else "250 Verified Mixed (Normal & Attack) Records"
            )
        })
    return res

@router.get("/dataset/samples/{filename}")
def download_sample_file(filename: str):
    file_path = SAMPLES_DATA_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Sample dataset file not found.")
    return FileResponse(
        path=file_path,
        media_type="text/csv",
        filename=filename
    )
