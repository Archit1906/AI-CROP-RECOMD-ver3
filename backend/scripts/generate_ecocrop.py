import json
import os
import random

crops_seed = [
    # Top 22 existing ML models
    "apple","banana","blackgram","chickpea","coconut","coffee",
    "cotton","grapes","jute","kidneybeans","lentil","maize",
    "mango","mothbeans","mungbean","muskmelon","orange","papaya",
    "pigeonpeas","pomegranate","rice","watermelon",
    
    # 80+ additional global crops
    "wheat", "barley", "oats", "sorghum", "millet", "rye", "quinoa", "soybean",
    "peanuts", "sunflower", "safflower", "canola", "mustard", "flax", "sesame",
    "potato", "sweet potato", "cassava", "yam", "taro", "onion", "garlic",
    "carrot", "radish", "turnip", "beetroot", "tomato", "eggplant", "pepper",
    "cucumber", "pumpkin", "zucchini", "squash", "cabbage", "broccoli",
    "cauliflower", "spinach", "lettuce", "kale", "celery", "asparagus",
    "artichoke", "peas", "green beans", "lima beans", "fava beans", "cowpeas",
    "alfalfa", "clover", "timothy", "fescue", "ryegrass", "brome",
    "strawberry", "blueberry", "raspberry", "blackberry", "cranberry",
    "cherry", "plum", "peach", "apricot", "nectarine", "pear", "quince",
    "lemon", "lime", "grapefruit", "tangerine", "mandarin", "citron",
    "fig", "date", "olive", "avocado", "guava", "lychee", "rambutan",
    "durian", "jackfruit", "breadfruit", "passionfruit", "kiwi", "persimmon",
    "pistachio", "almond", "walnut", "pecan", "cashew",
    "macadamia", "hazelnut", "chestnut", "pine nut", "brazil nut",
    "tea", "cocoa", "vanilla", "sugarcane", "sugarbeet", "tobacco",
    "rubber", "hemp", "sisal", "abaca", "kapok"
]
crops_seed = list(set([c.lower().strip() for c in crops_seed]))

# Specific realistic parameters for the top 22 ML crops to match conditions
rules = {
    "rice":        {"temp_min": 20, "temp_max": 35, "rain_min": 1000, "rain_max": 3000, "ph_min": 5.5, "ph_max": 7.0},
    "maize":       {"temp_min": 18, "temp_max": 30, "rain_min": 500,  "rain_max": 1000, "ph_min": 5.8, "ph_max": 7.5},
    "wheat":       {"temp_min": 10, "temp_max": 25, "rain_min": 300,  "rain_max": 900,  "ph_min": 6.0, "ph_max": 7.5},
    "coconut":     {"temp_min": 22, "temp_max": 35, "rain_min": 1000, "rain_max": 3000, "ph_min": 5.0, "ph_max": 8.0},
    "coffee":      {"temp_min": 15, "temp_max": 28, "rain_min": 1200, "rain_max": 2500, "ph_min": 5.0, "ph_max": 6.5},
    "cotton":      {"temp_min": 20, "temp_max": 35, "rain_min": 500,  "rain_max": 1500, "ph_min": 5.8, "ph_max": 8.0},
    "apple":       {"temp_min": -5, "temp_max": 24, "rain_min": 600,  "rain_max": 1400, "ph_min": 5.5, "ph_max": 6.5},
    "jute":        {"temp_min": 24, "temp_max": 38, "rain_min": 1200, "rain_max": 2000, "ph_min": 6.0, "ph_max": 7.5},
    "grapes":      {"temp_min": 15, "temp_max": 40, "rain_min": 400,  "rain_max": 900,  "ph_min": 5.5, "ph_max": 8.5},
    "watermelon":  {"temp_min": 20, "temp_max": 40, "rain_min": 400,  "rain_max": 1000, "ph_min": 5.0, "ph_max": 7.0},
    "banana":      {"temp_min": 20, "temp_max": 35, "rain_min": 1000, "rain_max": 2500, "ph_min": 5.5, "ph_max": 7.5},
    "tea":         {"temp_min": 15, "temp_max": 30, "rain_min": 1500, "rain_max": 3000, "ph_min": 4.5, "ph_max": 5.5},
}

ecocrop_data = []
random.seed(42)  # For reproducibility

for crop in crops_seed:
    if crop in rules:
        ecocrop_data.append({"crop": crop, **rules[crop]})
    else:
        # Generate semi-realistic ranges
        temp_min = random.randint(5, 25)
        temp_max = temp_min + random.randint(10, 20)
        rain_min = random.randint(200, 1000)
        rain_max = rain_min + random.randint(400, 1500)
        ph_min = round(random.uniform(4.5, 6.5), 1)
        ph_max = ph_min + round(random.uniform(1.0, 2.5), 1)
        if ph_max > 8.5: ph_max = 8.5
        
        ecocrop_data.append({
            "crop": crop,
            "temp_min": temp_min,
            "temp_max": temp_max,
            "rain_min": rain_min,
            "rain_max": rain_max,
            "ph_min": ph_min,
            "ph_max": ph_max
        })

ecocrop_data.sort(key=lambda x: x["crop"])

data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(data_dir, exist_ok=True)
out_path = os.path.join(data_dir, "ecocrop.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(ecocrop_data, f, indent=2)

print(f"✅ Generated {len(ecocrop_data)} crops in {out_path}")
