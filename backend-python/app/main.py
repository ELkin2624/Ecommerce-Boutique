from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.modules.auth.router import router as auth_router
from app.modules.catalog.router import router as catalog_router
from app.modules.inventory.router import router as inventory_router
from app.modules.orders.router import router as orders_router
from app.modules.orders.router import cart_router
from app.modules.orders.router import admin_order_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="FashionStore Omnichannel E-commerce API — Modular Monolith Architecture",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
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

# Register Module Routers
app.include_router(
    auth_router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["Authentication & Authorization"],
)

app.include_router(
    catalog_router,
    prefix=f"{settings.API_V1_STR}/catalog",
    tags=["Catalog & Products"],
)

app.include_router(
    inventory_router,
    prefix=f"{settings.API_V1_STR}/inventory",
    tags=["Inventory & Stock"],
)

app.include_router(
    cart_router,
)

app.include_router(
    orders_router,
)

app.include_router(
    admin_order_router,
)


@app.get("/", tags=["Health Check"])
def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "healthy",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health Check"])
def health_check():
    return {
        "status": "online",
        "environment": settings.ENVIRONMENT,
    }
