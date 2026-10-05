from backend.app.layers.layer3_knowledge_base import verify_vendor_remittance

def test_ledger_exact_match():
    res = verify_vendor_remittance("Mega Logistics Sdn Bhd", "514012998877", "Maybank")
    assert res["vendor_found"] is True
    assert res["ledger_match"] is True
    assert res["i_ledger"] == 0
    assert res["s_semakmule"] == 0
    assert res["mule_hit"] is False
    assert res["status"] == "VERIFIED_MATCH"
    assert res["verified_phone"] == "+60 3-7722 8888"

def test_ledger_bank_mismatch():
    res = verify_vendor_remittance("Mega Logistics Sdn Bhd", "800944112299", "CIMB Bank")
    assert res["vendor_found"] is True
    assert res["ledger_match"] is False
    assert res["i_ledger"] == 1
    assert res["status"] == "BANK_MISMATCH"

def test_semakmule_mule_account_hit():
    # Known mule 1410029000123456
    res = verify_vendor_remittance("Mega Logistics Sdn Bhd", "1410029000123456", "Public Bank")
    assert res["mule_hit"] is True
    assert res["s_semakmule"] == 99
    assert res["i_ledger"] == 1

def test_out_of_band_phone_shield():
    res = verify_vendor_remittance("Alpha Tech Sdn Bhd", "800122334455")
    assert res["verified_phone"].startswith("+60 3-")
