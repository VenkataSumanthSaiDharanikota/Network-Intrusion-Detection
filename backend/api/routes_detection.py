import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
import pandas as pd
from typing import Dict, Any, List

from backend.ml.inference import (
    run_traffic_inference,
    validate_traffic_dataframe,
    is_model_loaded
)
from backend.database.db import (
    get_all_detection_sessions,
    get_detection_session_records
)

router = APIRouter()

@router.post("/detection/upload")
async def upload_and_detect(file: UploadFile = File(...)):
    # 1. Check model availability
    if not is_model_loaded():
        raise HTTPException(
            status_code=400,
            detail="Trained model is not available. Please train or load a model on the Model page first."
        )
        
    # 2. Validate file type
    filename = file.filename or "uploaded_traffic.csv"
    if not (filename.endswith(".csv") or filename.endswith(".txt")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload a standard CSV or TXT network traffic file."
        )
        
    # 3. Read content with size check (limit 50MB)
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty (0 bytes).")
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Uploaded file exceeds 50MB size limit.")
        
    # 4. Parse CSV
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse CSV file: {str(e)}. Ensure file is properly formatted comma-separated values."
        )
        
    # 5. Execute inference
    try:
        results = run_traffic_inference(df, filename=filename)
        if results.get("status") == "validation_failed":
            return {
                "success": False,
                "error": results["validation"].get("error"),
                "validation": results["validation"]
            }
            
        return {
            "success": True,
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference execution failed: {str(e)}")

@router.get("/detection/history")
def get_history(limit: int = 50) -> List[Dict[str, Any]]:
    return get_all_detection_sessions(limit=limit)

@router.get("/detection/session/{session_id}")
def get_session_details(session_id: str, limit: int = 200) -> Dict[str, Any]:
    sessions = get_all_detection_sessions(limit=100)
    matched = next((s for s in sessions if s["session_id"] == session_id), None)
    if not matched:
        raise HTTPException(status_code=404, detail="Detection session not found.")
        
    records = get_detection_session_records(session_id, limit=limit)
    return {
        "session": matched,
        "records": records
    }

@router.get("/detection/session/{session_id}/export")
def export_session_csv(session_id: str):
    records = get_detection_session_records(session_id, limit=5000)
    if not records:
        raise HTTPException(status_code=404, detail="No records found for session export.")
        
    df = pd.DataFrame(records)
    # Remove internal id columns
    cols_to_export = [
        "record_index", "protocol_type", "service", "flag",
        "src_bytes", "dst_bytes", "predicted_class", "attack_category", "confidence"
    ]
    export_cols = [c for c in cols_to_export if c in df.columns]
    
    csv_buffer = io.StringIO()
    df[export_cols].to_csv(csv_buffer, index=False)
    
    return Response(
        content=csv_buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=nids_predictions_{session_id}.csv"}
    )
