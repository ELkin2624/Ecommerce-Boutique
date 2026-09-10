from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.modules.recommendations.router import router as recommendations_router
from app.modules.generative_reports.router import router as reports_router
from app.modules.virtual_fitting.router import router as fitting_router
from app.modules.assistant.router import router as assistant_router

app = FastAPI(
    title="FashionStore AI Microservice",
    version="2.1.0",
    description="Microservicio de Inteligencia Artificial para FashionStore — Recomendaciones, Reportes Generativos, Estimación de Talla y Asistente",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register AI Routers
app.include_router(
    recommendations_router,
    prefix="/ai",
    tags=["1. Recomendador Inteligente"],
)

app.include_router(
    reports_router,
    prefix="/ai/reports",
    tags=["2. Reportes Generativos (Voz y Texto)"],
)

app.include_router(
    fitting_router,
    prefix="/ai/fitting",
    tags=["3. Probador Virtual y Estimación de Tallas"],
)

app.include_router(
    assistant_router,
    prefix="/ai/assistant",
    tags=["4. Asistente Conversacional"],
)


@app.get("/", tags=["Health Check"])
def root():
    return {
        "service": "FashionStore AI Microservice",
        "status": "healthy",
        "mock_mode": settings.MOCK_MODE,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health Check"])
def health_check():
    return {
        "status": "online",
        "environment": settings.ENVIRONMENT,
        "mock_mode": settings.MOCK_MODE,
        "model": settings.AI_MODEL_NAME,
    }
