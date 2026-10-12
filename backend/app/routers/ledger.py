from fastapi import APIRouter, UploadFile, File, HTTPException, status
from backend.app.schemas.ledger import LedgerSyncResponse
from backend.services.ledger_sync import (
    sync_ledger_from_csv,
    get_active_ledger,
    CURRENT_LEDGER_SHA256,
    LAST_SYNC_TIMESTAMP,
)

router = APIRouter(prefix="/api/v1/ledger", tags=["Master Ledger"])


@router.post("/upload", response_model=LedgerSyncResponse)
async def upload_master_ledger(file: UploadFile = File(...)):
    """
    On-premise CSV sync endpoint.
    Accepts AutoCount, SQL Account, or standard CSV format export.
    Zero-disk runtime: parses purely in volatile memory.
    """
    if not file.filename or not file.filename.lower().endswith((".csv", ".txt")):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File must be a .csv or .txt comma-delimited export file.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded file is empty.",
        )

    # Determine source format heuristic from filename
    lower_fn = file.filename.lower()
    source_fmt = "AutoCount_CSV"
    if "sql" in lower_fn:
        source_fmt = "SQL_Account_CSV"
    elif "sap" in lower_fn:
        source_fmt = "SAP_Ledger_CSV"

    result = sync_ledger_from_csv(content, source_format=source_fmt)
    return result


@router.get("")
async def get_master_ledger_status():
    """Retrieve in-memory vendor ledger status and list of approved suppliers."""
    ledger = get_active_ledger()
    return {
        "status": "active",
        "vendors_count": len(ledger),
        "ledger_sha256": CURRENT_LEDGER_SHA256,
        "last_sync": LAST_SYNC_TIMESTAMP,
        "vendors": list(ledger.values()),
    }
