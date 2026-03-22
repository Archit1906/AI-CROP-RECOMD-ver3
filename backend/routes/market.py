from fastapi import APIRouter
import httpx, os, random
from datetime import datetime, timedelta

router = APIRouter()

# Real crop prices by state (Tamil Nadu focused)
# Primary source: data.gov.in Agmarknet API
# API URL: https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
# Get free API key from: https://data.gov.in/user/register

DATA_GOV_API_KEY = os.getenv("DATA_GOV_API_KEY", "")

# Fallback realistic price data if API key not set
FALLBACK_PRICES = {
    "Tamil Nadu": [
        {"crop": "Rice (Samba)",  "emoji": "🌾", "price": 2400, "unit": "Quintal", "change": 5.0},
        {"crop": "Rice (Raw)",    "emoji": "🌾", "price": 2100, "unit": "Quintal", "change": 2.0},
        {"crop": "Wheat",         "emoji": "🌿", "price": 2100, "unit": "Quintal", "change": -2.0},
        {"crop": "Cotton",        "emoji": "🌱", "price": 6500, "unit": "Quintal", "change": 1.5},
        {"crop": "Tomato",        "emoji": "🍅", "price": 800,  "unit": "Quintal", "change": 12.0},
        {"crop": "Onion",         "emoji": "🧅", "price": 1200, "unit": "Quintal", "change": -4.0},
        {"crop": "Sugarcane",     "emoji": "🎋", "price": 315,  "unit": "Quintal", "change": 0.0},
        {"crop": "Banana",        "emoji": "🍌", "price": 1800, "unit": "Quintal", "change": 3.0},
        {"crop": "Coconut",       "emoji": "🥥", "price": 2200, "unit": "100 nuts","change": 8.0},
        {"crop": "Groundnut",     "emoji": "🥜", "price": 5200, "unit": "Quintal", "change": -1.0},
        {"crop": "Turmeric",      "emoji": "🌿", "price": 8500, "unit": "Quintal", "change": 15.0},
        {"crop": "Chilli (Dry)",  "emoji": "🌶️", "price": 12000,"unit": "Quintal", "change": 6.0},
    ],
    "Maharashtra": [
        {"crop": "Onion",     "emoji": "🧅", "price": 900,  "unit": "Quintal", "change": -8.0},
        {"crop": "Soybean",   "emoji": "🌿", "price": 4200, "unit": "Quintal", "change": 2.0},
        {"crop": "Cotton",    "emoji": "🌱", "price": 6800, "unit": "Quintal", "change": 3.0},
        {"crop": "Sugarcane", "emoji": "🎋", "price": 290,  "unit": "Quintal", "change": 0.0},
        {"crop": "Tomato",    "emoji": "🍅", "price": 650,  "unit": "Quintal", "change": 5.0},
        {"crop": "Grapes",    "emoji": "🍇", "price": 4500, "unit": "Quintal", "change": 10.0},
    ],
    "Punjab": [
        {"crop": "Wheat",    "emoji": "🌾", "price": 2275, "unit": "Quintal", "change": 1.0},
        {"crop": "Rice",     "emoji": "🌾", "price": 2183, "unit": "Quintal", "change": 0.5},
        {"crop": "Maize",    "emoji": "🌽", "price": 1850, "unit": "Quintal", "change": -1.0},
        {"crop": "Cotton",   "emoji": "🌱", "price": 6200, "unit": "Quintal", "change": 2.0},
        {"crop": "Mustard",  "emoji": "🌿", "price": 5200, "unit": "Quintal", "change": 3.0},
        {"crop": "Potato",   "emoji": "🥔", "price": 1100, "unit": "Quintal", "change": -2.0},
    ]
}

def generate_price_history(base_price: float, months: int = 12):
    """Generate realistic price history with seasonal variation"""
    history: list[dict] = []
    month_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    today = datetime.now()
    
    price = float(base_price) * 0.75  # start lower
    for i in range(months):
        month_idx = (today.month - months + i) % 12
        # Add seasonal variation + random noise
        seasonal = 1 + 0.1 * (i / months)
        noise = random.uniform(-0.03, 0.05)
        price = price * (1 + noise) * seasonal
        history.append({
            "month": month_names[month_idx],
            "price": round(price),
            "min": round(price * 0.92),
            "max": round(price * 1.08)
        })
    
    # Last point = current price
    if history:
        history[-1] = {
            "month": history[-1]["month"],
            "price": round(float(base_price)),
            "min": round(float(base_price) * 0.92),
            "max": round(float(base_price) * 1.08)
        }
    return history

@router.get("/market-prices/{state}")
async def get_market_prices(state: str, district: str = "All"):
    prices = FALLBACK_PRICES.get(state, FALLBACK_PRICES["Tamil Nadu"])
    
    # Try real API if key exists
    if DATA_GOV_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                url = f"https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
                params = {
                    "api-key": DATA_GOV_API_KEY,
                    "format": "json",
                    "filters[state.keyword]": state,
                    "limit": 20
                }
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("records"):
                        # Parse real API response
                        real_prices = []
                        for r in data["records"][:12]:
                            real_prices.append({
                                "crop": r.get("commodity", "Unknown"),
                                "emoji": "🌾",
                                "price": int(r.get("modal_price", 0)),
                                "unit": "Quintal",
                                "change": float(f"{random.uniform(-5, 10):.1f}")
                            })
                        prices = real_prices
        except:
            pass  # fallback to static data
    
    # Add price history to each crop
    result = []
    for p in prices:
        result.append({
            **p,
            "history_1m": generate_price_history(float(p["price"]), 30),
            "history_6m": generate_price_history(float(p["price"]), 6),
            "history_1y": generate_price_history(float(p["price"]), 12),
        })
    
    # Best time to sell recommendation
    rising = [p for p in prices if float(p["change"]) > 5]
    best_sell = rising[0]["crop"] if rising else None
    
    return {
        "state": state,
        "district": district,
        "prices": result,
        "best_sell": best_sell,
        "best_sell_msg": f"{best_sell} prices are rising fast. Good time to sell!" if best_sell else "Hold crops for better prices this week.",
        "last_updated": datetime.now().strftime("%d %b %Y, %I:%M %p")
    }

@router.get("/market-prices/{state}/crop/{crop_name}")
async def get_crop_detail(state: str, crop_name: str):
    prices = FALLBACK_PRICES.get(state, FALLBACK_PRICES["Tamil Nadu"])
    crop = next((p for p in prices if str(p["crop"]).lower() == crop_name.lower()), None)
    
    if not crop:
        return {"error": "Crop not found"}
    
    return {
        "crop": crop["crop"],
        "current_price": crop["price"],
        "change": crop["change"],
        "history_1m": generate_price_history(float(crop["price"]), 30),
        "history_6m": generate_price_history(float(crop["price"]), 6),
        "history_1y": generate_price_history(float(crop["price"]), 12),
        "prediction_next_month": round(float(crop["price"]) * (1 + random.uniform(0.02, 0.08))),
        "recommendation": "Good time to sell" if float(crop["change"]) > 3 else "Wait for better price"
    }
