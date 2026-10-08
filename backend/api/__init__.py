from fastapi import APIRouter
from .routes_system import router as system_router
from .routes_dataset import router as dataset_router
from .routes_model import router as model_router
from .routes_detection import router as detection_router
from .routes_analytics import router as analytics_router

api_router = APIRouter()
api_router.include_router(system_router, tags=["System"])
api_router.include_router(dataset_router, tags=["Dataset"])
api_router.include_router(model_router, tags=["Model"])
api_router.include_router(detection_router, tags=["Detection"])
api_router.include_router(analytics_router, tags=["Analytics"])
