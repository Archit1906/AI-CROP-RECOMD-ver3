from fastapi import APIRouter
from pydantic import BaseModel
import joblib, numpy as np, json, os

from services.ecocrop_service import ecocrop_service
router = APIRouter()
BASE   = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE, "../models")

# ── LOAD MODEL ────────────────────────────────────────────────
try:
    model   = joblib.load(os.path.join(MODEL_DIR, "crop_model.pkl"))
    scaler  = joblib.load(os.path.join(MODEL_DIR, "crop_scaler.pkl"))
    le      = joblib.load(os.path.join(MODEL_DIR, "crop_label_encoder.pkl"))
    USE_LE  = True
    print("✅ Crop model loaded with LabelEncoder")
except Exception as e:
    print(f"❌ Model load error: {e}")
    model = scaler = le = None
    USE_LE = False

# Load class names
try:
    with open(os.path.join(MODEL_DIR, "crop_classes.json")) as f:
        CLASS_NAMES = json.load(f)
except:
    CLASS_NAMES = [
        "apple","banana","blackgram","chickpea","coconut","coffee",
        "cotton","grapes","jute","kidneybeans","lentil","maize",
        "mango","mothbeans","mungbean","muskmelon","orange","papaya",
        "pigeonpeas","pomegranate","rice","watermelon"
    ]

# ── CROP INFO DATABASE ────────────────────────────────────────
CROP_INFO = {
    "rice":        {"emoji":"🌾","profit":"₹28,000/acre","water":"High",  "season":"Kharif","days":"90-120"},
    "maize":       {"emoji":"🌽","profit":"₹18,000/acre","water":"Medium","season":"Kharif","days":"80-110"},
    "chickpea":    {"emoji":"🫘","profit":"₹22,000/acre","water":"Low",   "season":"Rabi",  "days":"90-100"},
    "kidneybeans": {"emoji":"🫘","profit":"₹20,000/acre","water":"Medium","season":"Kharif","days":"90-120"},
    "pigeonpeas":  {"emoji":"🌿","profit":"₹19,000/acre","water":"Low",   "season":"Kharif","days":"150-180"},
    "mothbeans":   {"emoji":"🌱","profit":"₹15,000/acre","water":"Low",   "season":"Kharif","days":"75-85"},
    "mungbean":    {"emoji":"🌿","profit":"₹16,000/acre","water":"Low",   "season":"Kharif","days":"60-75"},
    "blackgram":   {"emoji":"🫘","profit":"₹17,000/acre","water":"Low",   "season":"Kharif","days":"70-90"},
    "lentil":      {"emoji":"🌾","profit":"₹21,000/acre","water":"Low",   "season":"Rabi",  "days":"100-120"},
    "pomegranate": {"emoji":"🍎","profit":"₹80,000/acre","water":"Low",   "season":"Annual","days":"150-180"},
    "banana":      {"emoji":"🍌","profit":"₹60,000/acre","water":"High",  "season":"Annual","days":"270-365"},
    "mango":       {"emoji":"🥭","profit":"₹70,000/acre","water":"Medium","season":"Annual","days":"90-120"},
    "grapes":      {"emoji":"🍇","profit":"₹90,000/acre","water":"Medium","season":"Annual","days":"150-180"},
    "watermelon":  {"emoji":"🍉","profit":"₹30,000/acre","water":"Medium","season":"Summer","days":"70-90"},
    "muskmelon":   {"emoji":"🍈","profit":"₹25,000/acre","water":"Medium","season":"Summer","days":"70-90"},
    "apple":       {"emoji":"🍎","profit":"₹1,20,000/acre","water":"Medium","season":"Rabi","days":"150-180"},
    "orange":      {"emoji":"🍊","profit":"₹65,000/acre","water":"Medium","season":"Annual","days":"270-365"},
    "papaya":      {"emoji":"🍈","profit":"₹50,000/acre","water":"High",  "season":"Annual","days":"240-270"},
    "coconut":     {"emoji":"🥥","profit":"₹40,000/acre","water":"High",  "season":"Annual","days":"365"},
    "cotton":      {"emoji":"🌿","profit":"₹35,000/acre","water":"Medium","season":"Kharif","days":"150-180"},
    "jute":        {"emoji":"🌿","profit":"₹20,000/acre","water":"High",  "season":"Kharif","days":"100-120"},
    "coffee":      {"emoji":"☕","profit":"₹75,000/acre","water":"High",  "season":"Annual","days":"365"},
}

# ── CLIMATE VALIDATION ────────────────────────────────────────
# Hard constraints — physically impossible crops get filtered
CLIMATE_RULES = {
    "rice":        {"min_rainfall": 80,  "min_humidity": 55},
    "coconut":     {"min_rainfall": 100, "min_humidity": 60, "min_temp": 22},
    "coffee":      {"min_rainfall": 120, "min_humidity": 60, "max_ph": 6.5},
    "jute":        {"min_rainfall": 120, "min_humidity": 65},
    "apple":       {"max_temp": 24},
    "grapes":      {"min_temp": 15, "max_temp": 40},
    "watermelon":  {"min_temp": 20},
    "muskmelon":   {"min_temp": 18},
    "banana":      {"min_temp": 20, "min_humidity": 55},
    "tea":         {"min_rainfall": 150, "min_humidity": 70},
}

def passes_climate(crop, inp):
    rules = CLIMATE_RULES.get(crop.lower(), {})
    if rules.get("min_rainfall") and inp.rainfall    < rules["min_rainfall"]: return False
    if rules.get("min_humidity") and inp.humidity    < rules["min_humidity"]: return False
    if rules.get("max_ph")       and inp.ph          > rules["max_ph"]:       return False
    if rules.get("min_temp")     and inp.temperature < rules["min_temp"]:     return False
    if rules.get("max_temp")     and inp.temperature > rules["max_temp"]:     return False
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
    if model is None or scaler is None or le is None:
        return {"error": "Model not loaded. Run train_crop.py first."}

    # Scale input
    X = np.array([[
        data.nitrogen, data.phosphorus, data.potassium,
        data.temperature, data.humidity, data.ph, data.rainfall
    ]])
    X_scaled = scaler.transform(X)

    # Get probabilities
    raw_probs = model.predict_proba(X_scaled)[0]
    
    # Scale probabilities using temperature to sharpen the confidence 
    # to a more realistic/intuitive percentage for a 22-class model.
    temperature = 0.1
    shifted_probs = raw_probs - np.max(raw_probs)
    exp_probs = np.exp(shifted_probs / temperature)
    probs = exp_probs / np.sum(exp_probs)
    
    classes = le.classes_ if USE_LE else CLASS_NAMES

    # Build ranked list with climate filter
    ranked = sorted(
        zip(classes, probs),
        key=lambda x: x[1], reverse=True
    )

    ml_top = []
    ml_conf_map = {}
    for crop_name, prob in ranked:
        conf = round(float(prob) * 100, 1)
        ml_conf_map[crop_name.lower()] = conf
        if conf >= 1.0 and passes_climate(crop_name, data):
            ml_top.append(crop_name.lower())
            
    eco_list = ecocrop_service.filter_crops(data.temperature, data.rainfall, data.ph)
    eco_set = set(c.lower() for c in eco_list)
    ml_set = set(ml_top)
    
    all_crops = list(ml_set.union(eco_set))
    scored_crops = []
    
    for c in all_crops:
        score = 0
        if c in ml_set and c in eco_set:
            score = 7
        elif c in ml_set:
            score = 5
        elif c in eco_set:
            score = 3
            
        conf = ml_conf_map.get(c, 0.0)
        
        # Calculate final system confidence based on the rule engine scores
        if score == 7:
            sys_conf = 85.0 + min(14.9, conf * 0.3)
        elif score == 5:
            sys_conf = 60.0 + min(24.9, conf * 0.4)
        elif score == 3:
            sys_conf = 45.0 + min(14.9, conf * 0.2)
        else:
            sys_conf = conf

        info = CROP_INFO.get(c, {
            "emoji":"🌱","profit":"N/A","water":"Medium",
            "season":"Kharif","days":"90-120"
        })
        
        scored_crops.append({
            "crop": c.capitalize(),
            "score": score,
            "confidence": round(sys_conf, 1),
            "raw_conf": conf,
            "emoji": info["emoji"],
            "profit": info["profit"],
            "water": info["water"],
            "season": info["season"],
            "days": info["days"]
        })
        
    # Sort primarily by score (desc), secondarily by raw ML probability (desc)
    scored_crops.sort(key=lambda x: (x["score"], x["raw_conf"]), reverse=True)
    
    # Fallback to pure ML if both sets are empty
    if not scored_crops:
        for crop_name, prob in ranked[:3]:
            conf = round(float(prob) * 100, 1)
            sys_conf = 60.0 + min(24.9, conf * 0.4)
            info = CROP_INFO.get(crop_name.lower(), {"emoji":"🌱","profit":"N/A","water":"Medium","season":"Kharif","days":"90-120"})
            scored_crops.append({
                "crop": crop_name.capitalize(),
                "score": 5, 
                "confidence": round(sys_conf, 1),
                "raw_conf": conf,
                "emoji": info["emoji"],
                "profit": info["profit"],
                "water": info["water"],
                "season": info["season"],
                "days": info["days"]
            })
            
    top3 = scored_crops[:3]
    best = top3[0]
    
    # Generate the strict recommendations format requested
    recommendations_list = [{"crop": x["crop"].lower(), "score": x["score"]} for x in scored_crops]

    return {
        "recommended_crop": best["crop"],
        "confidence":       f"{best['confidence']}%",
        "emoji":            best["emoji"],
        "top3":             top3,
        "recommendations":  recommendations_list,
        "details": {
            "avg_profit": best["profit"],
            "water_req":  best["water"],
            "season":     best["season"],
            "duration":   best["days"]
        },
        "input_received": {
            "N": data.nitrogen, "P": data.phosphorus,
            "K": data.potassium, "temp": data.temperature,
            "humidity": data.humidity, "ph": data.ph,
            "rainfall": data.rainfall
        }
    }

@router.get("/model-info")
def model_info():
    try:
        meta_path = os.path.join(MODEL_DIR, "model_metadata.json")
        if os.path.exists(meta_path):
            with open(meta_path) as f:
                return json.load(f)
        return {"status": "metadata not found"}
    except:
        return {"status": "error"}
