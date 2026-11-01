from pathlib import Path

p = Path("backend/app/routers/queue.py")
content = p.read_text(encoding="utf-8")

# Replace override_case_field & decide_case
override_start = '@router.post("/queue/{case_id}/override", summary="Record operator correction with switchboard justification")'
decide_end_marker = 'return {\n            "status": "success",\n            "decision": "PAYMENT_RELEASED",\n            "case_id": case_id,\n            "disposition": "VERIFIED",\n            "audit_event": audit_evt,\n            "record": rec,\n        }\n'

idx1 = content.find(override_start)
idx2 = content.find(decide_end_marker)

if idx1 == -1 or idx2 == -1:
    print(f"Failed to find markers: idx1={idx1}, idx2={idx2}")
    exit(1)

idx2_end = idx2 + len(decide_end_marker)

new_block = '''@router.post("/queue/{case_id}/override", summary="Record operator correction with switchboard justification")
async def override_case_field(case_id: str, req: OverrideRequest):
    """
    Records an operator correction with switchboard callback justification,
    mutates target case with corrected_fields and has_operator_override = True,
    and appends a cryptographically chained event to the audit trail.
    """
    init_demo_mailbox_if_needed()
    rec = SESSION_DEMO_MAILBOX.get(case_id)
    alt_id = case_id.replace("email_", "inv_") if case_id.startswith("email_") else case_id.replace("inv_", "email_")
    if not rec:
        rec = SESSION_DEMO_MAILBOX.get(alt_id)

    if not rec:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found in queue")

    comparison = rec.get("comparison", {})
    target_key = req.field_name if req.field_name in comparison else map_comparison_field(req.field_name)

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    if target_key in comparison:
        field_obj = comparison[target_key]
        orig_val = field_obj.get("original_draft") or field_obj.get("draft")
        field_obj["original_draft"] = orig_val
        field_obj["draft"] = req.corrected_value
        field_obj["status"] = "corrected"
        field_obj["score"] = 100
        field_obj["justification"] = req.justification
        field_obj["corrected_by"] = req.clerk_id
        field_obj["corrected_at"] = now_str
    else:
        comparison[target_key] = {
            "truth": req.corrected_value,
            "draft": req.corrected_value,
            "status": "corrected",
            "score": 100,
            "justification": req.justification,
            "corrected_by": req.clerk_id,
            "corrected_at": now_str,
        }

    # Track operator override and corrected fields list
    rec["has_operator_override"] = True
    if "corrected_fields" not in rec or not isinstance(rec["corrected_fields"], list):
        rec["corrected_fields"] = []

    rec["corrected_fields"].append({
        "field": req.field_name,
        "canonical_field": target_key,
        "value": req.corrected_value,
        "timestamp": now_str,
        "clerk_id": req.clerk_id,
        "justification": req.justification,
    })

    # Recalculate defects
    defects = sum(1 for v in comparison.values() if v.get("status") == "defect")
    rec["defect_fields"] = defects
    if defects == 0:
        rec["status"] = "VERIFIED"
        rec["risk_score"] = 0

    # Chained audit event
    audit_evt = record_audit_event(
        case_id=case_id,
        action="OPERATOR_CORRECTION",
        disposition=rec["status"],
        risk_score=rec["risk_score"],
        operator_id=req.clerk_id,
        details={
            "field": req.field_name,
            "canonical_field": target_key,
            "corrected_to": req.corrected_value,
            "justification": req.justification,
            "switchboard_dialed": req.official_landline_dialed,
        },
    )

    # Sync to session audit trail for UI display
    SESSION_AUDIT_TRAIL.append({
        "id": audit_evt["event_id"],
        "timestamp": now_str,
        "action": "OPERATOR_CORRECTION",
        "badge_color": "amber",
        "description": f"Field '{req.field_name}' verified and corrected via switchboard callback to '{req.corrected_value}'.",
        "justification": req.justification,
        "operator_id": req.clerk_id,
        "event_hash": audit_evt.get("event_hash"),
        "prior_hash": audit_evt.get("prior_hash"),
    })

    # Synchronize dual case identifiers
    SESSION_DEMO_MAILBOX[case_id] = rec
    SESSION_DEMO_MAILBOX[alt_id] = rec

    return {
        "status": "success",
        "case_id": case_id,
        "updated_field": req.field_name,
        "canonical_field": target_key,
        "new_value": req.corrected_value,
        "current_status": rec["status"],
        "record": rec,
        "audit_event": audit_evt,
    }


@router.post("/queue/{case_id}/decide", summary="Commit dual-authorization sign-off or freeze wire")
async def decide_case(case_id: str, req: DecideRequest):
    """
    Commits operator approval or escalation. Rejects approval with HTTP 400 if
    the case has unaddressed defects and has_operator_override is False.
    """
    init_demo_mailbox_if_needed()
    rec = SESSION_DEMO_MAILBOX.get(case_id)
    alt_id = case_id.replace("email_", "inv_") if case_id.startswith("email_") else case_id.replace("inv_", "email_")
    if not rec:
        rec = SESSION_DEMO_MAILBOX.get(alt_id)

    if not rec:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found in queue")

    action_upper = req.action.strip().upper()

    if action_upper in ("APPROVE", "RELEASE"):
        # Gating invariant: Reject if unaddressed defects and no operator correction
        has_override = bool(rec.get("has_operator_override", False) or rec.get("corrected_fields"))
        has_defects = rec.get("defect_fields", 0) > 0 or rec.get("status") in ("DEFECT", "LOCKED_CRITICAL")
        if has_defects and not has_override:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot approve invoice with unaddressed defects. Flagged defects must be corrected or resolved first.",
            )

        rec["status"] = "VERIFIED"
        rec["decision"] = "approved"
        rec["resolved"] = True
        rec["is_approved"] = True
        rec["risk_score"] = 0
        rec["approved_at"] = datetime.now(timezone.utc).isoformat()
        rec["banner_message"] = "Disbursement authorized by operator. Invoice verified and resolved."

        audit_evt = record_audit_event(
            case_id=case_id,
            action="Payment Approved",
            disposition="VERIFIED",
            risk_score=0,
            operator_id=req.clerk_id,
            details={"manager_id": req.manager_id or "FM-CONTROLLER-MY01", "decision": "approved", "notes": req.reason},
        )

        SESSION_AUDIT_TRAIL.append({
            "id": audit_evt["event_id"],
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            "action": "Payment Approved",
            "badge_color": "emerald",
            "description": f"Disbursement authorized for {case_id}. Parity verified.",
            "justification": req.reason or "Pre-disbursement 3-way reconciliation verified.",
            "operator_id": req.clerk_id,
            "event_hash": audit_evt.get("event_hash"),
            "prior_hash": audit_evt.get("prior_hash"),
        })

        SESSION_DEMO_MAILBOX[case_id] = rec
        SESSION_DEMO_MAILBOX[alt_id] = rec

        return {
            "status": "success",
            "decision": "approved",
            "case_id": case_id,
            "disposition": "VERIFIED",
            "audit_event": audit_evt,
            "record": rec,
        }

    elif action_upper in ("FREEZE", "ESCALATE", "HOLD"):
        rec["status"] = "LOCKED_CRITICAL"
        rec["decision"] = "escalated"
        rec["resolved"] = True
        rec["is_escalated"] = True
        rec["freeze_reason"] = req.reason or "Unauthorized account redirection trap detected."
        rec["banner_message"] = f"Wire frozen and escalated: {rec['freeze_reason']}"

        hold_payload = generate_erp_hold_payload(case_id, float(rec.get("risk_score", 95)) * 100, rec["freeze_reason"])

        audit_evt = record_audit_event(
            case_id=case_id,
            action="Escalated",
            disposition="LOCKED_CRITICAL",
            risk_score=rec["risk_score"],
            operator_id=req.clerk_id,
            details=hold_payload,
        )

        SESSION_AUDIT_TRAIL.append({
            "id": audit_evt["event_id"],
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            "action": "Escalated",
            "badge_color": "rose",
            "description": f"Payment frozen for {case_id}: {rec['freeze_reason']}",
            "justification": req.reason or "Immediate containment lock engaged.",
            "operator_id": req.clerk_id,
            "event_hash": audit_evt.get("event_hash"),
            "prior_hash": audit_evt.get("prior_hash"),
        })

        SESSION_DEMO_MAILBOX[case_id] = rec
        SESSION_DEMO_MAILBOX[alt_id] = rec

        return {
            "status": "success",
            "decision": "escalated",
            "case_id": case_id,
            "disposition": "LOCKED_CRITICAL",
            "erp_hold": hold_payload,
            "audit_event": audit_evt,
            "record": rec,
        }
'''

content = content[:idx1] + new_block + content[idx2_end:]
p.write_text(content, encoding="utf-8")
print("Updated queue.py successfully!")

