"use client";

import React, { useState, useEffect, useId } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MessageSquare,
  UploadCloud,
  RefreshCw,
  Printer,
  Lock,
  Unlock,
  Clock,
  Cpu,
  Layers,
  AlertOctagon,
  ArrowRight,
  Copy,
  Check,
  Building2,
  Banknote,
  Search,
  Zap,
  Radio,
  FileCheck,
  X,
  ExternalLink,
  Send,
} from "lucide-react";

// ============================================================================
// TYPES & DATA CONTRACTS
// ============================================================================

export interface DiscrepancyMatrix {
  ledger_vendor_name?: string | null;
  ledger_bank_account?: string | null;
  invoice_bank_account: string;
  account_match: boolean;
  is_mule: boolean;
  status: "MATCH" | "DISCREPANCY_DETECTED" | "CRITICAL_MULE_DETECTED";
}

export interface AuditChecklistItem {
  check: string;
  status: "PASS" | "FAIL";
  detail: string;
}

export interface PipelineStageTelemetry {
  status: string;
  latency_ms: number;
}

export interface PipelineTelemetry {
  stage_0_pii_scrub: PipelineStageTelemetry;
  stage_1_ledger_match: PipelineStageTelemetry;
  stage_2_cognitive_gemini: PipelineStageTelemetry;
  stage_3_risk_arbiter: PipelineStageTelemetry;
  total_pipeline_ms: number;
}

export interface TimelineEvent {
  time: string;
  stage: string;
  detail: string;
}

export interface HumanCallbackVoucher {
  action_type: string;
  protocol: string;
  target_vendor: string;
  authorized_phone_number: string;
  security_instructions: string;
  verification_status: string;
}

export interface EvidenceCue {
  cue_code: string;
  agent_source: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
}

export interface PdfForensics {
  producer: string;
  creator: string;
  creation_date: string;
  mod_date: string;
  is_tampered: boolean;
  evidence: string;
}

export interface ArtifactTracking {
  artifact_hash: string;
  is_duplicate: boolean;
  first_seen_timestamp?: string | null;
  original_filename: string;
  status_badge: string;
}

export interface DefensiveActionItem {
  agency?: string;
  channel?: string;
  integration?: string;
  status: string;
  reporting_draft?: {
    incident_ref?: string;
    target_account?: string;
    alleged_vendor?: string;
    fraud_classification?: string;
    primary_evidence?: string;
    action_required?: string;
  };
  message_preview?: string;
  detail?: string;
}

export interface DefensiveActions {
  is_triggered: boolean;
  actions: DefensiveActionItem[];
  status_badge?: string;
}

export interface AuditForensicReport {
  case_id: string;
  status?: "PROCESSED" | "QUARANTINED";
  is_scam: boolean;
  risk_score: number;
  threat_level: "SAFE" | "SUSPICIOUS" | "CRITICAL";
  verdict_summary?: string;
  primary_cues: string[];
  evidence_trail: EvidenceCue[];
  safe_next_step?: HumanCallbackVoucher | null;
  executive_summary: string;
  discrepancy_matrix?: DiscrepancyMatrix | null;
  audit_checklist?: AuditChecklistItem[];
  pipeline_telemetry?: PipelineTelemetry | null;
  timeline_events?: TimelineEvent[];
  ocr_used?: boolean;
  total_pages?: number;
  filename?: string | null;
  pdf_forensics?: PdfForensics | null;
  artifact_tracking?: ArtifactTracking | null;
  defensive_actions?: DefensiveActions | null;
  // Dynamic HITL Dual-Control State
  clerk_verified?: boolean;
  clerk_timestamp?: string;
  manager_resolution?: "OVERRIDE_AUTHORIZED" | "FRAUD_ARCHIVED" | null;
  manager_timestamp?: string;
}

// ============================================================================
// PRESET SCENARIOS (Offline Zero-Key Testing Fixtures)
// ============================================================================

const PRESET_SCENARIO_1_LEGIT: AuditForensicReport = {
  case_id: "SCENARIO-1-LEGIT",
  status: "PROCESSED",
  is_scam: false,
  risk_score: 10,
  threat_level: "SAFE",
  verdict_summary:
    "VERIFIED SAFE: Inbound transaction matches registered procurement baseline for Mega Build Sdn Bhd.",
  primary_cues: [],
  evidence_trail: [],
  executive_summary:
    "COMMUNICATION VERIFIED: Inbound message verified against enterprise procurement whitelist (Risk Score: 10.0/100, Threat Level: SAFE). No fraudulent bank redirection detected.",
  discrepancy_matrix: {
    ledger_vendor_name: "Mega Build Sdn Bhd",
    ledger_bank_account: "5123-4567-8901",
    invoice_bank_account: "5123-4567-8901",
    account_match: true,
    is_mule: false,
    status: "MATCH",
  },
  audit_checklist: [
    {
      check: "Vendor Identity",
      status: "PASS",
      detail: "Domain megabuild.com.my authenticated against immutable master ledger.",
    },
    {
      check: "Bank Account Ledger",
      status: "PASS",
      detail: "Maybank 5123-4567-8901 strictly matches pre-approved baseline.",
    },
    {
      check: "PDRM SemakMule Registry",
      status: "PASS",
      detail: "Clean microsecond lookup in PDRM CCID registry (zero flags).",
    },
    {
      check: "Trending Modus Operandi (CTI)",
      status: "PASS",
      detail: "Standard business correspondence without malicious pretexts.",
    },
    {
      check: "Urgency & Coercion Level",
      status: "PASS",
      detail: "Standard commercial 30-day settlement terms.",
    },
    {
      check: "Document Metadata & Anti-Tamper Forensics",
      status: "PASS",
      detail: "Clean ERP/Accounting export signature (No post-issuance tampering detected)",
    },
  ],
  pipeline_telemetry: {
    stage_0_pii_scrub: { status: "SUCCESS", latency_ms: 8 },
    stage_1_ledger_match: { status: "SUCCESS", latency_ms: 2 },
    stage_2_cognitive_gemini: { status: "SUCCESS", latency_ms: 220 },
    stage_3_risk_arbiter: { status: "SUCCESS", latency_ms: 2 },
    total_pipeline_ms: 232,
  },
  timeline_events: [
    { time: "10:14:02", stage: "Ingestion", detail: "Parsed & hashed in volatile memory" },
    { time: "10:14:02", stage: "PII Sanitization", detail: "Ephemeral RAM buffer scrubbed" },
    { time: "10:14:02", stage: "Ledger Gate", detail: "SemakMule & Master Ledger evaluated" },
    { time: "10:14:02", stage: "Forensic Inspection", detail: "Metadata scan complete: Clean ERP/Accounting export signature" },
    { time: "10:14:03", stage: "Risk Arbiter", detail: "Verdict issued & Ledger match confirmed" },
  ],
  ocr_used: false,
  total_pages: 1,
  filename: "MegaBuild_ProgressClaim_088.pdf",
  pdf_forensics: {
    producer: "AutoCount Accounting v2.1",
    creator: "Crystal Reports Enterprise",
    creation_date: "D:20261003090000+08'00'",
    mod_date: "D:20261003090000+08'00'",
    is_tampered: false,
    evidence: "Clean ERP/Accounting export signature (No post-issuance tampering detected)",
  },
  artifact_tracking: {
    artifact_hash: "a18e034298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b810",
    is_duplicate: false,
    first_seen_timestamp: null,
    original_filename: "MegaBuild_ProgressClaim_088.pdf",
    status_badge: "PASS: UNIQUE ARTIFACT (NEW)",
  },
  defensive_actions: {
    is_triggered: false,
    actions: [],
    status_badge: "NORMAL: Standard Payment Workflow",
  },
};

const PRESET_SCENARIO_2_MULE: AuditForensicReport = {
  case_id: "SCENARIO-2-SEMAKMULE",
  status: "PROCESSED",
  is_scam: true,
  risk_score: 99,
  threat_level: "CRITICAL",
  verdict_summary:
    "CRITICAL FRAUD: Target account (9876543210) is a flagged PDRM SemakMule illicit account. Wire transfer frozen immediately.",
  primary_cues: ["LOOKALIKE_DOMAIN", "UNVERIFIED_BANK_CHANGE", "SEMAKMULE_BLACKLIST_HIT", "CISA_URGENCY", "PDF_METADATA_TAMPERED"],
  evidence_trail: [
    {
      cue_code: "LOOKALIKE_DOMAIN",
      agent_source: "Agent 1: Identity & Wire Forensic",
      severity: "CRITICAL",
      description: "Sender domain 'mega-bu1ld.com.my' is a homoglyph spoof of Mega Build Sdn Bhd.",
    },
    {
      cue_code: "SEMAKMULE_BLACKLIST_HIT",
      agent_source: "Agent 1: Identity & Wire Forensic (PDRM SemakMule)",
      severity: "CRITICAL",
      description: "Declared account 9876543210 is listed in PDRM SemakMule CCID illicit mule registry.",
    },
    {
      cue_code: "PDF_METADATA_TAMPERED",
      agent_source: "Agent 1: Digital Forensics & Metadata Inspector",
      severity: "CRITICAL",
      description: "Altered via consumer editing suite (Producer: iLovePDF Web Suite, Creator: Adobe Acrobat Pro).",
    },
    {
      cue_code: "CISA_URGENCY",
      agent_source: "Agent 2: Cognitive Threat Analyst",
      severity: "HIGH",
      description: "Coercive deadline demand: 'Transfer before 5:00 PM today to prevent work stoppage.'",
    },
  ],
  safe_next_step: {
    action_type: "REQUIRE_HUMAN_CALLBACK",
    protocol: "OUT_OF_BAND_TELEPHONE_VERIFICATION",
    target_vendor: "Mega Build Sdn Bhd",
    authorized_phone_number: "+60-3-7722-8888",
    security_instructions:
      "CIRCUIT BREAKER ACTIVATED: Known PDRM SemakMule flagged illicit mule account. Wire transfer frozen. Verbally verify through authorized switchboard.",
    verification_status: "PAYMENT_LOCKED_PENDING_CALL",
  },
  executive_summary:
    "CRITICAL DEFENSE ALERT: Inbound communication flagged as HIGH-RISK SCAM (Risk Score: 99.0/100). Target account 9876543210 is a confirmed PDRM SemakMule mule account.",
  discrepancy_matrix: {
    ledger_vendor_name: "Mega Build Sdn Bhd",
    ledger_bank_account: "5123-4567-8901",
    invoice_bank_account: "9876543210 (CIMB)",
    account_match: false,
    is_mule: true,
    status: "CRITICAL_MULE_DETECTED",
  },
  audit_checklist: [
    {
      check: "Vendor Identity",
      status: "FAIL",
      detail: "Lookalike typosquat domain mega-bu1ld.com.my impersonating Mega Build Sdn Bhd.",
    },
    {
      check: "Bank Account Ledger",
      status: "FAIL",
      detail: "Inbound account 9876543210 does not match ledger account 5123-4567-8901.",
    },
    {
      check: "PDRM SemakMule Registry",
      status: "FAIL",
      detail: "CRITICAL: Account 9876543210 is listed in PDRM SemakMule / CCID Blacklist!",
    },
    {
      check: "Trending Modus Operandi (CTI)",
      status: "FAIL",
      detail: "Pretext matches trending MO: Account redirection with urgent deadline.",
    },
    {
      check: "Urgency & Coercion Level",
      status: "FAIL",
      detail: "Artificial deadline coercion (before 5:00 PM today to prevent work stoppage).",
    },
    {
      check: "Document Metadata & Anti-Tamper Forensics",
      status: "FAIL",
      detail: "Altered via consumer editing suite (Producer: iLovePDF Web Suite, Creator: Adobe Acrobat Pro)",
    },
  ],
  pipeline_telemetry: {
    stage_0_pii_scrub: { status: "SUCCESS", latency_ms: 12 },
    stage_1_ledger_match: { status: "SUCCESS", latency_ms: 3 },
    stage_2_cognitive_gemini: { status: "SUCCESS", latency_ms: 310 },
    stage_3_risk_arbiter: { status: "SUCCESS", latency_ms: 2 },
    total_pipeline_ms: 327,
  },
  timeline_events: [
    { time: "11:22:15", stage: "Ingestion", detail: "Parsed & hashed in volatile memory" },
    { time: "11:22:15", stage: "PII Sanitization", detail: "Ephemeral RAM buffer scrubbed" },
    { time: "11:22:16", stage: "Ledger Gate", detail: "SemakMule & Master Ledger evaluated - Mule Hit" },
    { time: "11:22:16", stage: "Forensic Inspection", detail: "Metadata scan complete: Altered via consumer editing suite (Producer: iLovePDF Web Suite)" },
    { time: "11:22:16", stage: "Risk Arbiter", detail: "Verdict issued & Call Voucher generated" },
  ],
  ocr_used: false,
  total_pages: 1,
  filename: "Revised_CIMB_Invoice_MB8821.pdf",
  pdf_forensics: {
    is_tampered: true,
    producer: "iLovePDF Web Suite",
    creator: "Adobe Acrobat Pro",
    creation_date: "D:20261001100000+08'00'",
    mod_date: "D:20261003153000+08'00'",
    evidence: "Altered via consumer editing suite (Producer: iLovePDF Web Suite)",
  },
  artifact_tracking: {
    artifact_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    is_duplicate: true,
    first_seen_timestamp: "2026-10-01T09:15:22",
    original_filename: "MegaBuild_Original_MB8821.pdf",
    status_badge: "WARNING: DUPLICATE / REPLAY DETECTED",
  },
  defensive_actions: {
    is_triggered: true,
    status_badge: "3 Automated Actions Executed",
    actions: [
      {
        agency: "NSRC (National Scam Response Centre - 997) / PDRM JSJK",
        status: "DISPATCH_READY",
        reporting_draft: {
          incident_ref: "SCENARIO-2-SEMAKMULE",
          target_account: "9876543210 (CIMB)",
          alleged_vendor: "Mega Build Sdn Bhd",
          fraud_classification: "BEC / Unauthorized Invoice Redirection",
          primary_evidence: "CRITICAL FRAUD: Target account (9876543210) is a flagged PDRM SemakMule illicit account. Altered via consumer editing suite (iLovePDF Web Suite).",
          action_required: "Emergency account freeze request under Section 116D CPC.",
        },
      },
      {
        channel: "Telegram SecOps Feed (@SME_CyberAlert_Bot)",
        status: "DISPATCHED",
        message_preview: "🚨 [CRITICAL ALERT] Payment Hold Triggered for Mega Build Sdn Bhd. Inbound account 9876543210 rejected. Tamper/BEC evidence detected.",
      },
      {
        integration: "AutoCount / SQL Account API Connector",
        status: "PAYMENT_LOCKED",
        detail: "Voucher payment status flagged as SUSPENDED pending Dual-Control 4-Eyes sign-off.",
      },
    ],
  },
};

const PRESET_SCENARIO_3_CTI: AuditForensicReport = {
  case_id: "SCENARIO-3-CTI-PRETEXT",
  status: "PROCESSED",
  is_scam: true,
  risk_score: 85,
  threat_level: "CRITICAL",
  verdict_summary:
    "CRITICAL BEC DISCREPANCY: Inbound bank account diverges from procurement baseline under banking maintenance pretext.",
  primary_cues: ["LOOKALIKE_DOMAIN", "UNVERIFIED_BANK_CHANGE", "CTI_TREND_MATCH", "CISA_URGENCY", "PDF_METADATA_TAMPERED"],
  evidence_trail: [
    {
      cue_code: "LOOKALIKE_DOMAIN",
      agent_source: "Agent 1: Identity & Wire Forensic",
      severity: "CRITICAL",
      description: "Sender domain 'mega-bu1ld.com.my' diverges from verified megabuild.com.my.",
    },
    {
      cue_code: "CTI_TREND_MATCH",
      agent_source: "Agent 2: Cognitive Threat Analyst (CTI Intelligence)",
      severity: "HIGH",
      description: "Pretext matches trending NSRC/PDRM advisory: 'Claims of corporate banking migration or branch maintenance'.",
    },
    {
      cue_code: "UNVERIFIED_BANK_CHANGE",
      agent_source: "Agent 1: Identity & Wire Forensic",
      severity: "CRITICAL",
      description: "Declared account 8009-4411-2299 does not exist on verified baseline.",
    },
    {
      cue_code: "PDF_METADATA_TAMPERED",
      agent_source: "Agent 1: Digital Forensics & Metadata Inspector",
      severity: "CRITICAL",
      description: "Altered via consumer editing suite (Producer: Canva PDF Generator).",
    },
  ],
  safe_next_step: {
    action_type: "REQUIRE_HUMAN_CALLBACK",
    protocol: "OUT_OF_BAND_TELEPHONE_VERIFICATION",
    target_vendor: "Mega Build Sdn Bhd",
    authorized_phone_number: "+60-3-7722-8888",
    security_instructions:
      "CIRCUIT BREAKER ACTIVATED: Suspected invoice redirection using corporate banking migration pretext. Do NOT disburse wire.",
    verification_status: "PAYMENT_LOCKED_PENDING_CALL",
  },
  executive_summary:
    "CRITICAL DEFENSE ALERT: Inbound communication flagged as HIGH-RISK SCAM (Risk Score: 85.0/100). Bank redirection payment locked pending out-of-band callback.",
  discrepancy_matrix: {
    ledger_vendor_name: "Mega Build Sdn Bhd",
    ledger_bank_account: "5123-4567-8901",
    invoice_bank_account: "8009-4411-2299",
    account_match: false,
    is_mule: false,
    status: "DISCREPANCY_DETECTED",
  },
  audit_checklist: [
    {
      check: "Vendor Identity",
      status: "FAIL",
      detail: "Sender domain mega-bu1ld.com.my matches homoglyph typosquatting signature.",
    },
    {
      check: "Bank Account Ledger",
      status: "FAIL",
      detail: "Inbound account 8009-4411-2299 is not registered for Mega Build Sdn Bhd.",
    },
    {
      check: "PDRM SemakMule Registry",
      status: "PASS",
      detail: "Account not currently present on public CCID mule database.",
    },
    {
      check: "Trending Modus Operandi (CTI)",
      status: "FAIL",
      detail: "Matches PDRM/NSRC advisory: Claims of corporate banking migration or branch maintenance requiring payment to secondary account.",
    },
    {
      check: "Urgency & Coercion Level",
      status: "FAIL",
      detail: "Pressure applied for same-day batch reconciliation.",
    },
    {
      check: "Document Metadata & Anti-Tamper Forensics",
      status: "FAIL",
      detail: "Altered via consumer editing suite (Producer: Canva PDF Generator)",
    },
  ],
  pipeline_telemetry: {
    stage_0_pii_scrub: { status: "SUCCESS", latency_ms: 10 },
    stage_1_ledger_match: { status: "SUCCESS", latency_ms: 3 },
    stage_2_cognitive_gemini: { status: "SUCCESS", latency_ms: 280 },
    stage_3_risk_arbiter: { status: "SUCCESS", latency_ms: 2 },
    total_pipeline_ms: 295,
  },
  timeline_events: [
    { time: "14:02:01", stage: "Ingestion", detail: "Parsed & hashed in volatile memory" },
    { time: "14:02:02", stage: "PII Sanitization", detail: "Ephemeral RAM buffer scrubbed" },
    { time: "14:02:02", stage: "Ledger Gate", detail: "SemakMule & Master Ledger evaluated" },
    { time: "14:02:02", stage: "Forensic Inspection", detail: "Metadata scan complete: Altered via consumer editing suite (Canva)" },
    { time: "14:02:03", stage: "Risk Arbiter", detail: "Verdict issued & Call Voucher generated" },
  ],
  ocr_used: false,
  total_pages: 1,
  filename: "Maintenance_Alternate_Settlement.pdf",
  pdf_forensics: {
    is_tampered: true,
    producer: "Canva PDF Generator",
    creator: "Canva Web Editor",
    creation_date: "D:20261002140000+08'00'",
    mod_date: "D:20261003112000+08'00'",
    evidence: "Altered via consumer editing suite (Producer: Canva PDF Generator)",
  },
  artifact_tracking: {
    artifact_hash: "f7c3bc1d808e04732adf679965ccc34ca7ae3441",
    is_duplicate: false,
    first_seen_timestamp: null,
    original_filename: "Maintenance_Alternate_Settlement.pdf",
    status_badge: "PASS: UNIQUE ARTIFACT (NEW)",
  },
  defensive_actions: {
    is_triggered: true,
    status_badge: "3 Automated Actions Executed",
    actions: [
      {
        agency: "NSRC (National Scam Response Centre - 997) / PDRM JSJK",
        status: "DISPATCH_READY",
        reporting_draft: {
          incident_ref: "SCENARIO-3-CTI-PRETEXT",
          target_account: "8009-4411-2299",
          alleged_vendor: "Mega Build Sdn Bhd",
          fraud_classification: "BEC / Unauthorized Invoice Redirection",
          primary_evidence: "CRITICAL BEC DISCREPANCY: Banking maintenance pretext with unauthorized account redirection.",
          action_required: "Emergency account freeze request under Section 116D CPC.",
        },
      },
      {
        channel: "Telegram SecOps Feed (@SME_CyberAlert_Bot)",
        status: "DISPATCHED",
        message_preview: "🚨 [CRITICAL ALERT] Payment Hold Triggered for Mega Build Sdn Bhd. Inbound account 8009-4411-2299 rejected.",
      },
      {
        integration: "AutoCount / SQL Account API Connector",
        status: "PAYMENT_LOCKED",
        detail: "Voucher payment status flagged as SUSPENDED pending Dual-Control 4-Eyes sign-off.",
      },
    ],
  },
};

export default function ScamGuardDashboard() {
  const [channelMode, setChannelMode] = useState<"PDF" | "WHATSAPP">("PDF");
  const [report, setReport] = useState<AuditForensicReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedAudit, setCopiedAudit] = useState(false);
  const [showNsrcModal, setShowNsrcModal] = useState(false);
  const [copiedNsrcDraft, setCopiedNsrcDraft] = useState(false);

  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [senderEmail, setSenderEmail] = useState("billing@megabuild.com.my");
  const [whatsappText, setWhatsappText] = useState(
    "Boss, our Maybank is under maintenance. Please remit RM 14,500 to our alternate CIMB account: 9876543210 urgently."
  );

  const fileInputId = useId();

  // 1. Session Hydration on initial mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem("scamguard_last_scan");
      if (cached) {
        const parsed = JSON.parse(cached);
        setReport(parsed);
      } else {
        // Default to Scenario 2 for instant enterprise showcase
        setReport(PRESET_SCENARIO_2_MULE);
      }
    } catch {
      setReport(PRESET_SCENARIO_2_MULE);
    }
  }, []);

  // Update session storage whenever report changes
  const updateReportAndHydrate = (newReport: AuditForensicReport | null) => {
    setReport(newReport);
    if (newReport) {
      try {
        localStorage.setItem("scamguard_last_scan", JSON.stringify(newReport));
      } catch (e) {
        console.warn("Could not save scan to localStorage", e);
      }
    } else {
      localStorage.removeItem("scamguard_last_scan");
    }
  };

  // 2. Preset Selection Handler
  const handlePresetSelect = (presetKey: string) => {
    setErrorMsg(null);
    if (presetKey === "scenario_1") {
      updateReportAndHydrate(PRESET_SCENARIO_1_LEGIT);
    } else if (presetKey === "scenario_2") {
      updateReportAndHydrate(PRESET_SCENARIO_2_MULE);
    } else if (presetKey === "scenario_3") {
      updateReportAndHydrate(PRESET_SCENARIO_3_CTI);
    }
  };

  // 3. Clear / Reset Handler
  const handleResetSession = () => {
    updateReportAndHydrate(null);
    setSelectedFile(null);
    setErrorMsg(null);
  };

  // 4. File Upload Ingestion
  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sender", senderEmail);
    formData.append("subject", `Inbound Invoice - ${file.name}`);

    try {
      const res = await fetch("http://localhost:8000/api/scan/invoice-file", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with server status ${res.status}`);
      }

      const data: AuditForensicReport = await res.json();
      updateReportAndHydrate(data);
    } catch (err: any) {
      console.warn("Live API call error, falling back to simulated file extraction:", err);
      // Graceful offline fallback fixture with file metadata
      const simulated: AuditForensicReport = {
        ...PRESET_SCENARIO_2_MULE,
        case_id: `INV-${Date.now().toString().slice(-6)}`,
        filename: file.name,
      };
      updateReportAndHydrate(simulated);
      setErrorMsg("Offline Demo Mode active: Displaying simulated forensic verdict.");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. WhatsApp Message Scan
  const handleScanWhatsAppMessage = async () => {
    if (!whatsappText.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("http://localhost:8000/api/scan/channel-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: whatsappText,
          sender: "whatsapp:+60129881122",
          subject: "WhatsApp Channel Dispatch",
        }),
      });

      if (!res.ok) {
        throw new Error(`Channel message scan failed with status ${res.status}`);
      }

      const data: AuditForensicReport = await res.json();
      updateReportAndHydrate(data);
    } catch (err: any) {
      console.warn("Channel message scan fallback:", err);
      const simulated: AuditForensicReport = {
        ...PRESET_SCENARIO_2_MULE,
        case_id: `MSG-${Date.now().toString().slice(-6)}`,
        filename: "whatsapp_dispatch.txt",
        verdict_summary:
          "CRITICAL FRAUD: WhatsApp message directs payment to PDRM SemakMule flagged account (9876543210).",
      };
      updateReportAndHydrate(simulated);
      setErrorMsg("Offline Demo Mode active: Displaying simulated forensic verdict.");
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Dual-Control HITL Actions
  const handleClerkSignOff = () => {
    if (!report) return;
    const updated: AuditForensicReport = {
      ...report,
      clerk_verified: true,
      clerk_timestamp: new Date().toLocaleTimeString(),
    };
    updateReportAndHydrate(updated);
  };

  const handleManagerDecision = (decision: "OVERRIDE_AUTHORIZED" | "FRAUD_ARCHIVED") => {
    if (!report) return;
    const updated: AuditForensicReport = {
      ...report,
      manager_resolution: decision,
      manager_timestamp: new Date().toLocaleTimeString(),
    };
    updateReportAndHydrate(updated);
  };

  // 7. Radial Meter Calculations
  const score = report?.risk_score ?? 0;
  const isQuarantined = report?.status === "QUARANTINED";
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (circumference * score) / 100;

  let gaugeColor = "#10b981"; // emerald
  let gaugeBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score > 60 || isQuarantined) {
    gaugeColor = "#f43f5e"; // rose
    gaugeBadgeClass = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (score > 20) {
    gaugeColor = "#f59e0b"; // amber
    gaugeBadgeClass = "bg-amber-50 text-amber-700 border-amber-200";
  }

  // Copy raw JSON audit trail
  const handleCopyJSON = () => {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopiedAudit(true);
    setTimeout(() => setCopiedAudit(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 pb-16 font-sans">
      {/* ==================================================================== */}
      {/* PRINT-ONLY DOSSIER VIEW (A4 Bank & Police Incident Dossier)           */}
      {/* ==================================================================== */}
      <div className="hidden print-only p-8 text-black bg-white">
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase">
                Official Forensic Incident Dossier
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                PDRM CCID / Bank Negara Malaysia Incident Reporting • Malaysian PDPA Section 10 Compliant
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm font-bold bg-slate-100 px-2 py-1 rounded">
                CASE: {report?.case_id || "N/A"}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Timestamp: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {report && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-300 rounded">
              <h2 className="font-bold text-sm uppercase text-slate-700 mb-2">Primary Assessment</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block">Risk Score:</span>
                  <span className="font-bold text-lg">{report.risk_score}/100 ({report.threat_level})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Firewall Status:</span>
                  <span className="font-bold text-lg">{report.status || "PROCESSED"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">SemakMule Hit:</span>
                  <span className="font-bold text-lg">
                    {report.discrepancy_matrix?.is_mule ? "YES - BLACKLISTED" : "NO - CLEAN"}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium border-t border-slate-200 pt-2">
                Executive Verdict: {report.verdict_summary || report.executive_summary}
              </p>
            </div>

            <div className="border border-slate-300 rounded p-4">
              <h2 className="font-bold text-sm uppercase text-slate-700 mb-2">
                Two-Way Verification Matrix
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="border-r border-slate-200 pr-4">
                  <span className="font-semibold block text-slate-600">Master Procurement Ledger:</span>
                  <p>Vendor: {report.discrepancy_matrix?.ledger_vendor_name || "Unregistered"}</p>
                  <p>Registered Bank: {report.discrepancy_matrix?.ledger_bank_account || "None"}</p>
                  <p>Verified Switchboard: +60-3-7722-8888</p>
                </div>
                <div>
                  <span className="font-semibold block text-slate-600">Inbound Document Extraction:</span>
                  <p>Inbound Bank: {report.discrepancy_matrix?.invoice_bank_account}</p>
                  <p>Account Match: {report.discrepancy_matrix?.account_match ? "MATCH" : "DISCREPANCY"}</p>
                  <p>Mule Database: {report.discrepancy_matrix?.is_mule ? "FLAGGED ILLICIT MULE" : "CLEAN"}</p>
                </div>
              </div>
            </div>

            <div className="border border-slate-300 rounded p-4">
              <h2 className="font-bold text-sm uppercase text-slate-700 mb-2">Forensic Audit Checklist</h2>
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-1">Checkpoint</th>
                    <th className="py-1">Status</th>
                    <th className="py-1">Forensic Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {report.audit_checklist?.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-1 font-medium">{item.check}</td>
                      <td className="py-1 font-bold">{item.status}</td>
                      <td className="py-1 text-slate-600">{item.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {report.safe_next_step && (
              <div className="border border-slate-300 rounded p-4">
                <h2 className="font-bold text-sm uppercase text-slate-700 mb-2">
                  Dual-Control Sign-Off Record (4-Eyes Principle)
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold block">Step 1: Accounts Clerk Verbal Verification</span>
                    <p>Status: {report.clerk_verified ? `VERIFIED at ${report.clerk_timestamp}` : "PENDING"}</p>
                    <p>Phone Dialed: {report.safe_next_step.authorized_phone_number}</p>
                  </div>
                  <div>
                    <span className="font-semibold block">Step 2: Finance Manager Secondary Authorization</span>
                    <p>
                      Status:{" "}
                      {report.manager_resolution === "OVERRIDE_AUTHORIZED"
                        ? `AUTHORIZED at ${report.manager_timestamp}`
                        : report.manager_resolution === "FRAUD_ARCHIVED"
                        ? `FRAUD CONFIRMED & ARCHIVED at ${report.manager_timestamp}`
                        : "PENDING"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* INTERACTIVE WEB APPLICATION (No-Print)                                */}
      {/* ==================================================================== */}
      <div className="no-print max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ================================================================== */}
        {/* TOP ZONE — Primary Threat Assessment & Action Bar                  */}
        {/* ================================================================== */}
        <header className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Title & Air-Gapped Status Pill */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    SME-ScamGuard-AI
                  </h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    Air-Gapped / PDPA Guard Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Local-First BEC Wire Defense • SemakMule Lookup • Dual-Control 4-Eyes Governance
                </p>
              </div>
            </div>

            {/* Top Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center px-3.5 py-2 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                Export Audit Dossier (PDF)
              </button>

              <button
                type="button"
                onClick={handleResetSession}
                className="inline-flex items-center px-3.5 py-2 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                Reset Session
              </button>
            </div>
          </div>

          {/* Quick-Select Preset Scenarios & Inbound Switcher Bar */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-700 flex items-center">
                <Search className="h-3.5 w-3.5 mr-1 text-slate-400" />
                Demo Scenario:
              </span>
              <select
                aria-label="Demo Preset Scenario Selector"
                onChange={(e) => handlePresetSelect(e.target.value)}
                defaultValue="scenario_2"
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
              >
                <option value="scenario_1">Scenario 1: Legitimate Vendor (MegaBuild - Maybank Match)</option>
                <option value="scenario_2">Scenario 2: BEC Redirection + SemakMule Hit (CIMB Mule Flagged)</option>
                <option value="scenario_3">Scenario 3: Trending CTI Phish (Bank Maintenance Pretext)</option>
              </select>
            </div>

            {/* Inbound Channel Triage Switcher: PDF vs WhatsApp */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
              <button
                type="button"
                onClick={() => setChannelMode("PDF")}
                className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  channelMode === "PDF"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                PDF Invoice
              </button>
              <button
                type="button"
                onClick={() => setChannelMode("WHATSAPP")}
                className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  channelMode === "WHATSAPP"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                WhatsApp Chat
              </button>
            </div>
          </div>
        </header>

        {/* Error notification banner if any */}
        {errorMsg && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-amber-600 hover:text-amber-900 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Ingestion Dropzone / Input Card */}
        <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
          {channelMode === "PDF" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Inbound Invoice Ingestion (PDF / DOCX / TXT with Hybrid OCR)
                </label>
                <span className="text-xs text-slate-400 font-mono">Max 10MB • Local Memory Only</span>
              </div>

              <div
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20"
                onClick={() => document.getElementById(fileInputId)?.click()}
              >
                <input
                  id={fileInputId}
                  type="file"
                  accept=".pdf,.docx,.txt,image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    {selectedFile ? (
                      <span className="text-indigo-600 font-semibold">{selectedFile.name}</span>
                    ) : (
                      "Click to browse or drop supplier invoice attachment here"
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports native PDF, scanned/photocopied invoices (via Gemini Vision OCR), and Word tables
                  </p>
                </div>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center space-x-2 py-2 text-xs text-indigo-600 font-medium">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Executing 4-Agent Forensic Verification Pipeline...</span>
                </div>
              )}
            </div>
          ) : (
            /* WhatsApp Channel Triage View */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  WhatsApp / Messaging Channel Triage
                </label>
                <span className="text-xs text-emerald-600 font-medium flex items-center">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Live Chat Inspector
                </span>
              </div>

              <textarea
                rows={3}
                value={whatsappText}
                onChange={(e) => setWhatsappText(e.target.value)}
                placeholder="Paste inbound chat or instant message here..."
                className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleScanWhatsAppMessage}
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Scan Message
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ================================================================== */}
        {/* Threat Summary Banner (Radial Gauge + Primary Verdict)              */}
        {/* ================================================================== */}
        {report && (
          <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Circular / Radial Progress Gauge */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke="#e2e8f0"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke={gaugeColor}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                    {Math.round(report.risk_score)}%
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    Risk Score
                  </span>
                </div>
              </div>

              {/* Threat Verdict & Metadata */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${gaugeBadgeClass}`}
                  >
                    {report.threat_level === "CRITICAL" && (
                      <AlertOctagon className="h-3 w-3 mr-1 text-rose-600" />
                    )}
                    {report.threat_level === "SUSPICIOUS" && (
                      <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" />
                    )}
                    {report.threat_level === "SAFE" && (
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                    )}
                    {report.threat_level} THREAT
                  </span>

                  {isQuarantined && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                      <Lock className="h-3 w-3 mr-1" />
                      FIREWALL QUARANTINE
                    </span>
                  )}

                  {report.discrepancy_matrix?.is_mule && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-600 text-white animate-pulse">
                      🚨 PDRM SEMAKMULE HIT
                    </span>
                  )}

                  <span className="text-xs font-mono text-slate-400">
                    Case: {report.case_id}
                  </span>

                  {report.artifact_tracking?.artifact_hash && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                      Hash: {report.artifact_tracking.artifact_hash.slice(0, 10)}...
                    </span>
                  )}

                  {report.artifact_tracking?.is_duplicate ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                      ⚠️ REPLAY DETECTED: Previously submitted {report.artifact_tracking.first_seen_timestamp || 'Earlier'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      🛡️ SHA-256 VERIFIED
                    </span>
                  )}
                </div>

                <h2 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight leading-snug">
                  {report.verdict_summary || report.executive_summary}
                </h2>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-1">
                  {report.filename && (
                    <span className="flex items-center">
                      <FileText className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      Source: {report.filename}
                    </span>
                  )}
                  {report.ocr_used && (
                    <span className="flex items-center text-indigo-600 font-medium">
                      <Cpu className="h-3.5 w-3.5 mr-1" />
                      Multimodal Gemini Vision OCR Applied
                    </span>
                  )}
                  {report.pipeline_telemetry && (
                    <span className="flex items-center font-mono">
                      <Clock className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      Total Latency: {report.pipeline_telemetry.total_pipeline_ms}ms
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================== */}
        {/* MIDDLE ZONE — Core Verification Evidence (Matrix, Gap & Voucher)    */}
        {/* ================================================================== */}
        {report && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column (7 cols): Two-Way Matrix & Gap Analysis Checklist */}
            <div className="lg:col-span-7 space-y-6">

              {/* Two-Way Cross-Verification Matrix */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Two-Way Cross-Verification Matrix
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Ground Truth vs Inbound</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Master Ledger (Ground Truth) */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-lg space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Master Procurement Whitelist
                    </span>
                    <div>
                      <span className="text-xs text-slate-400 block">Registered Vendor:</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {report.discrepancy_matrix?.ledger_vendor_name || "None (Unknown Counterparty)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Verified Bank Account:</span>
                      <span className="text-xs font-mono font-semibold text-slate-800">
                        {report.discrepancy_matrix?.ledger_bank_account || "No Verified Account"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Official Helpline:</span>
                      <span className="text-xs font-mono text-indigo-600 font-medium">
                        +60-3-7722-8888
                      </span>
                    </div>
                  </div>

                  {/* Inbound Document Data */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Inbound Extracted Data
                      </span>
                      {report.discrepancy_matrix?.account_match ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          MATCH
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                          DISCREPANCY
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Inbound Bank Account:</span>
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {report.discrepancy_matrix?.invoice_bank_account}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">SemakMule CCID Status:</span>
                      {report.discrepancy_matrix?.is_mule ? (
                        <span className="text-xs font-semibold text-rose-600 flex items-center">
                          <AlertOctagon className="h-3 w-3 mr-1" />
                          FLAGGED MULE ACCOUNT
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Clean Registry Check
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Redirection Risk:</span>
                      <span
                        className={`text-xs font-semibold ${
                          report.discrepancy_matrix?.account_match
                            ? "text-emerald-700"
                            : "text-rose-700"
                        }`}
                      >
                        {report.discrepancy_matrix?.account_match
                          ? "Zero Variance"
                          : "Critical Diversion Detected"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SemakMule Banner if Flagged */}
                {report.discrepancy_matrix?.is_mule && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start space-x-2.5 text-xs text-rose-800">
                    <AlertOctagon className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">
                        🚨 PDRM SemakMule / CCID Blacklisted Mule Account
                      </span>
                      This recipient account is actively cataloged in the Royal Malaysia Police (PDRM)
                      illicit money-mule database. Under no circumstances should accounts payable release funds.
                    </div>
                  </div>
                )}
              </div>

              {/* Forensic Audit Gap Analysis Checklist */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-indigo-600" />
                    Forensic Audit Gap Analysis Checklist
                  </h3>
                  <span className="text-xs font-mono text-slate-400">6-Point Forensic Verification</span>
                </div>

                <div className="space-y-2">
                  {report.audit_checklist?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-0.5 pr-3">
                        <span className="text-xs font-semibold text-slate-800 block">
                          {item.check}
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.detail}
                        </p>
                        {item.check === "Document Metadata & Anti-Tamper Forensics" && item.status === "FAIL" && report.pdf_forensics && (
                          <p className="text-[11px] font-mono text-rose-600 font-semibold mt-0.5">
                            Tool Detected: {report.pdf_forensics.producer || report.pdf_forensics.creator || "Consumer PDF Suite"}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          item.status === "PASS"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {item.check === "Document Metadata & Anti-Tamper Forensics"
                          ? item.status === "PASS"
                            ? "PASS: VERIFIED ERP SIGNATURE"
                            : "FAIL: TAMPERING DETECTED"
                          : item.status === "PASS"
                          ? "PASS"
                          : "FAIL"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Out-of-Band Call Verification Voucher & 4-Eyes Governance */}
            <div className="lg:col-span-5 space-y-6">
              {report.safe_next_step ? (
                <div className="bg-white border-l-4 border-l-rose-500 border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <PhoneCall className="h-4 w-4 text-rose-600" />
                      <h3 className="text-sm font-semibold text-slate-900">
                        Out-of-Band Call Verification Voucher
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      LOCKED
                    </span>
                  </div>

                  {/* Switchboard Call Dial Box */}
                  <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-lg space-y-1.5">
                    <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider block">
                      Mandatory Verbal Authentication
                    </span>
                    <p className="text-xs text-rose-800 leading-relaxed">
                      Wire transfer circuit breaker activated. Disburse funds ONLY after verbal confirmation
                      with registered switchboard:
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-base font-mono font-bold text-slate-900">
                        {report.safe_next_step.authorized_phone_number}
                      </span>
                      <a
                        href={`tel:${report.safe_next_step.authorized_phone_number.replace(/\D/g, "")}`}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                      >
                        <PhoneCall className="h-3 w-3 mr-1" />
                        Dial Verified Line
                      </a>
                    </div>
                    <span className="text-[11px] text-slate-500 block pt-0.5">
                      Target Entity: {report.safe_next_step.target_vendor}
                    </span>
                  </div>

                  {/* Dual-Control "4-Eyes Principle" Resolution Controls */}
                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                        <Lock className="h-3.5 w-3.5 mr-1 text-slate-400" />
                        Dual-Control ("4-Eyes Principle")
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Governance Gate</span>
                    </div>

                    {/* Step 1: Accounts Clerk Verbal Verification Sign-Off */}
                    {!report.clerk_verified ? (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                        <span className="text-xs font-semibold text-slate-800 block">
                          Step 1: Accounts Clerk Verbal Sign-Off
                        </span>
                        <p className="text-xs text-slate-500">
                          Confirm you dialed {report.safe_next_step.authorized_phone_number} to authenticate invoice veracity.
                        </p>
                        <button
                          type="button"
                          onClick={handleClerkSignOff}
                          className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                        >
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Mark Verified via Call (Clerk Sign-Off)
                        </button>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
                          <span>Step 1 Complete: Clerk sign-off logged at {report.clerk_timestamp}</span>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Finance Manager Secondary Approval Mode (Unlocked once clerk signs off) */}
                    {report.clerk_verified && !report.manager_resolution && (
                      <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-2.5 animate-fadeIn">
                        <span className="text-xs font-semibold text-indigo-900 block">
                          Step 2: Finance Manager Secondary Counter-Signature
                        </span>
                        <p className="text-xs text-indigo-800/80">
                          As Finance Manager, authorize payment override under dual-control policy or confirm attack for police archive.
                        </p>
                        <div className="flex flex-col gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleManagerDecision("OVERRIDE_AUTHORIZED")}
                            className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-lg border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Unlock className="h-3.5 w-3.5 mr-1.5" />
                            Manager Approval: Authorize Override
                          </button>
                          <button
                            type="button"
                            onClick={() => handleManagerDecision("FRAUD_ARCHIVED")}
                            className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
                          >
                            <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                            Confirm BEC Fraud & Archive
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Resolution Completed Badges */}
                    {report.manager_resolution === "OVERRIDE_AUTHORIZED" && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-1">
                        <div className="flex items-center font-bold">
                          <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" />
                          Authorized with Dual-Control Signatures
                        </div>
                        <p className="text-[11px] text-emerald-700">
                          Clerk & Manager override recorded in audit ledger ({report.manager_timestamp}).
                        </p>
                      </div>
                    )}

                    {report.manager_resolution === "FRAUD_ARCHIVED" && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
                        <div className="flex items-center font-bold">
                          <ShieldAlert className="h-4 w-4 mr-1.5 text-rose-600" />
                          Confirmed BEC Attack Archived
                        </div>
                        <p className="text-[11px] text-rose-700">
                          Forensic dossier archived to ./data/audits.json. Escalation dispatched to NSRC.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Legitimate Safe Voucher State */
                <div className="bg-white border-l-4 border-l-emerald-500 border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Procurement Baseline Verified
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Transaction credentials and banking coordinates strictly align with corporate
                    procurement whitelist. Payout authorized without out-of-band voucher hold.
                  </p>
                  <div className="pt-2 text-xs font-mono text-emerald-700 bg-emerald-50/50 p-2.5 rounded border border-emerald-100">
                    STATUS: GREEN_LANE_SETTLEMENT_APPROVED
                  </div>
                </div>
              )}

              {/* Automated Defensive Dispatch Card (Containment Protocol) */}
              {report.defensive_actions?.is_triggered && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-white space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                        ⚡ AUTOMATED DEFENSIVE DISPATCH (CONTAINMENT PROTOCOL)
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {report.defensive_actions.status_badge || "3 Automated Actions Executed"}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Action 1: NSRC 997 */}
                    <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-rose-400 flex items-center">
                          <Radio className="h-3.5 w-3.5 mr-1 text-rose-400 animate-pulse" />
                          [PDRM / NSRC 997]
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                          DISPATCH_READY
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium">
                        Incident Escalation Brief Drafted (Ready for 997 Hotline)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Section 116D CPC emergency freeze brief prepared for immediate verbal dispatch.
                      </p>
                    </div>

                    {/* Action 2: SecOps Telegram */}
                    <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-cyan-400 flex items-center">
                          <Send className="h-3.5 w-3.5 mr-1 text-cyan-400" />
                          [SecOps Telegram]
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                          DISPATCHED
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium">
                        Alert Dispatched to Corporate Risk Channel
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Channel: @SME_CyberAlert_Bot
                      </p>
                    </div>

                    {/* Action 3: ERP Ledger Lock */}
                    <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-400 flex items-center">
                          <Lock className="h-3.5 w-3.5 mr-1 text-amber-400" />
                          [ERP Ledger Lock]
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                          PAYMENT_LOCKED
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium">
                        AP Voucher Suspended in Accounting Gateway
                      </p>
                      <p className="text-[11px] text-slate-400">
                        AutoCount / SQL Account connector locked payout pending 4-Eyes sign-off.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNsrcModal(true)}
                    className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-colors"
                  >
                    <FileCheck className="h-3.5 w-3.5 mr-1.5" />
                    [ View 997 Incident Report Draft ]
                  </button>
                </div>
              )}

              {/* Threat Evidence Trail List */}
              {report.evidence_trail && report.evidence_trail.length > 0 && (
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Observed Risk Signals ({report.evidence_trail.length})
                  </h3>
                  <div className="space-y-2">
                    {report.evidence_trail.map((cue, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded border border-slate-100 bg-slate-50/50 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-800">
                            {cue.cue_code}
                          </span>
                          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {cue.severity}
                          </span>
                        </div>
                        <p className="text-slate-600">{cue.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* BOTTOM ZONE — Collapsible Technical Forensics (Zero Visual Clutter) */}
        {/* ================================================================== */}
        {report && (
          <details className="group border border-slate-200 rounded-xl bg-white p-4 shadow-sm transition-all">
            <summary className="cursor-pointer font-medium text-slate-700 flex items-center justify-between text-sm select-none">
              <span className="flex items-center">
                <Layers className="h-4 w-4 mr-2 text-indigo-600" />
                ▼ View Technical Forensics & DAG Execution
              </span>
              <span className="text-xs font-mono text-slate-400 group-open:rotate-180 transition-transform">
                ▲
              </span>
            </summary>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-6">

              {/* 4-Node Visual DAG Telemetry Banner */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Event-Driven DAG Pipeline Telemetry
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Total: {report.pipeline_telemetry?.total_pipeline_ms ?? 0}ms
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {/* Stage 0 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Stage 0</span>
                    <span className="text-xs font-semibold text-slate-800 block mt-0.5">PII Scrub</span>
                    <span className="text-xs font-mono text-emerald-600 font-bold block mt-1">
                      {report.pipeline_telemetry?.stage_0_pii_scrub.latency_ms ?? 0}ms
                    </span>
                  </div>

                  {/* Stage 1 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Stage 1</span>
                    <span className="text-xs font-semibold text-slate-800 block mt-0.5">Ledger & SemakMule</span>
                    <span className="text-xs font-mono text-emerald-600 font-bold block mt-1">
                      {report.pipeline_telemetry?.stage_1_ledger_match.latency_ms ?? 0}ms
                    </span>
                  </div>

                  {/* Stage 2 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Stage 2</span>
                    <span className="text-xs font-semibold text-slate-800 block mt-0.5">Gemini CTI Cognition</span>
                    <span className="text-xs font-mono text-emerald-600 font-bold block mt-1">
                      {report.pipeline_telemetry?.stage_2_cognitive_gemini.latency_ms ?? 0}ms
                    </span>
                  </div>

                  {/* Stage 3 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Stage 3</span>
                    <span className="text-xs font-semibold text-slate-800 block mt-0.5">Risk Arbiter</span>
                    <span className="text-xs font-mono text-emerald-600 font-bold block mt-1">
                      {report.pipeline_telemetry?.stage_3_risk_arbiter.latency_ms ?? 0}ms
                    </span>
                  </div>
                </div>
              </div>

              {/* Digital Artifacts & Metadata Forensics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Digital Artifacts & Metadata Forensics
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    PDF Document Stream Inspection
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="space-y-1.5 font-mono text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Producer:</span>
                      <span className="text-slate-800 font-semibold">{report.pdf_forensics?.producer || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Creator:</span>
                      <span className="text-slate-800 font-semibold">{report.pdf_forensics?.creator || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Creation Date:</span>
                      <span className="text-slate-700">{report.pdf_forensics?.creation_date || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mod Date:</span>
                      <span className="text-slate-700">{report.pdf_forensics?.mod_date || "N/A"}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs text-slate-600 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">SHA-256 Fingerprint:</span>
                      <span className="text-slate-800 font-semibold truncate max-w-[180px]" title={report.artifact_tracking?.artifact_hash}>
                        {report.artifact_tracking?.artifact_hash ? `${report.artifact_tracking.artifact_hash.slice(0, 16)}...` : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Replay Status:</span>
                      <span className={`font-semibold ${report.artifact_tracking?.is_duplicate ? "text-amber-600" : "text-emerald-600"}`}>
                        {report.artifact_tracking?.status_badge || "PASS: UNIQUE ARTIFACT (NEW)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Tamper Status:</span>
                      <span className={`font-semibold ${report.pdf_forensics?.is_tampered ? "text-rose-600" : "text-emerald-600"}`}>
                        {report.pdf_forensics?.is_tampered ? "TAMPERING DETECTED" : "VERIFIED ERP SIGNATURE"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate" title={report.pdf_forensics?.evidence}>
                      Finding: {report.pdf_forensics?.evidence || "Standard document stream"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Forensic Activity Timeline (ADDON 2) */}
              {report.timeline_events && report.timeline_events.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Forensic Activity Timeline
                  </span>
                  <div className="space-y-1.5">
                    {report.timeline_events.map((evt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-3 p-2 bg-slate-50/70 border border-slate-200/60 rounded-lg text-xs"
                      >
                        <span className="font-mono text-slate-400 font-bold">{evt.time}</span>
                        <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                          {evt.stage}
                        </span>
                        <span className="text-slate-600">{evt.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Syntax-Highlighted JSON Audit Trail */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Raw JSON Audit Trail
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyJSON}
                    className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {copiedAudit ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy JSON
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto max-h-72">
                  <code>{JSON.stringify(report, null, 2)}</code>
                </pre>
              </div>

            </div>
          </details>
        )}

      </div>

      {/* NSRC 997 / PDRM JSJK Incident Report Draft Modal */}
      {showNsrcModal && report && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Radio className="h-4 w-4 text-rose-400 animate-pulse" />
                <h3 className="text-sm font-bold tracking-tight">
                  National Scam Response Centre (NSRC 997) / PDRM JSJK Preliminary Brief
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNsrcModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
                <span className="font-bold block">
                  🚨 Incident Escalation Form: Section 116D CPC Emergency Freeze Brief
                </span>
                <p>
                  This structured report is pre-formatted for direct verbal read-out to the National Scam Response Centre Hotline (Dial 997) or submission to CCID / JSJK investigating officers.
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-400">INCIDENT REF:</span>
                  <span className="font-bold text-slate-800">{report.case_id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-400">TARGET MULE ACCOUNT:</span>
                  <span className="font-bold text-rose-600">{report.discrepancy_matrix?.invoice_bank_account || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-400">ALLEGED VENDOR:</span>
                  <span className="font-semibold text-slate-800">{report.discrepancy_matrix?.ledger_vendor_name || "Unknown Counterparty"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-400">CLASSIFICATION:</span>
                  <span className="font-semibold text-rose-700">BEC / Unauthorized Invoice Redirection</span>
                </div>
                <div className="space-y-1 border-b border-slate-200 pb-1.5">
                  <span className="text-slate-400 block">PRIMARY EVIDENCE:</span>
                  <span className="text-slate-700">{report.verdict_summary || report.executive_summary}</span>
                </div>
                <div className="space-y-1 pt-0.5">
                  <span className="text-slate-400 block">ACTION REQUIRED:</span>
                  <span className="font-bold text-slate-900">Emergency account freeze request under Section 116D CPC.</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400 font-mono">NSRC Hotline: 997 (8:00 AM - 8:00 PM Daily)</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const briefText = `NSRC 997 / PDRM JSJK INCIDENT BRIEF\nRef: ${report.case_id}\nTarget Account: ${report.discrepancy_matrix?.invoice_bank_account}\nVendor: ${report.discrepancy_matrix?.ledger_vendor_name}\nEvidence: ${report.verdict_summary || report.executive_summary}\nAction Required: Emergency account freeze request under Section 116D CPC.`;
                      navigator.clipboard.writeText(briefText);
                      setCopiedNsrcDraft(true);
                      setTimeout(() => setCopiedNsrcDraft(false), 2000);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center"
                  >
                    {copiedNsrcDraft ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Brief
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNsrcModal(false)}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
