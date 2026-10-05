def test_health_check_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["system"] == "SME-ScamGuard-AI"

def test_scan_demo_mode_endpoint(client):
    response = client.post("/api/scan?mode=demo&case_id=QAT-02")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "LOCKED_CRITICAL"
    assert data["risk_score"] >= 80
    assert "reconciliation_matrix" in data
    assert "statutory_artifacts" in data
    assert "VOUCHER-QAT-02" in data["voucher_id"]

def test_scan_json_payload_endpoint(client):
    payload = {
        "case_id": "CUSTOM-TEST-01",
        "vendor_name": "Mega Logistics Sdn Bhd",
        "bank_account": "514012998877",
        "bank_name": "Maybank",
        "amount_myr": 12500.0,
        "subject": "Routine Billing",
        "body": "Standard monthly settlement.",
        "sender": "billing@megalogistics.com.my",
    }
    response = client.post("/api/scan", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SAFE_VERIFIED"
    assert data["risk_score"] == 0

def test_dual_authorization_flow_endpoints(client):
    # 1. Run a scan that generates a locked voucher
    scan_res = client.post("/api/scan?mode=demo&case_id=QAT-03")
    assert scan_res.status_code == 200
    v_id = scan_res.json()["voucher_id"]
    
    # 2. Manager attempts override immediately without clerk callback -> 403 Forbidden
    override_payload = {
        "manager_id": "FIN_MGR_09",
        "corporate_key_token": "CORP_KEY_SECRET_778899",
        "override_reason": "Emergency Board Exemption",
    }
    fail_res = client.post(f"/api/vouchers/{v_id}/override", json=override_payload)
    assert fail_res.status_code == 403
    assert "rejected" in fail_res.json()["detail"].lower()
    
    # 3. AP Clerk performs official switchboard callback
    clerk_payload = {
        "clerk_id": "AP_CLERK_AHMAD",
        "phone_dialed": "+60 3-7722 8888",
        "verification_notes": "Spoke to vendor head of accounts Ms. Tan on switchboard. Verified claim.",
    }
    clerk_res = client.post(f"/api/vouchers/{v_id}/verify-call", json=clerk_payload)
    assert clerk_res.status_code == 200
    assert clerk_res.json()["step_1_completed"] is True
    assert clerk_res.json()["status"] == "CLERK_VERIFIED"
    
    # 4. Now Manager applies cryptographic override -> 200 OK
    success_res = client.post(f"/api/vouchers/{v_id}/override", json=override_payload)
    assert success_res.status_code == 200
    assert success_res.json()["step_2_completed"] is True
    assert success_res.json()["status"] == "OVERRIDDEN_RELEASED"
