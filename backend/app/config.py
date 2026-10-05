import os
from typing import Dict, Set

# Suspicious consumer PDF editors commonly used to alter invoice bank accounts
SUSPICIOUS_PRODUCERS = [
    "ilovepdf",
    "canva",
    "sejda",
    "foxit",
    "smallpdf",
    "photoshop",
    "pdfescape",
    "nitro",
]

# PDRM CCID SemakMule known commercial mule accounts (In-memory threat cache)
KNOWN_SEMAKMULE_ACCOUNTS: Set[str] = {
    "1410029000123456",
    "800944112299",
    "214488990011",
    "319900228811",
}

# Master Procurement Ledger (Ground-Truth approved corporate vendors)
APPROVED_VENDOR_LEDGER: Dict[str, dict] = {
    "Mega Logistics Sdn Bhd": {
        "account": "514012998877",
        "bank": "Maybank",
        "phone": "+60 3-7722 8888",
        "ssm": "201801023456 (1284567-T)",
        "address": "Level 18, Menara Mega, Jalan Sultan Ismail, 50250 Kuala Lumpur",
    },
    "Alpha Tech Sdn Bhd": {
        "account": "800122334455",
        "bank": "Maybank",
        "phone": "+60 3-7722 8888",
        "ssm": "201901034567 (1325678-W)",
        "address": "Unit 8-2, Cyber Tower 1, 63000 Cyberjaya, Selangor",
    },
    "City Group Engineering": {
        "account": "512345678901",
        "bank": "Maybank",
        "phone": "+60 3-7722 8888",
        "ssm": "201501045678 (1156789-M)",
        "address": "Wisma City Group, 47301 Petaling Jaya, Selangor",
    },
}

# Reporting Entity default details for statutory regulatory dossiers (NSRC 997 / AMLA 2001)
DEFAULT_REPORTING_ENTITY = {
    "name": "SME Apex Holdings Berhad",
    "ssm": "201001099881 (912345-X)",
    "address": "Suite 22-04, Horizon Commercial Centre, Bangsar South, 59200 Kuala Lumpur",
    "phone": "+60 3-2288 9900",
}

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
APP_ENV = os.getenv("APP_ENV", "production")
