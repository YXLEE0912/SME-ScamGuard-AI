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
  sha256?: string;
  is_duplicate_submission?: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: "System note" | "Re-extracted with Gemini" | "Clerk Correction" | "Payment Approved" | "Escalated" | "New Ingestion" | string;
  badge_color?: string;
  description: string;
  justification: string;
  operator_id: string;
  event_hash?: string;
  prior_hash?: string;
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
  status?: string;
  case_id?: string;
  record?: DemoInvoice;
  detail?: string;
  pipeline_result?: Record<string, unknown>;
}

export interface UploadLedgerResult {
  vendors_loaded: number;
  ledger_sha256: string;
  detail?: string;
}

export interface PoliceAlertPayload {
  headline: string;
  source_url: string;
  content: string;
}

export async function fetchMailboxInvoices(): Promise<DemoInvoice[]> {
  // 1. Try canonical queue endpoint first (Phase 6)
  try {
    const res = await fetch(`${API_BASE}/api/v1/queue`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.invoices && Array.isArray(data.invoices)) {
        return data.invoices;
      }
    }
  } catch (err) {
    console.warn("Queue endpoint unavailable, attempting demo mailbox fallback:", err);
  }

  // 2. Fallback to demo mailbox endpoint
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
  // 1. Try canonical queue detail endpoint first (Phase 6)
  try {
    const res = await fetch(`${API_BASE}/api/v1/queue/${id}`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Queue case detail failed for ${id}, attempting demo fallback:`, err);
  }

  // 2. Fallback to demo mailbox detail endpoint
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
  official_landline_dialed?: string;
}): Promise<Record<string, unknown>> {
  // 1. Try canonical override endpoint (Phase 6)
  try {
    const res = await fetch(`${API_BASE}/api/v1/queue/${payload.invoice_id}/override`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_name: payload.field_name,
        corrected_value: payload.corrected_value,
        justification: payload.justification,
        clerk_id: payload.clerk_id,
        official_landline_dialed: payload.official_landline_dialed || null,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Canonical override endpoint failed, falling back to demo endpoint:", err);
  }

  // 2. Fallback to demo correct-field endpoint
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

export async function approveInvoice(
  invoiceId: string,
  clerkId: string = "AP-CLERK-MY01",
  notes?: string
): Promise<Record<string, unknown>> {
  // 1. Try canonical decide endpoint (Phase 6)
  try {
    const res = await fetch(`${API_BASE}/api/v1/queue/${invoiceId}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "APPROVE",
        clerk_id: clerkId,
        reason: notes || "Pre-disbursement 3-way reconciliation verified.",
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Canonical decide APPROVE failed, falling back to demo approve:", err);
  }

  // 2. Fallback to demo approve endpoint
  const res = await fetch(`${API_BASE}/api/v1/demo/approve/${invoiceId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clerk_id: clerkId, notes }),
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
  // 1. Try canonical decide endpoint (Phase 6)
  try {
    const res = await fetch(`${API_BASE}/api/v1/queue/${invoiceId}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "FREEZE",
        clerk_id: clerkId,
        reason: reason,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Canonical decide FREEZE failed, falling back to demo escalate:", err);
  }

  // 2. Fallback to demo escalate endpoint
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
  // 1. Try canonical chained audit trail endpoint (Phase 6)
  try {
    const res = await fetch(`${API_BASE}/api/v1/audit/trail`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.events && Array.isArray(data.events)) {
        return data.events.map((raw: Record<string, unknown>, idx: number) => ({
          id: String(raw.id || raw.event_id || `evt_${idx + 1}`),
          timestamp: String(raw.timestamp || raw.timestamp_utc || new Date().toISOString()),
          action: String(raw.action || "Audit Record"),
          badge_color: String(raw.badge_color || "neutral"),
          description: String(raw.description || `Audit event for case ${raw.case_id || ""}`),
          justification: String(raw.justification || ""),
          operator_id: String(raw.operator_id || "AP-CLERK-MY01"),
          event_hash: raw.event_hash ? String(raw.event_hash) : undefined,
          prior_hash: raw.prior_hash ? String(raw.prior_hash) : undefined,
        }));
      }
    }
  } catch (err) {
    console.warn("Audit trail endpoint unavailable, attempting demo fallback:", err);
  }

  // 2. Fallback to demo session audit
  try {
    const res = await fetch(`${API_BASE}/api/v1/demo/audit`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return data.events || [];
    }
  } catch (err) {
    console.warn("Demo audit trail fetch failed:", err);
  }
  return [];
}

export async function uploadNewVerification(file: File, supportingFile?: File): Promise<UploadVerificationResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (supportingFile) {
    formData.append("supporting_file", supportingFile);
  }

  // 1. Try canonical /api/v1/verify endpoint (Phase 6)
  try {
    const res = await fetch(`${API_BASE}/api/v1/verify`, {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Canonical verify endpoint failed, attempting demo upload:", err);
  }

  // 2. Fallback to demo upload
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

export async function ingestPoliceAlert(alert: PoliceAlertPayload): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/v1/intel/ingest-police-alert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alert),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { detail?: unknown };
    throw new Error(JSON.stringify(data.detail) || `OSINT alert ingestion failed: ${res.statusText}`);
  }
  return await res.json();
}
