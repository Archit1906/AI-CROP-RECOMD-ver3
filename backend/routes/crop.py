from fastapi import APIRouter
from pydantic import BaseModel
import joblib, numpy as np, json, os

router = APIRouter()

BASE    = os.path.dirname(__file__)
model   = joblib.load(os.path.join(BASE, "../models/crop_model.pkl"))
scaler  = joblib.load(os.path.join(BASE, "../models/crop_scaler.pkl"))

# Load class names — use saved file if exists else fallback
CLASS_FILE = os.path.join(BASE, "../models/crop_classes.json")
if os.path.exists(CLASS_FILE):
    with open(CLASS_FILE) as f:
        CLASS_NAMES = json.load(f)
else:
    CLASS_NAMES = [
        "apple","banana","blackgram","chickpea","coconut","coffee",
        "cotton","grapes","jute","kidneybeans","lentil","maize",
        "mango","mothbeans","mungbean","muskmelon","orange","papaya",
        "pigeonpeas","pomegranate","rice","watermelon"
    ]

# Crop info database
CROP_DATA = {
    "rice":        {"emoji":"🌾","profit":"₹28,000/acre","water":"High","season":"Kharif","days":"90-120"},
    "maize":       {"emoji":"🌽","profit":"₹18,000/acre","water":"Medium","season":"Kharif","days":"80-110"},
    "chickpea":    {"emoji":"🫘","profit":"₹22,000/acre","water":"Low","season":"Rabi","days":"90-100"},
    "kidneybeans": {"emoji":"🫘","profit":"₹20,000/acre","water":"Medium","season":"Kharif","days":"90-120"},
    "pigeonpeas":  {"emoji":"🌿","profit":"₹19,000/acre","water":"Low","season":"Kharif","days":"150-180"},
    "mothbeans":   {"emoji":"🌱","profit":"₹15,000/acre","water":"Low","season":"Kharif","days":"75-85"},
    "mungbean":    {"emoji":"🌿","profit":"₹16,000/acre","water":"Low","season":"Kharif","days":"60-75"},
    "blackgram":   {"emoji":"🫘","profit":"₹17,000/acre","water":"Low","season":"Kharif","days":"70-90"},
    "lentil":      {"emoji":"🌾","profit":"₹21,000/acre","water":"Low","season":"Rabi","days":"100-120"},
    "pomegranate": {"emoji":"🍎","profit":"₹80,000/acre","water":"Low","season":"Annual","days":"150-180"},
    "banana":      {"emoji":"🍌","profit":"₹60,000/acre","water":"High","season":"Annual","days":"270-365"},
    "mango":       {"emoji":"🥭","profit":"₹70,000/acre","water":"Medium","season":"Annual","days":"90-120"},
    "grapes":      {"emoji":"🍇","profit":"₹90,000/acre","water":"Medium","season":"Annual","days":"150-180"},
    "watermelon":  {"emoji":"🍉","profit":"₹30,000/acre","water":"Medium","season":"Summer","days":"70-90"},
    "muskmelon":   {"emoji":"🍈","profit":"₹25,000/acre","water":"Medium","season":"Summer","days":"70-90"},
    "apple":       {"emoji":"🍎","profit":"₹1,20,000/acre","water":"Medium","season":"Rabi","days":"150-180"},
    "orange":      {"emoji":"🍊","profit":"₹65,000/acre","water":"Medium","season":"Annual","days":"270-365"},
    "papaya":      {"emoji":"🍈","profit":"₹50,000/acre","water":"High","season":"Annual","days":"240-270"},
    "coconut":     {"emoji":"🥥","profit":"₹40,000/acre","water":"High","season":"Annual","days":"365"},
    "cotton":      {"emoji":"🌿","profit":"₹35,000/acre","water":"Medium","season":"Kharif","days":"150-180"},
    "jute":        {"emoji":"🌿","profit":"₹20,000/acre","water":"High","season":"Kharif","days":"100-120"},
    "coffee":      {"emoji":"☕","profit":"₹75,000/acre","water":"High","season":"Annual","days":"365"},
}

# Climate constraints — crops that CANNOT grow in certain conditions
CLIMATE_CONSTRAINTS = {
    "coffee":      {"min_rainfall":150, "max_ph":6.5, "min_humidity":65},
    "rice":        {"min_rainfall":100, "min_humidity":60},
    "coconut":     {"min_rainfall":120, "min_humidity":65},
    "jute":        {"min_rainfall":150, "min_humidity":70},
    "banana":      {"min_rainfall":100, "min_humidity":60},
    "apple":       {"max_temp":25,      "min_rainfall":100},
    "grapes":      {"max_temp":40,      "min_rainfall":60},
    "watermelon":  {"min_temp":20},
    "muskmelon":   {"min_temp":18},
}

def is_crop_viable(crop_name, data):
    """Check if crop can grow given the conditions"""
    c = CLIMATE_CONSTRAINTS.get(crop_name.lower(), {})
    if "min_rainfall" in c and data.rainfall < c["min_rainfall"]:  return False
    if "min_humidity" in c and data.humidity < c["min_humidity"]:  return False
    if "max_ph"       in c and data.ph       > c["max_ph"]:        return False
    if "min_temp"     in c and data.temperature < c["min_temp"]:   return False
    if "max_temp"     in c and data.temperature > c["max_temp"]:   return False
    return True

class CropInput(BaseModel):
    nitrogen:    float
    phosphorus:  float
    potassium:   float
    temperature: float
    humidity:    float
    ph:          float
    rainfall:    float

@router.post("/predict-crop")
def predict_crop(data: CropInput):
    features = np.array([[
        data.nitrogen, data.phosphorus, data.potassium,
        data.temperature, data.humidity, data.ph, data.rainfall
    ]])
    features_scaled = scaler.transform(features)
    probabilities   = model.predict_proba(features_scaled)[0]
    classes         = model.classes_

    # Get top 10 and filter by climate viability
    top10_indices = np.argsort(probabilities)[::-1][:10]
    top3 = []

    for idx in top10_indices:
        crop_name  = classes[idx] if hasattr(classes[0], 'lower') else CLASS_NAMES[idx]
        confidence = round(float(probabilities[idx]) * 100, 1)

        # Skip climatically impossible crops
        if not is_crop_viable(crop_name, data):
            continue

        # Skip "healthy" prediction if wrong dataset
        if 'healthy' in str(crop_name).lower():
            continue

        info = CROP_DATA.get(crop_name.lower().replace(' ',''), {
            "emoji":"🌱","profit":"N/A","water":"Medium",
            "season":"Kharif","days":"90-120"
        })

        top3.append({
            "crop":       crop_name.capitalize(),
            "emoji":      info["emoji"],
            "confidence": confidence,
            "profit":     info["profit"],
            "water":      info["water"],
            "season":     info["season"],
            "days":       info["days"]
        })

        if len(top3) == 3:
            break

    # Fallback if all filtered
    if not top3:
        # Find best viable crop by brute force
        for idx in top10_indices:
            cn   = classes[idx] if hasattr(classes[0],'lower') else CLASS_NAMES[idx]
            info = CROP_DATA.get(str(cn).lower(), {})
            top3.append({
                "crop":       str(cn).capitalize(),
                "emoji":      info.get("emoji","🌱"),
                "confidence": round(float(probabilities[idx]) * 100, 1),
                "profit":     info.get("profit","N/A"),
                "water":      info.get("water","Medium"),
                "season":     info.get("season","Kharif"),
                "days":       info.get("days","90-120")
            })
            if len(top3) == 3:
                break

    best = top3[0]
    return {
        "recommended_crop": best["crop"],
        "confidence":       f"{best['confidence']}%",
        "top3":             top3,
        "details": {
            "avg_profit": best["profit"],
            "water_req":  best["water"],
            "season":     best["season"],
            "duration":   best["days"]
        }
    }
