"""FastAPI application entry point for SME-ScamGuard-AI platform.

Initializes middleware, security policies, REST routing, and root telemetry.
"""

from typing import Dict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router

app = FastAPI(
    title="SME-ScamGuard-AI Security Platform",
    version="1.0.0",
    description="Local-first deterministic multi-agent defense system against SME BEC and invoice fraud.",
)

# Enable permissive CORS for local frontend SOC dashboard integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST endpoints under /api
app.include_router(api_router)


@app.get("/", tags=["System"])
async def root() -> Dict[str, str]:
    """Root entry point providing platform status and Swagger UI pointer."""
    return {
        "message": "SME-ScamGuard-AI API is running. Visit /docs for Swagger UI documentation."
    }
