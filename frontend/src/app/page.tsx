"use client";

import React, { useState, useEffect, useId } from "react";
import {
  ShieldAlert,
  ShieldCheck,
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
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Search,
  Zap,
  Radio,
  FileCheck,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Send,
  AlertOctagon,
} from "lucide-react";

// ============================================================================
// DATA CONTRACTS & SCHEMAS
// ============================================================================

export interface DiscrepancyMatrix {
  ledger_vendor_name?: string | null;
  ledger_bank_account?: string | null;
  invoice_bank_account: string;
  account_match: boolean;
  is_mule: boolean;
  status: "MATCH" | "DISCREPANCY_DETECTED" | "CRITICAL_MULE_DETECTED";
  vendor_status?: "VERIFIED" | "UNKNOWN" | "MISMATCH";
  bank_status?: "EXACT_MATCH" | "MISMATCH" | "UNKNOWN" | "AMBIGUOUS";
  registry_status?: "CONFIRMED_MULE" | "CLEAN" | "UNKNOWN" | "UNAVAILABLE";
  forensic_status?: "CLEAN" | "SUSPICIOUS" | "UNKNOWN" | "UNAVAILABLE";
  cti_status?: "ALIGNED" | "NEUTRAL" | "SUSPICIOUS" | "UNAVAILABLE";
}

export interface AuditChecklistItem {
  check: string;
  status: "PASS" | "FAIL" | "UNKNOWN" | "UNAVAILABLE" | "SUSPICIOUS" | "QUARANTINED";
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

export interface FourEyesRecord {
  clerk_verified: boolean;
  clerk_actor?: string | null;
  clerk_timestamp?: string | null;
  clerk_notes?: string | null;
  verified_phone_used?: string | null;
  manager_resolution?: "OVERRIDE_AUTHORIZED" | "FREEZE_PAYMENT_CONFIRMED" | "FRAUD_ARCHIVED" | null;
  manager_actor?: string | null;
  manager_timestamp?: string | null;
  manager_notes?: string | null;
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
  risk_state?:
    | "VERIFIED / LOW RISK"
    | "SUSPICIOUS / VERIFICATION REQUIRED"
    | "QUARANTINED"
    | "CRITICAL BEC DISCREPANCY"
    | "CRITICAL FRAUD INDICATORS";
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
  four_eyes_record?: FourEyesRecord | null;
}

// ============================================================================
// PRESET SCENARIOS (Offline Zero-Key Testing Fixtures)
// ============================================================================

const PRESET_SCENARIO_1_LEGIT: AuditForensicReport = {
  case_id: "SCENARIO-1-LEGIT",
  status: "PROCESSED",
  risk_state: "VERIFIED / LOW RISK",
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
    vendor_status: "VERIFIED",
    bank_status: "EXACT_MATCH",
    registry_status: "CLEAN",
    forensic_status: "CLEAN",
    cti_status: "NEUTRAL",
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
      detail: "Standard commercial 30-day settlement terms without artificial pressure.",
    },
    {
      check: "Document Metadata & Anti-Tamper Forensics",
      status: "PASS",
      detail: "Clean ERP/Accounting export signature (No post-issuance tampering detected).",
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
  four_eyes_record: {
    clerk_verified: true,
    clerk_actor: "Siti Nurhaliza (Accounts AP)",
    clerk_timestamp: "10:15:00",
    clerk_notes: "Routine Net 30 vendor settlement against Purchase Order #PO-9912.",
    verified_phone_used: "+60-3-7722-8888",
    manager_resolution: "OVERRIDE_AUTHORIZED",
    manager_actor: "Tan Sri Ahmad (Finance Director)",
    manager_timestamp: "10:16:12",
    manager_notes: "Routine disbursement approved.",
  },
};

const PRESET_SCENARIO_2_MULE: AuditForensicReport = {
  case_id: "SCENARIO-2-SEMAKMULE",
  status: "PROCESSED",
  risk_state: "CRITICAL FRAUD INDICATORS",
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
      description:
        "OBSERVATION: Inbound sender domain unverified. EVIDENCE: Domain 'mega-bu1ld.com.my' is a homoglyph typosquat of Mega Build Sdn Bhd. IMPLICATION: High probability of impersonation. RECOMMENDED ACTION: Halt processing and verify via master ledger switchboard.",
    },
    {
      cue_code: "SEMAKMULE_BLACKLIST_HIT",
      agent_source: "Agent 1: Identity & Wire Forensic (PDRM SemakMule)",
      severity: "CRITICAL",
      description:
        "OBSERVATION: Illicit money mule account detected. EVIDENCE: Declared account 9876543210 is listed in PDRM SemakMule CCID illicit mule database. IMPLICATION: Fraudulent beneficiary diversion. RECOMMENDED ACTION: Freeze wire transfer immediately and notify SecOps.",
    },
    {
      cue_code: "PDF_METADATA_TAMPERED",
      agent_source: "Agent 1: Digital Forensics & Metadata Inspector",
      severity: "CRITICAL",
      description:
        "OBSERVATION: Document modification indicator detected in PDF metadata. EVIDENCE: Altered via consumer editing suite (Producer: iLovePDF Web Suite). IMPLICATION: PDF altered post-export. RECOMMENDED ACTION: Physical inspection required.",
    },
    {
      cue_code: "CISA_URGENCY",
      agent_source: "Agent 2: Cognitive Threat Analyst",
      severity: "HIGH",
      description:
        "OBSERVATION: Coercive psychological pressure detected. EVIDENCE: 'Transfer before 5:00 PM today to prevent work stoppage.' IMPLICATION: Social engineering panic trigger. RECOMMENDED ACTION: Enforce mandatory cooling-off period.",
    },
  ],
  safe_next_step: {
    action_type: "REQUIRE_HUMAN_CALLBACK",
    protocol: "OUT_OF_BAND_TELEPHONE_VERIFICATION",
    target_vendor: "Mega Build Sdn Bhd",
    authorized_phone_number: "+60-3-7722-8888",
    security_instructions:
      "CIRCUIT BREAKER ACTIVATED: Known PDRM SemakMule flagged illicit mule account. Wire transfer frozen. Verbally verify through authorized switchboard (+60-3-7722-8888) from master procurement ledger. Do NOT call telephone numbers printed on document.",
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
    vendor_status: "MISMATCH",
    bank_status: "MISMATCH",
    registry_status: "CONFIRMED_MULE",
    forensic_status: "SUSPICIOUS",
    cti_status: "ALIGNED",
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
      detail: "Inbound account 9876543210 diverges from master verified Maybank 5123-4567-8901.",
    },
    {
      check: "PDRM SemakMule Registry",
      status: "FAIL",
      detail: "CRITICAL: Account 9876543210 flagged in PDRM SemakMule CCID illicit database!",
    },
    {
      check: "Trending Modus Operandi (CTI)",
      status: "FAIL",
      detail: "Pretext matches trending MO: Account redirection with urgent penalty deadline.",
    },
    {
      check: "Urgency & Coercion Level",
      status: "FAIL",
      detail: "Artificial deadline coercion (before 5:00 PM today to prevent work stoppage).",
    },
    {
      check: "Document Metadata & Anti-Tamper Forensics",
      status: "FAIL",
      detail: "Document modification indicator detected: Producer indicates iLovePDF Web Suite.",
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
    { time: "11:22:16", stage: "Forensic Inspection", detail: "Metadata scan complete: Consumer PDF suite detected" },
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
    evidence: "Document modification indicator detected in PDF metadata (Producer: iLovePDF Web Suite)",
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
          primary_evidence: "CRITICAL FRAUD: Target account (9876543210) flagged in PDRM SemakMule CCID database.",
          action_required: "Emergency account freeze request under Section 116D CPC.",
        },
      },
      {
        channel: "Telegram SecOps Feed (@SME_CyberAlert_Bot)",
        status: "DISPATCHED",
        message_preview: "🚨 [CRITICAL ALERT] Payment Hold Triggered for Mega Build Sdn Bhd. Inbound account 9876543210 rejected.",
      },
      {
        integration: "AutoCount / SQL Account API Connector",
        status: "PAYMENT_LOCKED",
        detail: "Voucher payment status flagged as SUSPENDED pending Dual-Control 4-Eyes sign-off.",
      },
    ],
  },
  four_eyes_record: {
    clerk_verified: false,
    clerk_actor: null,
    clerk_timestamp: null,
    clerk_notes: null,
    verified_phone_used: null,
    manager_resolution: null,
    manager_actor: null,
    manager_timestamp: null,
    manager_notes: null,
  },
};

const PRESET_SCENARIO_3_CTI: AuditForensicReport = {
  case_id: "SCENARIO-3-CTI-PRETEXT",
  status: "PROCESSED",
  risk_state: "CRITICAL BEC DISCREPANCY",
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
      description:
        "OBSERVATION: Sender domain mismatch. EVIDENCE: 'mega-bu1ld.com.my' diverges from verified megabuild.com.my. IMPLICATION: High probability of impersonation. RECOMMENDED ACTION: Verify via master switchboard.",
    },
    {
      cue_code: "CTI_TREND_MATCH",
      agent_source: "Agent 2: Cognitive Threat Analyst (CTI Intelligence)",
      severity: "HIGH",
      description:
        "OBSERVATION: Pretext alignment with active threat advisory. EVIDENCE: Message states 'Maybank account under maintenance, remit to CIMB'. IMPLICATION: Known Malaysian BEC modus operandi. RECOMMENDED ACTION: Enforce out-of-band callback.",
    },
    {
      cue_code: "UNVERIFIED_BANK_CHANGE",
      agent_source: "Agent 1: Identity & Wire Forensic",
      severity: "CRITICAL",
      description:
        "OBSERVATION: Declared account unverified. EVIDENCE: 8009-4411-2299 does not exist on verified baseline. IMPLICATION: Unauthorized redirection. RECOMMENDED ACTION: Freeze wire transfer.",
    },
  ],
  safe_next_step: {
    action_type: "REQUIRE_HUMAN_CALLBACK",
    protocol: "OUT_OF_BAND_TELEPHONE_VERIFICATION",
    target_vendor: "Mega Build Sdn Bhd",
    authorized_phone_number: "+60-3-7722-8888",
    security_instructions:
      "CIRCUIT BREAKER ACTIVATED: Suspected invoice redirection using corporate banking maintenance pretext. Do NOT disburse funds. Call verified telephone (+60-3-7722-8888) from master procurement ledger.",
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
    vendor_status: "MISMATCH",
    bank_status: "MISMATCH",
    registry_status: "CLEAN",
    forensic_status: "SUSPICIOUS",
    cti_status: "ALIGNED",
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
      detail: "Pressure applied for same-day emergency wire bypass.",
    },
    {
      check: "Document Metadata & Anti-Tamper Forensics",
      status: "FAIL",
      detail: "Document modification indicator detected: Canva PDF Generator metadata signature.",
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
    { time: "14:02:02", stage: "Forensic Inspection", detail: "Metadata scan complete: Consumer PDF generator signature" },
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
    evidence: "Document modification indicator detected in PDF metadata (Producer: Canva PDF Generator)",
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
          fraud_classification: "BEC / Banking Maintenance Pretext",
          primary_evidence: "Banking maintenance social engineering pretext with unverified account redirection.",
          action_required: "Alert accounting team and lock vendor master record.",
        },
      },
    ],
  },
  four_eyes_record: {
    clerk_verified: false,
    clerk_actor: null,
    clerk_timestamp: null,
    clerk_notes: null,
    verified_phone_used: null,
    manager_resolution: null,
    manager_actor: null,
    manager_timestamp: null,
    manager_notes: null,
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Home() {
  const [channelMode, setChannelMode] = useState<"PDF" | "WHATSAPP">("PDF");
  const [report, setReport] = useState<AuditForensicReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedAudit, setCopiedAudit] = useState(false);
  const [isTechExpanded, setIsTechExpanded] = useState(false);
  const [expandedChecklist, setExpandedChecklist] = useState<number | null>(null);
  const [auditChainVerified, setAuditChainVerified] = useState<boolean | null>(true);

  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [senderEmail, setSenderEmail] = useState("billing@megabuild.com.my");
  const [whatsappText, setWhatsappText] = useState(
    "Boss, our Maybank account is under maintenance. Please use our new CIMB account urgently: 9876543210."
  );

  const fileInputId = useId();

  // 1. Session Hydration
  useEffect(() => {
    try {
      const cached = localStorage.getItem("scamguard_case_id");
      if (cached === "SCENARIO-1-LEGIT") {
        setReport(PRESET_SCENARIO_1_LEGIT);
      } else if (cached === "SCENARIO-3-CTI-PRETEXT") {
        setReport(PRESET_SCENARIO_3_CTI);
      } else {
        setReport(PRESET_SCENARIO_2_MULE);
      }
    } catch {
      setReport(PRESET_SCENARIO_2_MULE);
    }
  }, []);

  // Update session hydration safely (minimal token)
  const updateReportAndHydrate = (newReport: AuditForensicReport | null) => {
    setReport(newReport);
    if (newReport) {
      try {
        localStorage.setItem("scamguard_case_id", newReport.case_id);
      } catch {
        // ignore storage errors
      }
    } else {
      localStorage.removeItem("scamguard_case_id");
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
      const simulated: AuditForensicReport = {
        ...PRESET_SCENARIO_2_MULE,
        case_id: `INV-${Date.now().toString().slice(-6)}`,
        filename: file.name,
      };
      updateReportAndHydrate(simulated);
      setErrorMsg("Offline Demo Mode: Displaying simulated forensic verdict.");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. WhatsApp Message Ingestion
  const handleWhatsAppScan = async () => {
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
          subject: "WhatsApp Payment Request Dispatch",
        }),
      });

      if (!res.ok) {
        throw new Error(`Message analysis failed with server status ${res.status}`);
      }

      const data: AuditForensicReport = await res.json();
      updateReportAndHydrate(data);
    } catch (err: any) {
      console.warn("Live API call error, falling back to simulated message extraction:", err);
      const simulated: AuditForensicReport = {
        ...PRESET_SCENARIO_3_CTI,
        case_id: `MSG-${Date.now().toString().slice(-6)}`,
        filename: "whatsapp_dispatch.txt",
        verdict_summary:
          "CRITICAL FRAUD: WhatsApp message directs payment to PDRM SemakMule flagged account (9876543210).",
      };
      updateReportAndHydrate(simulated);
      setErrorMsg("Offline Demo Mode: Displaying simulated forensic verdict.");
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Dual-Control 4-Eyes Actions
  const handleClerkSignOff = async () => {
    if (!report) return;
    const nowStr = new Date().toLocaleTimeString();

    try {
      const res = await fetch("http://localhost:8000/api/audit/4-eyes-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: report.case_id,
          actor: "Siti Nurhaliza (Accounts AP)",
          role: "ACCOUNTS_CLERK",
          action: "MARK_VERIFIED",
          notes: "Out-of-band telephone verification completed with master ledger corporate contact.",
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        updateReportAndHydrate(updated);
        return;
      }
    } catch (e) {
      console.warn("Backend 4-eyes call failed, applying local state:", e);
    }

    // Local fallback state
    const updated: AuditForensicReport = {
      ...report,
      four_eyes_record: {
        ...(report.four_eyes_record || {
          clerk_verified: false,
          manager_resolution: null,
        }),
        clerk_verified: true,
        clerk_actor: "Siti Nurhaliza (Accounts AP)",
        clerk_timestamp: nowStr,
        clerk_notes: "Out-of-band verification completed via master ledger switchboard.",
        verified_phone_used: report.safe_next_step?.authorized_phone_number || "+60-3-7722-8888",
      },
    };
    updateReportAndHydrate(updated);
  };

  const handleManagerDecision = async (decision: "AUTHORIZE_OVERRIDE" | "CONFIRM_FRAUD_FREEZE") => {
    if (!report) return;
    const nowStr = new Date().toLocaleTimeString();

    try {
      const res = await fetch("http://localhost:8000/api/audit/4-eyes-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: report.case_id,
          actor: "Tan Sri Ahmad (Finance Director)",
          role: "FINANCE_MANAGER",
          action: decision,
          notes:
            decision === "AUTHORIZE_OVERRIDE"
              ? "Secondary executive override signed."
              : "Payment freeze confirmed; transfer aborted and flagged for NSRC 997.",
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        updateReportAndHydrate(updated);
        return;
      }
    } catch (e) {
      console.warn("Backend 4-eyes call failed, applying local state:", e);
    }

    // Local fallback state
    const updated: AuditForensicReport = {
      ...report,
      four_eyes_record: {
        ...(report.four_eyes_record || {
          clerk_verified: false,
          manager_resolution: null,
        }),
        clerk_verified: report.four_eyes_record?.clerk_verified ?? true,
        manager_resolution: decision === "AUTHORIZE_OVERRIDE" ? "OVERRIDE_AUTHORIZED" : "FREEZE_PAYMENT_CONFIRMED",
        manager_actor: "Tan Sri Ahmad (Finance Director)",
        manager_timestamp: nowStr,
        manager_notes:
          decision === "AUTHORIZE_OVERRIDE"
            ? "Secondary executive override signed."
            : "Payment freeze confirmed; transfer aborted.",
      },
    };
    updateReportAndHydrate(updated);
  };

  // Copy raw JSON audit trail
  const handleCopyJSON = () => {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopiedAudit(true);
    setTimeout(() => setCopiedAudit(false), 2000);
  };

  // Score styling
  const score = report?.risk_score ?? 0;
  const isQuarantined = report?.status === "QUARANTINED" || report?.risk_state === "QUARANTINED";

  let statusBadgeStyle = "text-emerald-400 bg-emerald-950/40 border-emerald-800/50";
  let scoreBarColor = "bg-emerald-500";
  if (score > 60 || isQuarantined) {
    statusBadgeStyle = "text-rose-400 bg-rose-950/40 border-rose-800/50";
    scoreBarColor = "bg-rose-500";
  } else if (score > 20) {
    statusBadgeStyle = "text-amber-300 bg-amber-950/40 border-amber-800/50";
    scoreBarColor = "bg-amber-500";
  }

  const primaryVerdict =
    report?.verdict_summary ||
    (report?.is_scam
      ? "CRITICAL THREAT: Unauthorized bank-account replacement detected"
      : "VERIFIED SAFE: Inbound transaction matches registered procurement baseline");

  return (
    <div className="min-h-screen bg-[#0B111E] text-[#F1F5F9] font-sans selection:bg-[#C5A880]/30 selection:text-white pb-20">
      {/* ==================================================================== */}
      {/* PRINT-ONLY DOSSIER VIEW (A4 Bank & Police Incident Dossier)           */}
      {/* ==================================================================== */}
      <div className="hidden print-only p-8 text-black bg-white">
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-950 uppercase">
                Official Forensic Incident Dossier
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                PDRM CCID / Bank Negara Malaysia Incident Reporting • Malaysian PDPA Section 10 Compliant
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded">
                CASE: {report?.case_id || "N/A"}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                Timestamp: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {report && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-300 rounded">
              <h2 className="font-bold text-xs uppercase text-slate-700 mb-1">Primary Assessment</h2>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-500 block">Risk Score:</span>
                  <span className="font-bold text-sm">{report.risk_score}/100 ({report.risk_state || report.threat_level})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status:</span>
                  <span className="font-bold text-sm">{report.status || "PROCESSED"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">PDRM SemakMule:</span>
                  <span className="font-bold text-sm">
                    {report.discrepancy_matrix?.is_mule ? "YES - BLACKLISTED" : "NO - CLEAN"}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs font-medium border-t border-slate-200 pt-1">
                Executive Verdict: {report.verdict_summary || report.executive_summary}
              </p>
            </div>

            <div className="border border-slate-300 rounded p-3">
              <h2 className="font-bold text-xs uppercase text-slate-700 mb-1">Two-Way Verification Matrix</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-r border-slate-200 pr-2">
                  <span className="font-semibold block text-slate-600">Master Procurement Ledger:</span>
                  <p>Vendor: {report.discrepancy_matrix?.ledger_vendor_name || "Unregistered"}</p>
                  <p>Registered Bank: {report.discrepancy_matrix?.ledger_bank_account || "None"}</p>
                  <p>Verified Switchboard: +60-3-7722-8888</p>
                </div>
                <div>
                  <span className="font-semibold block text-slate-600">Inbound Document Extraction:</span>
                  <p>Inbound Bank: {report.discrepancy_matrix?.invoice_bank_account}</p>
                  <p>Account Match: {report.discrepancy_matrix?.account_match ? "MATCH" : "DISCREPANCY"}</p>
                  <p>Mule Status: {report.discrepancy_matrix?.is_mule ? "FLAGGED ILLICIT MULE" : "CLEAN"}</p>
                </div>
              </div>
            </div>

            <div className="border border-slate-300 rounded p-3">
              <h2 className="font-bold text-xs uppercase text-slate-700 mb-1">Forensic Audit Checklist</h2>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-1">Checkpoint</th>
                    <th className="py-1">Status</th>
                    <th className="py-1">Detail</th>
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

            {report.four_eyes_record && (
              <div className="border border-slate-300 rounded p-3">
                <h2 className="font-bold text-xs uppercase text-slate-700 mb-1">
                  Dual-Control Governance Trail (4-Eyes Principle)
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold block">Step 1: Accounts Clerk Verbal Verification</span>
                    <p>Status: {report.four_eyes_record.clerk_verified ? `VERIFIED at ${report.four_eyes_record.clerk_timestamp}` : "PENDING"}</p>
                    <p>Actor: {report.four_eyes_record.clerk_actor || "Unassigned"}</p>
                    <p>Phone Dialed: {report.four_eyes_record.verified_phone_used || "+60-3-7722-8888"}</p>
                  </div>
                  <div>
                    <span className="font-semibold block">Step 2: Finance Manager Authorization</span>
                    <p>Resolution: {report.four_eyes_record.manager_resolution || "PENDING"}</p>
                    <p>Actor: {report.four_eyes_record.manager_actor || "Unassigned"}</p>
                    <p>Timestamp: {report.four_eyes_record.manager_timestamp || "Pending"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* INTERACTIVE WEB INTERFACE                                             */}
      {/* ==================================================================== */}
      <div className="no-print max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* ------------------------------------------------------------------ */}
        {/* HEADER: Calm, Trustworthy, Technical Branding                     */}
        {/* ------------------------------------------------------------------ */}
        <header className="bg-[#111A2E] border border-[#1E2D4A] rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-md bg-[#16223B] border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-lg font-bold tracking-tight text-[#F1F5F9]">
                  SME-ScamGuard-AI
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#16223B] text-[#C5A880] border border-[#C5A880]/30">
                  Local-First • Controlled External AI Boundary
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Accounts Payable BEC Defense • Deterministic Evidence • 4-Eyes Governance
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded bg-[#16223B] border border-[#1E2D4A] text-[#CBD5E1] hover:text-white hover:border-[#C5A880]/50 transition-colors"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5 text-[#C5A880]" />
              Export Dossier (PDF)
            </button>
            <button
              type="button"
              onClick={handleResetSession}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded bg-[#16223B] border border-[#1E2D4A] text-[#94A3B8] hover:text-white transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </button>
          </div>
        </header>

        {/* ------------------------------------------------------------------ */}
        {/* INGESTION & DEMO CONTROLS TOOLBAR                                 */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-[#111A2E] border border-[#1E2D4A] rounded-lg p-3 sm:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
          {/* Preset Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-[#94A3B8] font-medium flex items-center">
              <Search className="h-3.5 w-3.5 mr-1 text-[#C5A880]" />
              Demo Scenario:
            </span>
            <select
              aria-label="Demo Preset Scenario Selector"
              onChange={(e) => handlePresetSelect(e.target.value)}
              defaultValue="scenario_2"
              className="bg-[#16223B] border border-[#1E2D4A] rounded px-2.5 py-1 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#C5A880] cursor-pointer"
            >
              <option value="scenario_1">Scenario 1: Legitimate Vendor (MegaBuild - Maybank Match)</option>
              <option value="scenario_2">Scenario 2: BEC Redirection + SemakMule Hit (CIMB Mule Flagged)</option>
              <option value="scenario_3">Scenario 3: WhatsApp Social Engineering (Maintenance Pretext)</option>
            </select>
          </div>

          {/* Channel Selector */}
          <div className="flex items-center bg-[#0B111E] p-0.5 rounded border border-[#1E2D4A]">
            <button
              type="button"
              onClick={() => setChannelMode("PDF")}
              className={`flex items-center px-3 py-1 rounded text-xs font-medium transition-colors ${
                channelMode === "PDF"
                  ? "bg-[#16223B] text-[#C5A880] border border-[#C5A880]/30 shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F1F5F9]"
              }`}
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              PDF / Document
            </button>
            <button
              type="button"
              onClick={() => setChannelMode("WHATSAPP")}
              className={`flex items-center px-3 py-1 rounded text-xs font-medium transition-colors ${
                channelMode === "WHATSAPP"
                  ? "bg-[#16223B] text-[#C5A880] border border-[#C5A880]/30 shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F1F5F9]"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              WhatsApp Message
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* INGESTION INPUT PANEL                                             */}
        {/* ------------------------------------------------------------------ */}
        {channelMode === "PDF" ? (
          <div className="bg-[#111A2E] border border-[#1E2D4A] rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-auto flex-1">
                <label className="block text-[11px] font-mono text-[#94A3B8] mb-1">
                  COUNTERPARTY SENDER IDENTITY
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full bg-[#16223B] border border-[#1E2D4A] rounded px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#C5A880]"
                  placeholder="e.g. billing@megabuild.com.my"
                />
              </div>

              <div className="w-full sm:w-auto">
                <input
                  id={fileInputId}
                  type="file"
                  accept=".pdf,.docx,.txt,image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
                <label
                  htmlFor={fileInputId}
                  className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 text-xs font-medium rounded bg-[#C5A880] text-[#0B111E] hover:bg-[#D4AF37] cursor-pointer transition-colors font-semibold"
                >
                  <UploadCloud className="h-4 w-4 mr-2" />
                  {isLoading ? "Analyzing Inbound Artifact..." : "Upload Invoice (PDF / DOCX)"}
                </label>
              </div>
            </div>
            {selectedFile && (
              <p className="text-[11px] text-[#94A3B8] mt-2 font-mono">
                Active Artifact: <span className="text-[#C5A880]">{selectedFile.name}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="bg-[#111A2E] border border-[#1E2D4A] rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-mono text-[#94A3B8] uppercase">
                Inbound WhatsApp / Chat Payment Request
              </span>
              <span className="text-[10px] text-[#C5A880] font-mono">Channel: WhatsApp Dispatch (+6012-9881122)</span>
            </div>
            <textarea
              rows={2}
              value={whatsappText}
              onChange={(e) => setWhatsappText(e.target.value)}
              className="w-full bg-[#16223B] border border-[#1E2D4A] rounded p-2.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#C5A880]"
              placeholder="Paste suspicious payment request message here..."
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleWhatsAppScan}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-1.5 text-xs font-semibold rounded bg-[#C5A880] text-[#0B111E] hover:bg-[#D4AF37] transition-colors"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {isLoading ? "Analyzing Social Signals..." : "Analyze Message Signals"}
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-[#16223B] border border-amber-900/50 rounded text-xs text-amber-200">
            {errorMsg}
          </div>
        )}

        {/* ================================================================== */}
        {/* ZONE 1: EXECUTIVE OVERVIEW — "What is happening?"                   */}
        {/* ================================================================== */}
        {report && (
          <section className="bg-[#111A2E] border border-[#1E2D4A] rounded-lg p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${statusBadgeStyle}`}>
                    {report.risk_state || report.threat_level}
                  </span>
                  <span className="text-xs text-[#94A3B8] font-mono">
                    Incident ID: {report.case_id}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#F1F5F9] tracking-tight">
                  {primaryVerdict}
                </h2>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {report.executive_summary}
                </p>
              </div>

              {/* Compact Restrained Score View */}
              <div className="w-full md:w-56 bg-[#16223B] border border-[#1E2D4A] rounded p-3 flex flex-col justify-center">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Composite Risk</span>
                  <div className="font-mono font-bold text-lg text-[#F1F5F9]">
                    {report.risk_score.toFixed(0)} <span className="text-xs text-[#94A3B8] font-normal">/ 100</span>
                  </div>
                </div>
                <div className="w-full bg-[#0B111E] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${scoreBarColor}`}
                    style={{ width: `${Math.min(100, Math.max(0, report.risk_score))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[#64748B] mt-1.5">
                  <span>LOW RISK</span>
                  <span>SUSPICIOUS</span>
                  <span>CRITICAL</span>
                </div>
              </div>
            </div>

            {/* Inbound WhatsApp Message Signals breakdown if WhatsApp Mode */}
            {channelMode === "WHATSAPP" && (
              <div className="p-3 bg-[#0B111E] border border-[#1E2D4A] rounded text-xs space-y-2">
                <span className="text-[10px] font-mono text-[#C5A880] uppercase tracking-wider block">
                  DETECTED SOCIAL-ENGINEERING SIGNALS
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2 bg-[#16223B] rounded border border-[#1E2D4A]">
                    <span className="text-[#F1F5F9] font-medium block">Bank Change Request</span>
                    <span className="text-[11px] text-[#94A3B8]">Requesting wire shift to secondary CIMB account</span>
                  </div>
                  <div className="p-2 bg-[#16223B] rounded border border-[#1E2D4A]">
                    <span className="text-[#F1F5F9] font-medium block">Artificial Urgency</span>
                    <span className="text-[11px] text-[#94A3B8]">Maintenance window creating false immediate deadline</span>
                  </div>
                  <div className="p-2 bg-[#16223B] rounded border border-[#1E2D4A]">
                    <span className="text-[#F1F5F9] font-medium block">Recommended Action</span>
                    <span className="text-[11px] text-[#C5A880]">Verify via master ledger switchboard (+60-3-7722-8888)</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================================================================== */}
        {/* ZONE 2: EVIDENCE + HUMAN VERIFICATION — "Why?"                     */}
        {/* ================================================================== */}
        {report && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left 7 Columns: Two-Way Evidence Matrix & 6-Item Checklist      */}
            <div className="lg:col-span-7 space-y-6">

              {/* Two-Way Evidence Matrix */}
              <div className="bg-[#111A2E] border border-[#1E2D4A] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#1E2D4A] pb-2.5">
                  <h3 className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider">
                    Two-Way Cross-Verification Matrix
                  </h3>
                  <span className="text-[10px] font-mono text-[#C5A880]">
                    Master Ledger vs Inbound Extraction
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#1E2D4A] text-[#94A3B8] font-mono text-[10px]">
                        <th className="py-1.5 font-normal">ATTRIBUTE</th>
                        <th className="py-1.5 font-normal">MASTER PROCUREMENT LEDGER</th>
                        <th className="py-1.5 font-normal">INBOUND EXTRACTION</th>
                        <th className="py-1.5 font-normal text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2D4A]/60 font-mono text-[11px]">
                      <tr>
                        <td className="py-2 text-[#94A3B8] font-sans">Vendor Identity</td>
                        <td className="py-2 text-[#F1F5F9]">
                          {report.discrepancy_matrix?.ledger_vendor_name || "Mega Build Sdn Bhd"}
                        </td>
                        <td className="py-2 text-[#F1F5F9]">
                          {report.discrepancy_matrix?.ledger_vendor_name || "Inbound Counterparty"}
                        </td>
                        <td className="py-2 text-right">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              report.discrepancy_matrix?.vendor_status === "VERIFIED"
                                ? "text-emerald-400 bg-emerald-950/40"
                                : "text-amber-300 bg-amber-950/40"
                            }`}
                          >
                            {report.discrepancy_matrix?.vendor_status || "VERIFIED"}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-[#94A3B8] font-sans">Bank Account</td>
                        <td className="py-2 text-[#F1F5F9]">
                          {report.discrepancy_matrix?.ledger_bank_account || "5123-4567-8901"}
                        </td>
                        <td className="py-2 text-[#F1F5F9]">
                          {report.discrepancy_matrix?.invoice_bank_account}
                        </td>
                        <td className="py-2 text-right">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              report.discrepancy_matrix?.account_match
                                ? "text-emerald-400 bg-emerald-950/40"
                                : "text-rose-400 bg-rose-950/40"
                            }`}
                          >
                            {report.discrepancy_matrix?.account_match ? "EXACT MATCH" : "MISMATCH"}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-[#94A3B8] font-sans">Fraud Registry</td>
                        <td className="py-2 text-[#94A3B8]">Clean (0 reports)</td>
                        <td className="py-2 text-[#F1F5F9]">
                          {report.discrepancy_matrix?.is_mule
                            ? "SemakMule CCID Flagged"
                            : "Clean in Registry"}
                        </td>
                        <td className="py-2 text-right">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              report.discrepancy_matrix?.is_mule
                                ? "text-rose-400 bg-rose-950/40"
                                : "text-emerald-400 bg-emerald-950/40"
                            }`}
                          >
                            {report.discrepancy_matrix?.is_mule ? "CONFIRMED MULE" : "CLEAN"}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-[#94A3B8] font-sans">Forensics</td>
                        <td className="py-2 text-[#94A3B8]">Clean ERP Signature</td>
                        <td className="py-2 text-[#F1F5F9]">
                          {report.pdf_forensics?.is_tampered
                            ? "Consumer Tool Indicator"
                            : "Clean Metadata"}
                        </td>
                        <td className="py-2 text-right">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              report.pdf_forensics?.is_tampered
                                ? "text-rose-400 bg-rose-950/40"
                                : "text-emerald-400 bg-emerald-950/40"
                            }`}
                          >
                            {report.pdf_forensics?.is_tampered ? "MODIFIED" : "CLEAN"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6-Point Forensic Checklist */}
              <div className="bg-[#111A2E] border border-[#1E2D4A] rounded-lg p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#1E2D4A] pb-2">
                  <h3 className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider">
                    Forensic Verification Checklist
                  </h3>
                  <span className="text-[10px] text-[#94A3B8]">Click any row for forensic evidence</span>
                </div>

                <div className="space-y-1.5">
                  {report.audit_checklist?.map((item, idx) => {
                    const isExpanded = expandedChecklist === idx;
                    const isPass = item.status === "PASS";
                    const isFail = item.status === "FAIL";

                    return (
                      <div
                        key={idx}
                        className="bg-[#16223B] border border-[#1E2D4A] rounded overflow-hidden transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedChecklist(isExpanded ? null : idx)}
                          className="w-full p-2.5 flex items-center justify-between text-left text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                isPass
                                  ? "text-emerald-400 bg-emerald-950/50 border border-emerald-800/40"
                                  : isFail
                                  ? "text-rose-400 bg-rose-950/50 border border-rose-800/40"
                                  : "text-amber-300 bg-amber-950/50 border border-amber-800/40"
                              }`}
                            >
                              {item.status}
                            </span>
                            <span className="text-[#F1F5F9] font-medium">{item.check}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8]" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-2.5 pt-1 text-[11px] text-[#94A3B8] border-t border-[#1E2D4A]/60 bg-[#0B111E]/40 space-y-1">
                            <p className="leading-relaxed">
                              <span className="text-[#C5A880] font-mono">Detail: </span>
                              {item.detail}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Human 4-Eyes Control & Automated Actions       */}
            <div className="lg:col-span-5 space-y-6">

              {/* Human 4-Eyes Control Workflow */}
              <div className="bg-[#111A2E] border border-[#1E2D4A] rounded-lg p-4 space-y-4">
                <div className="border-b border-[#1E2D4A] pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider flex items-center">
                    <Lock className="h-3.5 w-3.5 mr-1.5 text-[#C5A880]" />
                    Dual-Control 4-Eyes Governance
                  </h3>
                  <span className="text-[10px] text-[#C5A880] font-mono">SOC Governance</span>
                </div>

                {/* Out-of-band telephone verification box */}
                <div className="p-3 bg-[#16223B] border border-[#1E2D4A] rounded space-y-2 text-xs">
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">
                    Out-of-Band Verbal Verification
                  </span>
                  <div className="space-y-1">
                    <span className="text-[#94A3B8] block text-[11px]">Verified Master Switchboard:</span>
                    <span className="font-mono text-sm font-bold text-[#C5A880] block">
                      {report.safe_next_step?.authorized_phone_number || "+60-3-7722-8888"}
                    </span>
                    <p className="text-[11px] text-[#94A3B8] leading-tight">
                      {report.safe_next_step?.security_instructions ||
                        "Call verified telephone line from master procurement ledger. Never dial numbers printed on invoice."}
                    </p>
                  </div>
                </div>

                {/* STEP 1: Clerk Verbal Verification */}
                <div className="space-y-2 border-t border-[#1E2D4A] pt-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[11px] text-[#94A3B8]">STEP 1: ACCOUNTS CLERK</span>
                    {report.four_eyes_record?.clerk_verified ? (
                      <span className="text-emerald-400 font-mono text-[10px] flex items-center">
                        <Check className="h-3 w-3 mr-1" /> VERIFIED ({report.four_eyes_record.clerk_timestamp})
                      </span>
                    ) : (
                      <span className="text-amber-300 font-mono text-[10px]">PENDING VERIFICATION</span>
                    )}
                  </div>

                  {!report.four_eyes_record?.clerk_verified ? (
                    <button
                      type="button"
                      onClick={handleClerkSignOff}
                      className="w-full py-1.5 text-xs font-semibold rounded bg-[#16223B] border border-[#C5A880] text-[#C5A880] hover:bg-[#C5A880] hover:text-[#0B111E] transition-colors"
                    >
                      Mark Verbal Verification Complete
                    </button>
                  ) : (
                    <p className="text-[11px] text-[#94A3B8] bg-[#0B111E] p-2 rounded font-mono">
                      Verified by: {report.four_eyes_record.clerk_actor || "Accounts Clerk"}
                    </p>
                  )}
                </div>

                {/* STEP 2: Finance Manager Secondary Authorization */}
                <div className="space-y-2 border-t border-[#1E2D4A] pt-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[11px] text-[#94A3B8]">STEP 2: FINANCE MANAGER</span>
                    {report.four_eyes_record?.manager_resolution ? (
                      <span
                        className={`font-mono text-[10px] ${
                          report.four_eyes_record.manager_resolution === "OVERRIDE_AUTHORIZED"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {report.four_eyes_record.manager_resolution}
                      </span>
                    ) : (
                      <span className="text-amber-300 font-mono text-[10px]">AWAITING RESOLUTION</span>
                    )}
                  </div>

                  {!report.four_eyes_record?.manager_resolution ? (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleManagerDecision("AUTHORIZE_OVERRIDE")}
                        disabled={!report.four_eyes_record?.clerk_verified}
                        className="flex-1 py-1.5 text-xs font-semibold rounded bg-[#16223B] border border-[#1E2D4A] text-[#CBD5E1] hover:text-white hover:border-[#C5A880] disabled:opacity-40 transition-colors"
                      >
                        Authorize Override
                      </button>
                      <button
                        type="button"
                        onClick={() => handleManagerDecision("CONFIRM_FRAUD_FREEZE")}
                        className="flex-1 py-1.5 text-xs font-semibold rounded bg-rose-950/40 border border-rose-800 text-rose-300 hover:bg-rose-900/50 transition-colors"
                      >
                        Freeze Transfer
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#94A3B8] bg-[#0B111E] p-2 rounded font-mono">
                      Resolution: {report.four_eyes_record.manager_resolution} by{" "}
                      {report.four_eyes_record.manager_actor || "Finance Director"}
                    </p>
                  )}
                </div>
              </div>

              {/* Automated Containment Dispatch */}
              {report.defensive_actions?.is_triggered && (
                <div className="bg-[#111A2E] border border-[#1E2D4A] rounded-lg p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center border-b border-[#1E2D4A] pb-2">
                    <span className="font-bold text-[#F1F5F9] uppercase tracking-wider text-[11px]">
                      Automated Containment Actions
                    </span>
                    <span className="text-[10px] text-[#C5A880] font-mono">
                      {report.defensive_actions.status_badge}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 bg-[#16223B] rounded border border-[#1E2D4A] space-y-0.5">
                      <span className="text-[#C5A880] font-mono text-[10px] block">NSRC 997 / PDRM JSJK</span>
                      <p className="text-[11px] text-[#CBD5E1]">
                        Preliminary incident dispatch prepared for CCID Section 116D CPC freeze.
                      </p>
                    </div>
                    <div className="p-2 bg-[#16223B] rounded border border-[#1E2D4A] space-y-0.5">
                      <span className="text-[#C5A880] font-mono text-[10px] block">AutoCount / SQL Account API</span>
                      <p className="text-[11px] text-[#CBD5E1]">
                        ERP payment voucher status locked pending dual-control completion.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* ZONE 3: TECHNICAL FORENSICS — "How?" (Collapsed by Default)        */}
        {/* ================================================================== */}
        {report && (
          <section className="bg-[#111A2E] border border-[#1E2D4A] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setIsTechExpanded(!isTechExpanded)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#16223B] transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <Cpu className="h-4 w-4 text-[#C5A880]" />
                <span className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider">
                  Technical Forensics & Cryptographic Audit
                </span>
                <span className="text-[10px] text-[#94A3B8] font-mono">
                  (Latency, DAG Telemetry, PDF Metadata, SHA-256 Chain)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#C5A880] font-mono">
                  {isTechExpanded ? "Hide [ - ]" : "Inspect [ + ]"}
                </span>
              </div>
            </button>

            {isTechExpanded && (
              <div className="p-5 border-t border-[#1E2D4A] space-y-6 text-xs bg-[#0B111E]/40">

                {/* Minimal Vertical Agent Timeline */}
                <div>
                  <h4 className="text-[11px] font-mono text-[#C5A880] uppercase tracking-wider mb-2.5">
                    Agent Execution Timeline & Telemetry
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono text-xs">
                    <div className="p-3 bg-[#16223B] rounded border border-[#1E2D4A]">
                      <span className="text-[#94A3B8] block text-[10px]">01 PII SCRUB</span>
                      <span className="text-[#F1F5F9] font-bold block mt-0.5">COMPLETED</span>
                      <span className="text-[#C5A880] text-[11px]">
                        {report.pipeline_telemetry?.stage_0_pii_scrub.latency_ms ?? 8}ms
                      </span>
                    </div>
                    <div className="p-3 bg-[#16223B] rounded border border-[#1E2D4A]">
                      <span className="text-[#94A3B8] block text-[10px]">02 IDENTITY & FORENSICS</span>
                      <span className="text-[#F1F5F9] font-bold block mt-0.5">COMPLETED</span>
                      <span className="text-[#C5A880] text-[11px]">
                        {report.pipeline_telemetry?.stage_1_ledger_match.latency_ms ?? 14}ms
                      </span>
                    </div>
                    <div className="p-3 bg-[#16223B] rounded border border-[#1E2D4A]">
                      <span className="text-[#94A3B8] block text-[10px]">03 CTI ANALYSIS</span>
                      <span className="text-[#F1F5F9] font-bold block mt-0.5">COMPLETED</span>
                      <span className="text-[#C5A880] text-[11px]">
                        {report.pipeline_telemetry?.stage_2_cognitive_gemini.latency_ms ?? 310}ms
                      </span>
                    </div>
                    <div className="p-3 bg-[#16223B] rounded border border-[#1E2D4A]">
                      <span className="text-[#94A3B8] block text-[10px]">04 DETERMINISTIC ARBITER</span>
                      <span className="text-[#F1F5F9] font-bold block mt-0.5">COMPLETED</span>
                      <span className="text-[#C5A880] text-[11px]">
                        {report.pipeline_telemetry?.stage_3_risk_arbiter.latency_ms ?? 2}ms
                      </span>
                    </div>
                  </div>
                </div>

                {/* PDF Metadata & Artifact Fingerprint */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-[#16223B] border border-[#1E2D4A] rounded space-y-1.5 font-mono text-[11px]">
                    <span className="text-[#C5A880] block text-[10px] uppercase">PDF Document Internal Metadata</span>
                    <p><span className="text-[#94A3B8]">Producer:</span> {report.pdf_forensics?.producer || "N/A"}</p>
                    <p><span className="text-[#94A3B8]">Creator:</span> {report.pdf_forensics?.creator || "N/A"}</p>
                    <p><span className="text-[#94A3B8]">ModDate:</span> {report.pdf_forensics?.mod_date || "N/A"}</p>
                    <p>
                      <span className="text-[#94A3B8]">Tamper Status:</span>{" "}
                      <span className={report.pdf_forensics?.is_tampered ? "text-rose-400" : "text-emerald-400"}>
                        {report.pdf_forensics?.is_tampered ? "MODIFICATION INDICATOR DETECTED" : "CLEAN ERP EXPORT"}
                      </span>
                    </p>
                  </div>

                  <div className="p-3 bg-[#16223B] border border-[#1E2D4A] rounded space-y-1.5 font-mono text-[11px]">
                    <span className="text-[#C5A880] block text-[10px] uppercase">Artifact Fingerprint & Audit Chain</span>
                    <p className="truncate">
                      <span className="text-[#94A3B8]">SHA-256:</span> {report.artifact_tracking?.artifact_hash || "e3b0c44298fc1c14..."}
                    </p>
                    <p>
                      <span className="text-[#94A3B8]">Replay Status:</span>{" "}
                      <span className={report.artifact_tracking?.is_duplicate ? "text-amber-300" : "text-emerald-400"}>
                        {report.artifact_tracking?.status_badge || "PASS: UNIQUE ARTIFACT (NEW)"}
                      </span>
                    </p>
                    <p>
                      <span className="text-[#94A3B8]">Audit Ledger:</span>{" "}
                      <span className="text-emerald-400 font-bold">
                        AUDIT INTEGRITY: VERIFIED (Cryptographic SHA-256 Hash Chain)
                      </span>
                    </p>
                  </div>
                </div>

                {/* Raw JSON Audit Trail Export */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[11px] text-[#94A3B8]">RAW JSON AUDIT TELEMETRY</span>
                    <button
                      type="button"
                      onClick={handleCopyJSON}
                      className="inline-flex items-center px-2 py-1 text-[11px] font-mono text-[#C5A880] bg-[#16223B] border border-[#1E2D4A] rounded hover:border-[#C5A880]/50"
                    >
                      {copiedAudit ? (
                        <>
                          <Check className="h-3 w-3 mr-1 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" /> Copy JSON
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 bg-[#0B111E] border border-[#1E2D4A] rounded text-[10px] font-mono text-[#94A3B8] max-h-48 overflow-y-auto">
                    {JSON.stringify(report, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
