"""
OSINT Threat Intelligence Police News Ingestion Router
=====================================================
FastAPI endpoint for ingesting, verifying, and extracting confirmed PDRM CCID
mule bank accounts into the in-memory and on-disk SemakMule threat cache.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from backend.services.osint_mule_ingestion import (
    IngestionPipelineResult,
    VerificationStatus,
    verify_and_ingest_police_news,
)

router = APIRouter(prefix="/api/v1/intel", tags=["OSINT Threat Intelligence"])


class IngestPoliceAlertRequest(BaseModel):
    headline: str = Field(..., min_length=5, description="Headline of the police news alert")
    source_url: str = Field(..., min_length=8, description="Source URL of the police alert or news article")
    content: str = Field(..., min_length=10, description="Full text or excerpt of the news article")


@router.post(
    "/ingest-police-alert",
    response_model=IngestionPipelineResult,
    status_code=status.HTTP_200_OK,
    summary="Ingest and Verify Police OSINT Alert for SemakMule Threat Cache",
)
async def ingest_police_alert(payload: IngestPoliceAlertRequest):
    """
    Ingests inbound police news reports:
      - Stage 1: Verifies source credibility and checks against fake news / threat cache poisoning.
      - Stage 2: Extracts and normalizes confirmed mule bank accounts.
      - Atomic Hydration: Updates SemakMule threat cache in memory and on disk.
    """
    result = verify_and_ingest_police_news(
        headline=payload.headline,
        source_url=payload.source_url,
        content=payload.content,
    )

    if result.verification.status == VerificationStatus.SUSPECTED_FAKE_NEWS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "SUSPECTED_FAKE_NEWS",
                "message": "Ingestion rejected: Suspected fake news, satire, or unverified rumor detected.",
                "reasoning": result.verification.source_credibility_reasoning,
                "confidence_score": result.verification.confidence_score,
            },
        )

    return result
