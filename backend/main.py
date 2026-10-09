import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import APP_VERSION, API_PREFIX
from backend.api import api_router
from backend.database.db import init_db
from backend.ml.inference import is_model_loaded, load_inference_artifacts

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    init_db()
    
    # Try loading existing model artifacts into memory if trained
    if is_model_loaded():
        try:
            load_inference_artifacts()
            print("[NIDS Backend] Model artifacts loaded successfully.")
        except Exception as e:
            print(f"[NIDS Backend] Warning: Could not pre-load model artifacts: {e}")
    else:
        print("[NIDS Backend] No pre-existing model found. System ready for dataset & training workflow.")
        
    yield
    
    # Shutdown logic if any
    print("[NIDS Backend] Shutting down.")

app = FastAPI(
    title="Network Intrusion Detection System (NIDS) API",
    description="IEEE Ignite Problem Statement 33 — Machine Learning-Powered Network Intrusion Detection System",
    version=APP_VERSION,
    lifespan=lifespan
)

# CORS Middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core API routes under /api
app.include_router(api_router, prefix=API_PREFIX)

# Serve built React frontend from frontend/dist (for unified Render deployment)
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Let FastAPI handle /api, /docs, /redoc, /openapi.json
        if full_path.startswith("api") or full_path in ("docs", "redoc", "openapi.json"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        target_file = frontend_dist / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "project": "Network Intrusion Detection System",
            "competition": "IEEE Ignite — Problem Statement 33",
            "version": APP_VERSION,
            "docs": "/docs",
            "api_prefix": API_PREFIX
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
