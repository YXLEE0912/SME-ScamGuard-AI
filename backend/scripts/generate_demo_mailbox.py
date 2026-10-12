#!/usr/bin/env python3
"""
Generate backend/data/demo_mailbox.json with exactly 50 realistic operational
Malaysian AP invoices grounded on the 40-vendor Master Procurement Ledger.
- 35 Legitimate invoices across 16 active vendors
- 15 Malicious / adversarial attack vectors
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = DATA_DIR / "demo_mailbox.json"

def create_demo_dataset():
    records = []
    
    # -------------------------------------------------------------------------
    # 1. Recurring Multi-Invoice Suppliers (16 Invoices)
    # -------------------------------------------------------------------------
    # Mega Logistics (4 haulage)
    mega_invoices = [
        ("inv_001", "8812", "18,500.00", "2026-10-07 09:15"),
        ("inv_002", "8820", "22,400.00", "2026-10-07 09:45"),
        ("inv_003", "8835", "16,800.00", "2026-10-07 10:20"),
        ("inv_004", "8849", "24,000.00", "2026-10-07 11:05"),
    ]
    for r_id, num, amt, dt in mega_invoices:
        records.append({
            "id": r_id,
            "subject": f"Invoice #ML-2026-{num} - Container Haulage (Port Klang to Shah Alam)",
            "sender_name": "Mega Logistics Billing",
            "sender_email": "billing@megalogistics.com.my",
            "category": "Logistics",
            "status": "VERIFIED",
            "risk_score": 0,
            "received_date": dt,
            "files": [f"invoice_ML2026_{num}.pdf", "email_thread.eml"],
            "comparison": {
                "vendor_name": {"truth": "Mega Logistics Sdn Bhd", "draft": "Mega Logistics Sdn Bhd", "status": "match", "score": 100},
                "bank_name": {"truth": "Maybank", "draft": "Maybank", "status": "match", "score": 100},
                "account_no": {"truth": "514012345678", "draft": "514012345678", "status": "match", "score": 100},
                "landline": {"truth": "+60 3-7722 8888", "draft": "+60 3-7722 8888", "status": "match", "score": 100},
                "amount": {"truth": "≤ RM 25,000.00", "draft": f"RM {amt}", "status": "match", "score": 100},
                "po_number": {"truth": "PO-ML-", "draft": f"PO-ML-{num}", "status": "match", "score": 100}
            },
            "banner_message": "All verified fields match the Master Procurement Ledger.",
            "defect_fields": 0,
            "can_extract_live": True
        })

    # Southern Steel Supplies (3 shipment tranches)
    ss_invoices = [
        ("inv_005", "9940", "38,200.00", "2026-10-07 08:30"),
        ("inv_006", "9952", "41,500.00", "2026-10-07 09:50"),
        ("inv_007", "9968", "34,800.00", "2026-10-07 10:40"),
    ]
    for r_id, num, amt, dt in ss_invoices:
        records.append({
            "id": r_id,
            "subject": f"Shipment Tranche Invoice #SS-{num} - Rebar & Structural Steel",
            "sender_name": "Southern Steel Sales",
            "sender_email": "sales@southernsteel.com.my",
            "category": "Raw Materials",
            "status": "VERIFIED",
            "risk_score": 0,
            "received_date": dt,
            "files": [f"invoice_SS_{num}.pdf", "delivery_order.pdf"],
            "comparison": {
                "vendor_name": {"truth": "Southern Steel Supplies Sdn Bhd", "draft": "Southern Steel Supplies Sdn Bhd", "status": "match", "score": 100},
                "bank_name": {"truth": "CIMB Bank", "draft": "CIMB Bank", "status": "match", "score": 100},
                "account_no": {"truth": "8001234567", "draft": "8001234567", "status": "match", "score": 100},
                "landline": {"truth": "+60 3-3344 5566", "draft": "+60 3-3344 5566", "status": "match", "score": 100},
                "amount": {"truth": "≤ RM 45,000.00", "draft": f"RM {amt}", "status": "match", "score": 100},
                "po_number": {"truth": "PO-SS-", "draft": f"PO-SS-{num}", "status": "match", "score": 100}
            },
            "banner_message": "All verified fields match the Master Procurement Ledger.",
            "defect_fields": 0,
            "can_extract_live": True
        })

    # Apex Packaging Industries (3 delivery batches)
    apex_invoices = [
        ("inv_008", "3108", "12,200.00", "2026-10-07 08:45"),
        ("inv_009", "3120", "14,600.00", "2026-10-07 10:15"),
        ("inv_010", "3135", "9,800.00", "2026-10-07 11:25"),
    ]
    for r_id, num, amt, dt in apex_invoices:
        records.append({
            "id": r_id,
            "subject": f"Batch Delivery Tax Invoice #AP-{num} - Corrugated Cartons",
            "sender_name": "Apex Packaging Billing",
            "sender_email": "accounts@apexpack.com.my",
            "category": "Packaging",
            "status": "VERIFIED",
            "risk_score": 0,
            "received_date": dt,
            "files": [f"invoice_AP_{num}.pdf"],
            "comparison": {
                "vendor_name": {"truth": "Apex Packaging Industries", "draft": "Apex Packaging Industries", "status": "match", "score": 100},
                "bank_name": {"truth": "Public Bank", "draft": "Public Bank", "status": "match", "score": 100},
                "account_no": {"truth": "3123456789", "draft": "3123456789", "status": "match", "score": 100},
                "landline": {"truth": "+60 3-8921 7788", "draft": "+60 3-8921 7788", "status": "match", "score": 100},
                "amount": {"truth": "≤ RM 15,000.00", "draft": f"RM {amt}", "status": "match", "score": 100},
                "po_number": {"truth": "PO-AP-", "draft": f"PO-AP-{num}", "status": "match", "score": 100}
            },
            "banner_message": "All verified fields match the Master Procurement Ledger.",
            "defect_fields": 0,
            "can_extract_live": True
        })

    # Rawang Cement Industries (3 delivery runs)
    rc_invoices = [
        ("inv_011", "5510", "36,000.00", "2026-10-07 07:40"),
        ("inv_012", "5524", "42,000.00", "2026-10-07 09:10"),
        ("inv_013", "5539", "39,500.00", "2026-10-07 10:55"),
    ]
    for r_id, num, amt, dt in rc_invoices:
        records.append({
            "id": r_id,
            "subject": f"Bulk Cement Delivery Run #RC-{num} (Klang Valley Batching)",
            "sender_name": "Rawang Cement Dispatch",
            "sender_email": "dispatch@rawangcement.com.my",
            "category": "Raw Materials",
            "status": "VERIFIED",
            "risk_score": 0,
            "received_date": dt,
            "files": [f"invoice_RC_{num}.pdf"],
            "comparison": {
                "vendor_name": {"truth": "Rawang Cement Industries", "draft": "Rawang Cement Industries", "status": "match", "score": 100},
                "bank_name": {"truth": "AmBank", "draft": "AmBank", "status": "match", "score": 100},
                "account_no": {"truth": "888102345678", "draft": "888102345678", "status": "match", "score": 100},
                "landline": {"truth": "+60 3-6091 6677", "draft": "+60 3-6091 6677", "status": "match", "score": 100},
                "amount": {"truth": "≤ RM 48,000.00", "draft": f"RM {amt}", "status": "match", "score": 100},
                "po_number": {"truth": "PO-RC-", "draft": f"PO-RC-{num}", "status": "match", "score": 100}
            },
            "banner_message": "All verified fields match the Master Procurement Ledger.",
            "defect_fields": 0,
            "can_extract_live": True
        })

    # Shah Alam Industrial Gases (3 job releases)
    si_invoices = [
        ("inv_014", "1044", "11,200.00", "2026-10-07 08:15"),
        ("inv_015", "1055", "13,400.00", "2026-10-07 10:05"),
        ("inv_016", "1067", "12,900.00", "2026-10-07 11:40"),
    ]
    for r_id, num, amt, dt in si_invoices:
        records.append({
            "id": r_id,
            "subject": f"Industrial Gas Cylinder Refill Invoice #SI-{num}",
            "sender_name": "Shah Alam Gas Orders",
            "sender_email": "orders@shahalamgases.com.my",
            "category": "Utilities",
            "status": "VERIFIED",
            "risk_score": 0,
            "received_date": dt,
            "files": [f"invoice_SI_{num}.pdf"],
            "comparison": {
                "vendor_name": {"truth": "Shah Alam Industrial Gases", "draft": "Shah Alam Industrial Gases", "status": "match", "score": 100},
                "bank_name": {"truth": "Public Bank", "draft": "Public Bank", "status": "match", "score": 100},
                "account_no": {"truth": "3812345678", "draft": "3812345678", "status": "match", "score": 100},
                "landline": {"truth": "+60 3-5510 6677", "draft": "+60 3-5510 6677", "status": "match", "score": 100},
                "amount": {"truth": "≤ RM 16,000.00", "draft": f"RM {amt}", "status": "match", "score": 100},
                "po_number": {"truth": "PO-SI-", "draft": f"PO-SI-{num}", "status": "match", "score": 100}
            },
            "banner_message": "All verified fields match the Master Procurement Ledger.",
            "defect_fields": 0,
            "can_extract_live": True
        })

    # -------------------------------------------------------------------------
    # 2. Monthly Utilities & Facilities (4 Invoices)
    # -------------------------------------------------------------------------
    records.append({
        "id": "inv_017",
        "subject": "TM Corporate Unifi Fiber Multi-Site Statement (Sep 2026)",
        "sender_name": "Telekom Malaysia e-Billing",
        "sender_email": "ebill@tm.com.my",
        "category": "Utilities",
        "status": "VERIFIED",
        "risk_score": 0,
        "received_date": "2026-10-05 14:00",
        "files": ["tm_bill_sep2026.pdf"],
        "comparison": {
            "vendor_name": {"truth": "Telekom Malaysia Berhad", "draft": "Telekom Malaysia Berhad", "status": "match", "score": 100},
            "bank_name": {"truth": "Maybank", "draft": "Maybank", "status": "match", "score": 100},
            "account_no": {"truth": "514011223344", "draft": "514011223344", "status": "match", "score": 100},
            "landline": {"truth": "+60 3-2240 1234", "draft": "+60 3-2240 1234", "status": "match", "score": 100},
            "amount": {"truth": "≤ RM 3,000.00", "draft": "RM 2,480.00", "status": "match", "score": 100},
            "po_number": {"truth": "PO-TM-", "draft": "PO-TM-UTIL-2026", "status": "match", "score": 100}
        },
        "banner_message": "All verified fields match the Master Procurement Ledger.",
        "defect_fields": 0,
        "can_extract_live": True
    })

    records.append({
        "id": "inv_018",
        "subject": "TNB Factory High-Tension Electricity Bill - Acc #2201994",
        "sender_name": "Tenaga Nasional Billing",
        "sender_email": "billing@tnb.com.my",
        "category": "Utilities",
        "status": "VERIFIED",
        "risk_score": 0,
        "received_date": "2026-10-04 11:20",
        "files": ["tnb_factory_sep2026.pdf"],
        "comparison": {
            "vendor_name": {"truth": "Tenaga Nasional Berhad", "draft": "Tenaga Nasional Berhad", "status": "match", "score": 100},
            "bank_name": {"truth": "Maybank", "draft": "Maybank", "status": "match", "score": 100},
            "account_no": {"truth": "514011998877", "draft": "514011998877", "status": "match", "score": 100},
            "landline": {"truth": "+60 3-2296 5566", "draft": "+60 3-2296 5566", "status": "match", "score": 100},
            "amount": {"truth": "≤ RM 12,000.00", "draft": "RM 9,845.50", "status": "match", "score": 100},
            "po_number": {"truth": "PO-TN-", "draft": "PO-TN-ELEC-0926", "status": "match", "score": 100}
        },
        "banner_message": "All verified fields match the Master Procurement Ledger.",
        "defect_fields": 0,
        "can_extract_live": True
    })

    records.append({
        "id": "inv_019",
        "subject": "Air Selangor / Syabas Commercial Meter Billing (Meter #B-9921)",
        "sender_name": "Syabas Water Invoicing",
        "sender_email": "invoices@airselangor.com",
        "category": "Utilities",
        "status": "VERIFIED",
        "risk_score": 0,
        "received_date": "2026-10-03 09:10",
        "files": ["syabas_water_sep2026.pdf"],
        "comparison": {
            "vendor_name": {"truth": "Syabas Water Works", "draft": "Syabas Water Works", "status": "match", "score": 100},
            "bank_name": {"truth": "CIMB Bank", "draft": "CIMB Bank", "status": "match", "score": 100},
            "account_no": {"truth": "8009876543", "draft": "8009876543", "status": "match", "score": 100},
            "landline": {"truth": "+60 3-2088 5400", "draft": "+60 3-2088 5400", "status": "match", "score": 100},
            "amount": {"truth": "≤ RM 2,000.00", "draft": "RM 1,210.00", "status": "match", "score": 100},
            "po_number": {"truth": "PO-SY-", "draft": "PO-SY-WATER-26", "status": "match", "score": 100}
        },
        "banner_message": "All verified fields match the Master Procurement Ledger.",
        "defect_fields": 0,
        "can_extract_live": True
    })

    records.append({
        "id": "inv_020",
        "subject": "Cheras Security Systems - Facility Guarding & Alarm Retainer (Oct 2026)",
        "sender_name": "Cheras Security Admin",
        "sender_email": "billing@cherassecurity.com.my",
        "category": "Facilities",
        "status": "VERIFIED",
        "risk_score": 0,
        "received_date": "2026-10-02 16:30",
        "files": ["cheras_guarding_oct2026.pdf"],
        "comparison": {
            "vendor_name": {"truth": "Cheras Security Systems", "draft": "Cheras Security Systems", "status": "match", "score": 100},
            "bank_name": {"truth": "CIMB Bank", "draft": "CIMB Bank", "status": "match", "score": 100},
            "account_no": {"truth": "8004567890", "draft": "8004567890", "status": "match", "score": 100},
            "landline": {"truth": "+60 3-9130 2233", "draft": "+60 3-9130 2233", "status": "match", "score": 100},
            "amount": {"truth": "≤ RM 11,000.00", "draft": "RM 8,500.00", "status": "match", "score": 100},
            "po_number": {"truth": "PO-CS-", "draft": "PO-CS-SEC-1026", "status": "match", "score": 100}
        },
        "banner_message": "All verified fields match the Master Procurement Ledger.",
        "defect_fields": 0,
        "can_extract_live": True
    })

    # -------------------------------------------------------------------------
    # 3. Micro-SME Informal Tooling (10 Invoices - VERIFIED, 0 Risk, CONSUMER_PDF_TOOL_BENIGN)
    # -------------------------------------------------------------------------
    # 4 Canva
    canva_cases = [
        ("inv_021", "PrintMaster Solutions", "Marketing Collateral & Brochures #PM-4401", "sales@printmaster.com.my", "RHB Bank", "21401234567890", "+60 3-7981 3344", "RM 3,200.00", "PO-PM-4401", "Printing"),
        ("inv_022", "PrintMaster Solutions", "Corporate Banners & Expo Signage #PM-4409", "sales@printmaster.com.my", "RHB Bank", "21401234567890", "+60 3-7981 3344", "RM 4,100.00", "PO-PM-4409", "Printing"),
        ("inv_023", "Sunway Office Solutions", "Monthly Pantry & Stationery Supply #SO-1120", "orders@sunwayoffice.com.my", "AmBank", "888101234567", "+60 3-5639 2200", "RM 2,850.00", "PO-SO-1120", "Office Supplies"),
        ("inv_024", "Sunway Office Solutions", "Ergonomic Chairs & Desk Organizers #SO-1135", "orders@sunwayoffice.com.my", "AmBank", "888101234567", "+60 3-5639 2200", "RM 4,400.00", "PO-SO-1135", "Office Supplies"),
    ]
    for r_id, v_name, subj, email, bnk, acc, tel, amt, po, cat in canva_cases:
        records.append({
            "id": r_id,
            "subject": subj,
            "sender_name": f"{v_name} Accounts",
            "sender_email": email,
            "category": cat,
            "status": "VERIFIED",
            "risk_score": 0,
            "received_date": "2026-10-06 14:15",
            "files": ["invoice_canva_export.pdf"],
            "comparison": {
                "vendor_name": {"truth": v_name, "draft": v_name, "status": "match", "score": 100},
                "bank_name": {"truth": bnk, "draft": bnk, "status": "match", "score": 100},
                "account_no": {"truth": acc, "draft": acc, "status": "match", "score": 100},
                "landline": {"truth": tel, "draft": tel, "status": "match", "score": 100},
                "amount": {"truth": "Baseline Verified", "draft": amt, "status": "match", "score": 100},
                "po_number": {"truth": po[:5], "draft": po, "status": "match", "score": 100}
            },
            "banner_message": "All verified fields match the Master Procurement Ledger. (Canva export verified benign against ledger)",
            "defect_fields": 0,
            "can_extract_live": True
        })

    # 3 iLovePDF / Smallpdf
    pdf_cases = [
        ("inv_025", "Bintang Forwarding Agencies", "Customs Clearance & Haulage Claim #BF-7711", "billing@bintangforwarding.com.my", "AmBank", "888100223344", "+60 3-3168 9900", "RM 14,200.00", "PO-BF-7711", "Logistics"),
        ("inv_026", "Selangor Paper Products", "Warehouse Kraft Paper Rolls Delivery #SP-9902", "sales@selangorpaper.com.my", "RHB Bank", "21201299887766", "+60 3-8736 1122", "RM 9,600.00", "PO-SP-9902", "Manufacturing"),
        ("inv_027", "Selangor Paper Products", "Pallet Wrapping & Film Cartons #SP-9915", "sales@selangorpaper.com.my", "RHB Bank", "21201299887766", "+60 3-8736 1122", "RM 8,400.00", "PO-SP-9915", "Manufacturing"),
    ]
    for r_id, v_name, subj, email, bnk, acc, tel, amt, po, cat in pdf_cases:
        records.append({
            "id": r_id,
            "subject": subj,
            "sender_name": f"{v_name} AP",
            "sender_email": email,
            "category": cat,
            "status": "VERIFIED",
            "risk_score": 0,
            "received_date": "2026-10-06 11:30",
            "files": ["invoice_compressed_ilovepdf.pdf"],
            "comparison": {
                "vendor_name": {"truth": v_name, "draft": v_name, "status": "match", "score": 100},
                "bank_name": {"truth": bnk, "draft": bnk, "status": "match", "score": 100},
                "account_no": {"truth": acc, "draft": acc, "status": "match", "score": 100},
                "landline": {"truth": tel, "draft": tel, "status": "match", "score": 100},
                "amount": {"truth": "Baseline Verified", "draft": amt, "status": "match", "score": 100},
                "po_number": {"truth": po[:5], "draft": po, "status": "match", "score": 100}
            },
            "banner_message": "All verified fields match the Master Procurement Ledger. (iLovePDF compressed doc verified benign)",
            "defect_fields": 0,
            "can_extract_live": True
        })

    # 3 Scanned receipts / mobile camera
    scan_cases = [
        ("inv_028", "Petaling Electrical Works", "Emergency Circuit Breaker Replacement #PE-109", "service@petalingelectrical.com.my", "Maybank", "514013456789", "+60 3-7781 4455", "RM 4,800.00", "PO-PE-109", "Maintenance"),
        ("inv_029", "Petaling Electrical Works", "Distribution Board Wiring Inspection #PE-115", "service@petalingelectrical.com.my", "Maybank", "514013456789", "+60 3-7781 4455", "RM 3,600.00", "PO-PE-115", "Maintenance"),
        ("inv_030", "Subang Air Conditioning Services", "Chiller Compressor Chemical Servicing #SA-802", "ops@subangaircond.com.my", "Public Bank", "3145678901", "+60 3-5634 7788", "RM 5,500.00", "PO-SA-802", "Maintenance"),
    ]
    for r_id, v_name, subj, email, bnk, acc, tel, amt, po, cat in scan_cases:
        records.append({
            "id": r_id,
            "subject": subj,
            "sender_name": f"{v_name} Field Office",
            "sender_email": email,
            "category": cat,
            "status": "VERIFIED",
            "risk_score": 0,
            "received_date": "2026-10-05 16:45",
            "files": ["scanned_mobile_invoice.pdf"],
            "comparison": {
                "vendor_name": {"truth": v_name, "draft": v_name, "status": "match", "score": 100},
                "bank_name": {"truth": bnk, "draft": bnk, "status": "match", "score": 100},
                "account_no": {"truth": acc, "draft": acc, "status": "match", "score": 100},
                "landline": {"truth": tel, "draft": tel, "status": "match", "score": 100},
                "amount": {"truth": "Baseline Verified", "draft": amt, "status": "match", "score": 100},
                "po_number": {"truth": po[:5], "draft": po, "status": "match", "score": 100}
            },
            "banner_message": "All verified fields match the Master Procurement Ledger. (Physical camera scan verified)",
            "defect_fields": 0,
            "can_extract_live": True
        })

    # -------------------------------------------------------------------------
    # 4. Legitimate Procurement Anomalies / Review Cases (5 Invoices - NEEDS_REVIEW)
    # -------------------------------------------------------------------------
    # 3 Velocity / Smurfing Burst
    vel_cases = [
        ("inv_031", "PrintMaster Solutions", "Expedited Packaging Label Run #1 (48h Urgent Batch)", "sales@printmaster.com.my", "RHB Bank", "21401234567890", "+60 3-7981 3344", "RM 4,200.00", "PO-PM-901"),
        ("inv_032", "PrintMaster Solutions", "Expedited Packaging Label Run #2 (48h Urgent Batch)", "sales@printmaster.com.my", "RHB Bank", "21401234567890", "+60 3-7981 3344", "RM 4,500.00", "PO-PM-902"),
        ("inv_033", "PrintMaster Solutions", "Expedited Packaging Label Run #3 (Weekly Cap Breach)", "sales@printmaster.com.my", "RHB Bank", "21401234567890", "+60 3-7981 3344", "RM 4,900.00", "PO-PM-903"),
    ]
    for r_id, v_name, subj, email, bnk, acc, tel, amt, po in vel_cases:
        records.append({
            "id": r_id,
            "subject": subj,
            "sender_name": f"{v_name} Billing",
            "sender_email": email,
            "category": "Printing",
            "status": "NEEDS_REVIEW",
            "risk_score": 75,
            "received_date": "2026-10-07 10:50",
            "files": ["invoice_rush_order.pdf"],
            "comparison": {
                "vendor_name": {"truth": v_name, "draft": v_name, "status": "match", "score": 100},
                "bank_name": {"truth": bnk, "draft": bnk, "status": "match", "score": 100},
                "account_no": {"truth": acc, "draft": acc, "status": "match", "score": 100},
                "landline": {"truth": tel, "draft": tel, "status": "match", "score": 100},
                "amount": {"truth": "≤ RM 5,000.00 (Weekly Cap Exceeded)", "draft": amt, "status": "defect", "score": 70},
                "po_number": {"truth": "PO-PM-", "draft": po, "status": "match", "score": 100}
            },
            "banner_message": "⚠️ Procurement velocity threshold breach. Transaction frequency exceeded weekly limit.",
            "defect_fields": 1,
            "can_extract_live": True
        })

    # 2 Missing/Invalid PO on physical goods requiring GRN (Penang Precision Engineering)
    po_cases = [
        ("inv_034", "Penang Precision Engineering", "CNC Milled Aluminium Casings Batch Delivery #PE-8801", "sales@penangprecision.com.my", "Maybank", "507012345678", "+60 4-6441 2233", "RM 28,000.00", None),
        ("inv_035", "Penang Precision Engineering", "Custom Steel Flanges & Fasteners #PE-8809", "sales@penangprecision.com.my", "Maybank", "507012345678", "+60 4-6441 2233", "RM 24,500.00", "INVALID-REF-992"),
    ]
    for r_id, v_name, subj, email, bnk, acc, tel, amt, po in po_cases:
        records.append({
            "id": r_id,
            "subject": subj,
            "sender_name": f"{v_name} Sales",
            "sender_email": email,
            "category": "Engineering",
            "status": "NEEDS_REVIEW",
            "risk_score": 70,
            "received_date": "2026-10-07 11:10",
            "files": ["delivery_without_po.pdf"],
            "comparison": {
                "vendor_name": {"truth": v_name, "draft": v_name, "status": "match", "score": 100},
                "bank_name": {"truth": bnk, "draft": bnk, "status": "match", "score": 100},
                "account_no": {"truth": acc, "draft": acc, "status": "match", "score": 100},
                "landline": {"truth": tel, "draft": tel, "status": "match", "score": 100},
                "amount": {"truth": "≤ RM 35,000.00", "draft": amt, "status": "match", "score": 100},
                "po_number": {"truth": "PO-PP- (Required for GRN)", "draft": po or "MISSING", "status": "defect", "score": 60}
            },
            "banner_message": "⚠️ Physical goods delivery missing Purchase Order matching prefix. Requires GRN.",
            "defect_fields": 1,
            "can_extract_live": True
        })

    # -------------------------------------------------------------------------
    # 5. In-Transit BEC Diversions (6 Invoices - LOCKED_CRITICAL, Risk = 85-92)
    # -------------------------------------------------------------------------
    bec_cases = [
        ("inv_036", "Southern Steel Supplies Sdn Bhd", "URGENT: Temporary Audit Remittance Update - Invoice #SS-9971", "finance@southern-steels.com.my", "CIMB Bank", "8001234567", "999888111222", "Public Bank", "+60 3-3344 5566", "RM 42,000.00", 92),
        ("inv_037", "Mega Logistics Sdn Bhd", "Critical Notice: Routing Payment to Clearing Account #ML-8850", "billing-notice@megalogistics-corp.com", "Maybank", "514012345678", "777666555444", "Hong Leong Bank", "+60 3-7722 8888", "RM 24,800.00", 91),
        ("inv_038", "Johor Chemical Supplies", "Bank Maintenance In Progress: Remit to Secondary Partner Account", "accounts@johorchem-holdings.com", "CIMB Bank", "8002345678", "882299110033", "RHB Bank", "+60 7-2512 8899", "RM 26,500.00", 89),
        ("inv_039", "Southern Steel Supplies Sdn Bhd", "PAYMENT ADVICE OVERRIDE: Statutory Tax Audit Redirection", "cfo@southern-steel-group.com", "CIMB Bank", "8001234567", "554433221100", "AmBank", "+60 3-3344 5566", "RM 44,000.00", 92),
        ("inv_040", "Mega Logistics Sdn Bhd", "Urgent Haulage Clearance - Divert Wire to Expedited Account", "dispatch-billing@megalogistics-online.com", "Maybank", "514012345678", "665544332211", "Alliance Bank", "+60 3-7722 8888", "RM 19,500.00", 88),
        ("inv_041", "Johor Chemical Supplies", "Settlement of Chemical Reagents - Revised Account In Body", "settlements@johorchem.com.my", "CIMB Bank", "8002345678", "990011223344", "Maybank", "+60 7-2512 8899", "RM 27,800.00", 90),
    ]
    for r_id, v_name, subj, email, bnk, true_acc, fraud_acc, fraud_bnk, tel, amt, r_score in bec_cases:
        records.append({
            "id": r_id,
            "subject": subj,
            "sender_name": f"{v_name} Accounts",
            "sender_email": email,
            "category": "Raw Materials" if "Steel" in v_name or "Chem" in v_name else "Logistics",
            "status": "LOCKED_CRITICAL",
            "risk_score": r_score,
            "received_date": "2026-10-07 11:35",
            "files": ["invoice_genuine_pdf.pdf", "email_urgent_tamper.eml"],
            "comparison": {
                "vendor_name": {"truth": v_name, "draft": v_name, "status": "match", "score": 100},
                "bank_name": {"truth": bnk, "draft": f"{bnk} (PDF) vs {fraud_bnk} (Email)", "status": "defect", "score": 70},
                "account_no": {"truth": true_acc, "draft": f"{true_acc} (PDF) vs {fraud_acc} (Email)", "status": "defect", "score": 70},
                "landline": {"truth": tel, "draft": tel, "status": "match", "score": 100},
                "amount": {"truth": "Baseline Verified", "draft": amt, "status": "match", "score": 100},
                "po_number": {"truth": "PO-Valid", "draft": "PO-MATCH", "status": "match", "score": 100}
            },
            "banner_message": "⚠️ Urgent payment redirection detected in email body contradicting attached PDF.",
            "defect_fields": 2,
            "can_extract_live": True
        })

    # -------------------------------------------------------------------------
    # 6. PDF Bank Account Tampering / Splicing (5 Invoices - LOCKED_CRITICAL, Risk = 90-95)
    # -------------------------------------------------------------------------
    pdf_tamper_cases = [
        ("inv_042", "Southern Steel Supplies Sdn Bhd", "Invoice #SS-9988 - Structural Beam Fabrication Tranche", "billing@southernsteel.com.my", "CIMB Bank", "8001234567", "777666555444", "Public Bank", "+60 3-3344 5566", "RM 43,500.00", 94),
        ("inv_043", "Apex Packaging Industries", "Invoice #AP-3190 - Custom Printed Master Cartons", "accounts@apexpack.com.my", "Public Bank", "3123456789", "990011223344", "Maybank", "+60 3-8921 7788", "RM 14,800.00", 92),
        ("inv_044", "Shah Alam Industrial Gases", "Invoice #SI-1090 - Argon & CO2 High Pressure Bulk Tank", "orders@shahalamgases.com.my", "Public Bank", "3812345678", "554433221100", "CIMB Bank", "+60 3-5510 6677", "RM 15,600.00", 91),
        ("inv_045", "Bintang Forwarding Agencies", "Invoice #BF-7799 - Port Klang Demurrage & Container Release", "billing@bintangforwarding.com.my", "AmBank", "888100223344", "882299110033", "Hong Leong Bank", "+60 3-3168 9900", "RM 21,400.00", 93),
        ("inv_046", "Selangor Paper Products", "Invoice #SP-9980 - High Density Fluting Board Consignment", "sales@selangorpaper.com.my", "RHB Bank", "21201299887766", "665544332211", "Public Bank", "+60 3-8736 1122", "RM 13,800.00", 95),
    ]
    for r_id, v_name, subj, email, true_bnk, true_acc, fake_acc, fake_bnk, tel, amt, r_score in pdf_tamper_cases:
        records.append({
            "id": r_id,
            "subject": subj,
            "sender_name": f"{v_name} Billing",
            "sender_email": email,
            "category": "Manufacturing" if "Packaging" in v_name or "Paper" in v_name else "Raw Materials",
            "status": "LOCKED_CRITICAL",
            "risk_score": r_score,
            "received_date": "2026-10-07 11:45",
            "files": ["invoice_spliced_tampered.pdf"],
            "comparison": {
                "vendor_name": {"truth": v_name, "draft": v_name, "status": "match", "score": 100},
                "bank_name": {"truth": true_bnk, "draft": fake_bnk, "status": "defect", "score": 70},
                "account_no": {"truth": true_acc, "draft": fake_acc, "status": "defect", "score": 70},
                "landline": {"truth": tel, "draft": tel, "status": "match", "score": 100},
                "amount": {"truth": "Baseline Verified", "draft": amt, "status": "match", "score": 100},
                "po_number": {"truth": "PO-MATCH", "draft": "PO-MATCH", "status": "match", "score": 100}
            },
            "banner_message": "⚠️ Bank credentials differ from Master Ledger on Account Number. Blocks payment approval.",
            "defect_fields": 2,
            "can_extract_live": True
        })

    # -------------------------------------------------------------------------
    # 7. PDRM CCID SemakMule Blacklist Hits (2 Invoices - LOCKED_CRITICAL, Risk = 99)
    # -------------------------------------------------------------------------
    mule_cases = [
        ("inv_047", "Southern Steel Supplies Sdn Bhd", "Notice of Accelerated Claim Settlement #SS-MULE-1", "accounts@southern-steel-direct.com", "CIMB Bank", "8001234567", "800944112299", "CIMB Bank", "+60 3-3344 5566", "+60 11-2345 6789", "RM 44,500.00"),
        ("inv_048", "Mega Logistics Sdn Bhd", "Urgent Bonded Trucking Disbursal #ML-MULE-2", "billing@mega-logistics-corp.com", "Maybank", "514012345678", "111222333444", "Maybank", "+60 3-7722 8888", "+60 11-8765 4321", "RM 24,900.00"),
    ]
    for r_id, v_name, subj, email, true_bnk, true_acc, mule_acc, mule_bnk, true_tel, burner_tel, amt in mule_cases:
        records.append({
            "id": r_id,
            "subject": subj,
            "sender_name": f"{v_name} Treasury",
            "sender_email": email,
            "category": "Logistics" if "Mega" in v_name else "Raw Materials",
            "status": "LOCKED_CRITICAL",
            "risk_score": 99,
            "received_date": "2026-10-07 11:55",
            "files": ["invoice_mule_account.pdf"],
            "comparison": {
                "vendor_name": {"truth": v_name, "draft": v_name, "status": "match", "score": 100},
                "bank_name": {"truth": true_bnk, "draft": mule_bnk, "status": "defect", "score": 70},
                "account_no": {"truth": true_acc, "draft": mule_acc, "status": "defect", "score": 70},
                "landline": {"truth": true_tel, "draft": burner_tel, "status": "defect", "score": 70},
                "amount": {"truth": "Baseline Verified", "draft": amt, "status": "match", "score": 100},
                "po_number": {"truth": "PO-Valid", "draft": "PO-MULE", "status": "match", "score": 100}
            },
            "banner_message": "🚨 Beneficiary account flagged on PDRM CCID SemakMule fraud blacklist.",
            "defect_fields": 3,
            "can_extract_live": True
        })

    # -------------------------------------------------------------------------
    # 8. Dormant Vendor Resurrections (2 Invoices - NEEDS_REVIEW, Risk = 65)
    # -------------------------------------------------------------------------
    records.append({
        "id": "inv_049",
        "subject": "Hardware Supply Inbound Tax Invoice #KV-8821 (Account Dormant >200 Days)",
        "sender_name": "Klang Valley Hardware Sales",
        "sender_email": "sales@klangvalleyhardware.com.my",
        "category": "Hardware",
        "status": "NEEDS_REVIEW",
        "risk_score": 65,
        "received_date": "2026-10-07 10:00",
        "files": ["invoice_dormant_kv.pdf"],
        "comparison": {
            "vendor_name": {"truth": "Klang Valley Hardware", "draft": "Klang Valley Hardware", "status": "match", "score": 100},
            "bank_name": {"truth": "Hong Leong Bank", "draft": "Hong Leong Bank", "status": "match", "score": 100},
            "account_no": {"truth": "00300123456", "draft": "00300123456", "status": "match", "score": 100},
            "landline": {"truth": "+60 3-5569 1122", "draft": "+60 3-5569 1122", "status": "match", "score": 100},
            "amount": {"truth": "≤ RM 8,000.00", "draft": "RM 6,200.00", "status": "match", "score": 100},
            "po_number": {"truth": "PO-KV-", "draft": "PO-KV-8821", "status": "match", "score": 100}
        },
        "banner_message": "⚠️ Supplier profile has been inactive for >180 days. Requires senior re-authorization.",
        "defect_fields": 1,
        "can_extract_live": True
    })

    records.append({
        "id": "inv_050",
        "subject": "Industrial Coatings & Primer Milestone Billing #MP-4401 (Account Dormant >200 Days)",
        "sender_name": "Malayan Paint Billing",
        "sender_email": "billing@malayanpaint.com.my",
        "category": "Manufacturing",
        "status": "NEEDS_REVIEW",
        "risk_score": 65,
        "received_date": "2026-10-07 10:10",
        "files": ["invoice_dormant_mp.pdf"],
        "comparison": {
            "vendor_name": {"truth": "Malayan Paint & Coatings", "draft": "Malayan Paint & Coatings", "status": "match", "score": 100},
            "bank_name": {"truth": "Public Bank", "draft": "Public Bank", "status": "match", "score": 100},
            "account_no": {"truth": "3987654321", "draft": "3987654321", "status": "match", "score": 100},
            "landline": {"truth": "+60 3-5191 4400", "draft": "+60 3-5191 4400", "status": "match", "score": 100},
            "amount": {"truth": "≤ RM 18,000.00", "draft": "RM 14,500.00", "status": "match", "score": 100},
            "po_number": {"truth": "PO-MP-", "draft": "PO-MP-4401", "status": "match", "score": 100}
        },
        "banner_message": "⚠️ Supplier profile has been inactive for >180 days. Requires senior re-authorization.",
        "defect_fields": 1,
        "can_extract_live": True
    })

    return records


if __name__ == "__main__":
    records = create_demo_dataset()
    assert len(records) == 50, f"Expected 50 records, got {len(records)}"
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)
    print(f"[+] Successfully generated {len(records)} realistic operational Malaysian demo invoices in {OUT_FILE}")
