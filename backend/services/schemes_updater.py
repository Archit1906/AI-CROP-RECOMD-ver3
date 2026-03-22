import httpx
import asyncio
import json
import os
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Real government API sources
DATA_GOV_KEY = os.getenv("DATA_GOV_API_KEY", "579b464db66ec23bdd000001cdd3946e44ce4afd7a0a4f5e2d22")

# Cache file — saves fetched schemes locally
CACHE_FILE   = "data/schemes_cache.json"
CACHE_EXPIRY = 6  # hours — re-fetch every 6 hours

os.makedirs("data", exist_ok=True)

# ── STATIC BASE SCHEMES ────────────────────────────────────────
# These are always present as fallback with real accurate info
BASE_SCHEMES = [
    {
        "id":          "pm-kisan-2024",
        "name":        "PM-KISAN",
        "icon":        "💰",
        "category":    "income_support",
        "level":       "CENTRAL",
        "tags":        ["DIRECT TRANSFER"],
        "description": "Pradhan Mantri Kisan Samman Nidhi — ₹6,000/year direct income support to all eligible farmer families in 3 installments of ₹2,000 each.",
        "grant":       "₹6,000 Annually (3 installments)",
        "eligibility": "All small and marginal farmer families with cultivable land",
        "requirements":"Aadhaar card, Bank account linked to Aadhaar, Land records (Khasra-Khatauni)",
        "apply_url":   "https://pmkisan.gov.in",
        "deadline":    "2026-12-31",
        "is_new":      False,
        "is_active":   True,
        "color":       "#FF6600",
        "source":      "static",
        "last_updated":"2024-01-01"
    },
    {
        "id":          "pmfby-2024",
        "name":        "Pradhan Mantri Fasal Bima Yojana",
        "icon":        "🛡️",
        "category":    "insurance",
        "level":       "CENTRAL",
        "tags":        ["CROP INSURANCE"],
        "description": "Comprehensive crop insurance covering losses from natural calamities, pests and diseases. Premium as low as 2% for Kharif, 1.5% for Rabi crops.",
        "grant":       "Full crop loss coverage based on assessment",
        "eligibility": "All farmers growing notified crops in notified areas",
        "requirements":"Land records, Bank account, Crop sowing certificate, Aadhaar",
        "apply_url":   "https://pmfby.gov.in",
        "deadline":    "2026-07-31",
        "is_new":      False,
        "is_active":   True,
        "color":       "#00FFFF",
        "source":      "static",
        "last_updated":"2024-01-01"
    },
    {
        "id":          "kcc-2024",
        "name":        "Kisan Credit Card (KCC)",
        "icon":        "💳",
        "category":    "loan",
        "level":       "CENTRAL",
        "tags":        ["CREDIT", "LOW INTEREST"],
        "description": "Short-term credit for agricultural needs at subsidized interest rate of 4% per annum. Covers crop cultivation, post-harvest expenses, and allied activities.",
        "grant":       "Up to ₹3 Lakh at 4% interest per annum",
        "eligibility": "All farmers, sharecroppers, tenant farmers, SHG members",
        "requirements":"Aadhaar, PAN card, Land documents or lease agreement, Passport photo",
        "apply_url":   "https://www.nabard.org/content1.aspx?id=572",
        "deadline":    "2026-12-31",
        "is_new":      False,
        "is_active":   True,
        "color":       "#FFD700",
        "source":      "static",
        "last_updated":"2024-01-01"
    },
    {
        "id":          "pm-kusum-2024",
        "name":        "PM-KUSUM Yojana",
        "icon":        "☀️",
        "category":    "subsidy",
        "level":       "CENTRAL",
        "tags":        ["SOLAR", "SUBSIDY"],
        "description": "Kisan Urja Suraksha evam Utthaan Mahabhiyan — 60% government subsidy on solar pumps for irrigation. Reduces electricity costs and promotes clean energy.",
        "grant":       "60% subsidy on solar pump installation",
        "eligibility": "All farmers with irrigated land holdings",
        "requirements":"Aadhaar, Land records, Electricity connection details, Bank account",
        "apply_url":   "https://pmkusum.mnre.gov.in",
        "deadline":    "2026-09-30",
        "is_new":      True,
        "is_active":   True,
        "color":       "#FFD700",
        "source":      "static",
        "last_updated":"2024-03-01"
    },
    {
        "id":          "soil-health-2024",
        "name":        "Soil Health Card Scheme",
        "icon":        "🧪",
        "category":    "subsidy",
        "level":       "CENTRAL",
        "tags":        ["FREE", "SOIL TESTING"],
        "description": "Free soil health cards providing crop-wise nutrient recommendations. Helps farmers optimize fertilizer use and improve soil fertility.",
        "grant":       "Free soil testing + personalized crop recommendations",
        "eligibility": "All farmers across India",
        "requirements":"Aadhaar card, Land details, Mobile number",
        "apply_url":   "https://soilhealth.dac.gov.in",
        "deadline":    "2026-12-31",
        "is_new":      False,
        "is_active":   True,
        "color":       "#8B5CF6",
        "source":      "static",
        "last_updated":"2024-01-01"
    },
    {
        "id":          "tn-cm-relief-2024",
        "name":        "TN Chief Minister's Farmer Relief",
        "icon":        "🌾",
        "category":    "income_support",
        "level":       "STATE",
        "tags":        ["TAMIL NADU", "DIRECT TRANSFER"],
        "description": "Tamil Nadu government direct income support to registered farmers. Additional support during drought and natural calamity periods.",
        "grant":       "₹2,000 per season direct transfer",
        "eligibility": "Tamil Nadu farmers registered in e-District portal with land records",
        "requirements":"TN ration card, Aadhaar, Patta/land records, Bank account, Farmer ID",
        "apply_url":   "https://www.tn.gov.in/scheme/data_view/8882",
        "deadline":    "2026-06-30",
        "is_new":      True,
        "is_active":   True,
        "color":       "#FF6600",
        "source":      "static",
        "last_updated":"2024-03-01"
    },
    {
        "id":          "enam-2024",
        "name":        "e-NAM Market Platform",
        "icon":        "🏪",
        "category":    "subsidy",
        "level":       "CENTRAL",
        "tags":        ["MARKET", "ONLINE SELLING"],
        "description": "National Agriculture Market — online trading platform connecting farmers directly with buyers across India. Eliminates middlemen and ensures better prices.",
        "grant":       "Free market access, better price discovery",
        "eligibility": "All farmers with produce to sell",
        "requirements":"Aadhaar, Bank account, Mobile number, Produce quality certificate",
        "apply_url":   "https://enam.gov.in/web/",
        "deadline":    "2026-12-31",
        "is_new":      True,
        "is_active":   True,
        "color":       "#00FF41",
        "source":      "static",
        "last_updated":"2024-03-15"
    },
    {
        "id":          "rkvy-2024",
        "name":        "Rashtriya Krishi Vikas Yojana",
        "icon":        "📈",
        "category":    "subsidy",
        "level":       "CENTRAL",
        "tags":        ["INFRASTRUCTURE", "DEVELOPMENT"],
        "description": "Agricultural development scheme for farm mechanization, storage infrastructure, and irrigation. Provides grants for individual farmers and farmer groups.",
        "grant":       "Up to ₹25 Lakh for infrastructure development",
        "eligibility": "Individual farmers, FPOs, cooperatives, and farmer groups",
        "requirements":"Group registration, Detailed project proposal, Land documents, Bank account",
        "apply_url":   "https://rkvy.nic.in",
        "deadline":    "2026-08-31",
        "is_new":      False,
        "is_active":   True,
        "color":       "#FF6600",
        "source":      "static",
        "last_updated":"2024-01-01"
    },
    {
        "id":          "nabard-loan-2024",
        "name":        "NABARD Agricultural Loan",
        "icon":        "🏦",
        "category":    "loan",
        "level":       "CENTRAL",
        "tags":        ["LONG TERM LOAN"],
        "description": "Long-term investment credit for land development, irrigation, farm mechanization, and allied agricultural activities at subsidized rates.",
        "grant":       "Up to ₹10 Lakh at subsidized interest rates",
        "eligibility": "Farmers with clear land ownership documents",
        "requirements":"Aadhaar, Land records, Income certificate, Bank account, Credit history",
        "apply_url":   "https://www.nabard.org",
        "deadline":    "2026-12-31",
        "is_new":      False,
        "is_active":   True,
        "color":       "#3B82F6",
        "source":      "static",
        "last_updated":"2024-01-01"
    },
    {
        "id":          "drought-programme-2024",
        "name":        "Drought Prone Area Programme",
        "icon":        "💧",
        "category":    "drought_relief",
        "level":       "CENTRAL",
        "tags":        ["DROUGHT", "WATER CONSERVATION"],
        "description": "Watershed development and water conservation grants for drought-prone regions. Focuses on soil moisture conservation and groundwater recharge.",
        "grant":       "₹12,000 per hectare for watershed development",
        "eligibility": "Farmers in officially declared drought-prone districts",
        "requirements":"Land records, District drought certification, Bank account, Aadhaar",
        "apply_url":   "https://dolr.gov.in",
        "deadline":    "2026-05-31",
        "is_new":      False,
        "is_active":   True,
        "color":       "#3B82F6",
        "source":      "static",
        "last_updated":"2024-01-01"
    },
    {
        "id":          "agri-infra-2024",
        "name":        "Agriculture Infrastructure Fund",
        "icon":        "🏗️",
        "category":    "loan",
        "level":       "CENTRAL",
        "tags":        ["COLD STORAGE", "INFRASTRUCTURE"],
        "description": "Interest subvention scheme for post-harvest management infrastructure including cold storage, warehouses, and primary processing units.",
        "grant":       "Loans up to ₹2 Crore at 3% interest subvention",
        "eligibility": "Farmers, FPOs, SHGs, Agri-entrepreneurs",
        "requirements":"Detailed business plan, Land documents, Bank account, Project feasibility report",
        "apply_url":   "https://agriinfra.dac.gov.in",
        "deadline":    "2026-10-31",
        "is_new":      False,
        "is_active":   True,
        "color":       "#8B5CF6",
        "source":      "static",
        "last_updated":"2024-01-01"
    },
    {
        "id":          "tn-horticulture-2024",
        "name":        "TN Horticulture Development Scheme",
        "icon":        "🍅",
        "category":    "subsidy",
        "level":       "STATE",
        "tags":        ["TAMIL NADU", "HORTICULTURE"],
        "description": "Tamil Nadu government subsidy for vegetable, fruit, and flower crop cultivation. Covers seeds, planting material, drip irrigation, and packaging.",
        "grant":       "50% subsidy on seeds, inputs, and drip irrigation",
        "eligibility": "Tamil Nadu farmers growing notified horticulture crops",
        "requirements":"TN Farmer ID, Patta/land records, Crop declaration, Bank account",
        "apply_url":   "https://www.tn.gov.in/dept_horticulture",
        "deadline":    "2026-06-30",
        "is_new":      True,
        "is_active":   True,
        "color":       "#00FF41",
        "source":      "static",
        "last_updated":"2024-03-01"
    },
    {
        "id":          "organic-farming-2024",
        "name":        "Paramparagat Krishi Vikas Yojana",
        "icon":        "🌿",
        "category":    "subsidy",
        "level":       "CENTRAL",
        "tags":        ["ORGANIC", "CERTIFICATION"],
        "description": "Promotes organic farming through cluster approach. Provides certification support, training, and ₹50,000 per hectare financial assistance.",
        "grant":       "₹50,000 per hectare over 3 years",
        "eligibility": "Farmers willing to adopt organic practices for minimum 3 years",
        "requirements":"Group of 50+ farmers, Aadhaar, Land records, Commitment to organic practices",
        "apply_url":   "https://pgsindia-ncof.gov.in",
        "deadline":    "2026-04-30",
        "is_new":      True,
        "is_active":   True,
        "color":       "#00FF41",
        "source":      "static",
        "last_updated":"2024-03-15"
    },
    {
        "id":          "weather-insurance-2024",
        "name":        "Weather Based Crop Insurance",
        "icon":        "🌧️",
        "category":    "insurance",
        "level":       "CENTRAL",
        "tags":        ["WEATHER", "INSURANCE"],
        "description": "Insurance based on weather parameters (temperature, rainfall, humidity) rather than crop yield. Faster claim settlement using automatic weather stations.",
        "grant":       "Compensation based on weather deviation from normal",
        "eligibility": "Farmers in notified areas with loanee and non-loanee farmers",
        "requirements":"Crop loan account or voluntary enrollment, Land records, Aadhaar",
        "apply_url":   "https://pmfby.gov.in",
        "deadline":    "2026-07-31",
        "is_new":      False,
        "is_active":   True,
        "color":       "#00FFFF",
        "source":      "static",
        "last_updated":"2024-01-01"
    },
    {
        "id":          "micro-irrigation-2024",
        "name":        "Per Drop More Crop (PDMC)",
        "icon":        "💦",
        "category":    "subsidy",
        "level":       "CENTRAL",
        "tags":        ["DRIP IRRIGATION", "WATER SAVING"],
        "description": "Subsidy for micro-irrigation systems including drip and sprinkler irrigation. Promotes water use efficiency and reduces irrigation costs by 40-50%.",
        "grant":       "55% subsidy for small farmers, 45% for others",
        "eligibility": "All farmers with water source and suitable land",
        "requirements":"Land records, Water source proof, Bank account, Aadhaar, Soil report",
        "apply_url":   "https://pmksy.gov.in",
        "deadline":    "2026-11-30",
        "is_new":      False,
        "is_active":   True,
        "color":       "#3B82F6",
        "source":      "static",
        "last_updated":"2024-01-01"
    },
]

async def fetch_live_schemes():
    """
    Attempt to fetch live schemes from Data.gov.in
    Returns live data if available, otherwise returns None
    """
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            # Fetch agricultural schemes from Data.gov.in
            res = await client.get(
                "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070",
                params={
                    "api-key": DATA_GOV_KEY,
                    "format":  "json",
                    "limit":   50,
                    "filters[sector]": "Agriculture"
                }
            )
            if res.status_code == 200:
                data = res.json()
                return data.get("records", [])
    except Exception as e:
        logger.warning(f"Could not fetch live schemes: {e}")
    return None

def load_cache():
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE) as f:
                cache = json.load(f)
            # Check if cache is still fresh
            cached_time = datetime.fromisoformat(cache.get("timestamp", "2000-01-01"))
            if datetime.now() - cached_time < timedelta(hours=CACHE_EXPIRY):
                return cache.get("schemes", [])
    except:
        pass
    return None

def save_cache(schemes):
    try:
        with open(CACHE_FILE, "w") as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "schemes":   schemes
            }, f, indent=2)
    except Exception as e:
        logger.warning(f"Could not save cache: {e}")

def mark_expired_schemes(schemes):
    """Auto-mark schemes as expired based on deadline"""
    today = datetime.now().date()
    for scheme in schemes:
        try:
            deadline = datetime.strptime(scheme["deadline"], "%Y-%m-%d").date()
            scheme["is_expired"] = deadline < today
            scheme["days_left"]  = (deadline - today).days
        except:
            scheme["is_expired"] = False
            scheme["days_left"]  = 999
    return schemes

def sort_schemes(schemes):
    """Sort: active first, then by deadline urgency"""
    def sort_key(s):
        expired  = s.get("is_expired", False)
        days     = s.get("days_left", 999)
        is_new   = s.get("is_new", False)
        return (int(expired), not is_new, days)
    return sorted(schemes, key=sort_key)

async def get_schemes():
    """Main function — returns fresh schemes with expiry status"""
    # Try cache first
    cached = load_cache()
    if cached:
        return sort_schemes(mark_expired_schemes(cached))

    # Try live API
    live = await fetch_live_schemes()

    # Use base schemes (always reliable)
    schemes = BASE_SCHEMES.copy()

    # Merge live schemes if available
    if live:
        existing_names = {s["name"].lower() for s in schemes}
        for record in live:
            name = record.get("scheme_name", record.get("name", ""))
            if name and name.lower() not in existing_names:
                schemes.append({
                    "id":          f"live-{len(schemes)}",
                    "name":        name[:50],
                    "icon":        "🏛️",
                    "category":    "income_support",
                    "level":       "CENTRAL",
                    "tags":        ["LIVE DATA"],
                    "description": record.get("description", "Government scheme for farmers")[:200],
                    "grant":       record.get("benefit", "See official website"),
                    "eligibility": record.get("eligibility", "Check official website"),
                    "requirements":"Visit official website for details",
                    "apply_url":   record.get("url", "https://india.gov.in"),
                    "deadline":    "2026-12-31",
                    "is_new":      True,
                    "is_active":   True,
                    "color":       "#00FF41",
                    "source":      "live_api",
                    "last_updated": datetime.now().strftime("%Y-%m-%d")
                })

    save_cache(schemes)
    return sort_schemes(mark_expired_schemes(schemes))
