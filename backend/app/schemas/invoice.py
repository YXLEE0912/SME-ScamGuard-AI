from typing import Optional, List
from pydantic import BaseModel, Field


class ExtractedInvoiceFields(BaseModel):
    vendor_name: Optional[str] = Field(
        None, description="Official company or trade name of the billing entity"
    )
    invoice_number: Optional[str] = Field(
        None, description="Invoice reference code or identifier"
    )
    invoice_date: Optional[str] = Field(
        None, description="Date of issuance formatted as YYYY-MM-DD"
    )
    total_amount: Optional[float] = Field(
        None, description="Net total payable amount in numerical float"
    )
    currency: Optional[str] = Field(
        "MYR", description="Currency ISO code (e.g. MYR, USD, SGD)"
    )
    bank_name: Optional[str] = Field(
        None, description="Name of the beneficiary financial institution"
    )
    bank_account_number: Optional[str] = Field(
        None, description="Remittance bank account number without spaces"
    )
    recipient_name: Optional[str] = Field(
        None,
        description="Beneficiary account holder title or registered entity name",
    )
    po_number: Optional[str] = Field(
        None, description="Purchase Order reference number (e.g. PO-ML-8812)"
    )
    confidence_score: float = Field(
        ..., description="Overall model extraction confidence between 0.0 and 1.0"
    )
    review_reasons: List[str] = Field(
        default_factory=list,
        description="Explanations for ambiguous or conflicting fields",
    )
