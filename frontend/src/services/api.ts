// API client for ScamGuard.AI Verification Cockpit
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export interface ComparisonField {
  truth: string;
  draft: string;
  original_draft?: string;
  status: "match" | "defect" | "corrected";
  score: number;
  justification?: string;
  corrected_by?: string;
}

export interface DemoInvoice {
  id: string;
  subject: string;
  sender_name: string;
  sender_email: string;
  category: string;
  status: "VERIFIED" | "NEEDS_REVIEW" | "LOCKED_CRITICAL" | "DEFECT";
  risk_score: number;
  received_date: string;
  files: string[];
  comparison: Record<string, ComparisonField>;
  banner_message: string;
  defect_fields: number;
  can_extract_live: boolean;
  is_approved?: boolean;
  is_escalated?: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: "System note" | "Re-extracted with Gemini" | "Clerk Correction" | "Payment Approved" | "Escalated" | "New Ingestion";
  badge_color: string;
  description: string;
  justification: string;
  operator_id: string;
}

export interface ReExtractResult {
  status: string;
  extracted_fields?: {
    confidence_score?: number;
    vendor_name?: string;
    bank_name?: string;
    account_no?: string;
    amount?: string;
  };
}

export interface UploadVerificationResult {
  record?: DemoInvoice;
  detail?: string;
}

export interface UploadLedgerResult {
  vendors_loaded: number;
  ledger_sha256: string;
  detail?: string;
}

export async function fetchMailboxInvoices(): Promise<DemoInvoice[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/demo/mailbox`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.invoices && Array.isArray(data.invoices)) {
        return data.invoices;
      }
    }
  } catch (err) {
    console.warn("Backend API unavailable, falling back to local session store:", err);
  }
  return [];
}

export async function fetchInvoiceById(id: string): Promise<DemoInvoice | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/demo/mailbox/${id}`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API unavailable:", err);
  }
  return null;
}

export async function reExtractWithGemini(invoiceId: string): Promise<ReExtractResult> {
  const res = await fetch(`${API_BASE}/api/v1/demo/re-extract/${invoiceId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Re-extraction failed: ${res.statusText}`);
  }
  return await res.json();
}

export async function correctInvoiceField(payload: {
  invoice_id: string;
  field_name: string;
  corrected_value: string;
  justification: string;
  clerk_id: string;
}): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/v1/demo/correct-field`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Field correction failed: ${res.statusText}`);
  }
  return await res.json();
}

export async function approveInvoice(invoiceId: string, clerkId: string = "AP-CLERK-MY01"): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/v1/demo/approve/${invoiceId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clerk_id: clerkId }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(data.detail || `Approval failed: ${res.statusText}`);
  }
  return await res.json();
}

export async function escalateInvoice(
  invoiceId: string,
  reason: string,
  clerkId: string = "AP-CLERK-MY01"
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/v1/demo/escalate/${invoiceId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, clerk_id: clerkId }),
  });
  if (!res.ok) {
    throw new Error(`Escalation failed: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchAuditTrail(): Promise<AuditEvent[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/demo/audit`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return data.events || [];
    }
  } catch (err) {
    console.warn("Audit trail fetch failed:", err);
  }
  return [];
}

export async function uploadNewVerification(file: File, supportingFile?: File): Promise<UploadVerificationResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (supportingFile) {
    formData.append("supporting_file", supportingFile);
  }
  const res = await fetch(`${API_BASE}/api/v1/demo/new-verification`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(data.detail || `Upload failed: ${res.statusText}`);
  }
  return await res.json();
}

export async function uploadMasterLedgerCsv(file: File): Promise<UploadLedgerResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/v1/ledger/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(data.detail || `CSV sync failed: ${res.statusText}`);
  }
  return await res.json();
}
