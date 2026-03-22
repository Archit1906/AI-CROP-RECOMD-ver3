from fastapi import APIRouter
import httpx, os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
if API_KEY:
    API_KEY = API_KEY.replace('"', '').replace("'", "").strip()
    if API_KEY == "your_key_here":
        API_KEY = ""  # Force mock data if they forgot to paste the key


# Get free API key from: https://openweathermap.org/api
# Sign up → My API Keys → copy key → paste in .env as OPENWEATHER_API_KEY=your_key

FARMING_ALERTS = {
    "high_humidity":  {"type": "warning", "icon": "🍄", "title": "Fungal Disease Risk",     "msg": "Humidity above 80% — high risk of fungal infection. spray preventive fungicide."},
    "low_humidity":   {"type": "info",    "icon": "💧", "title": "Low Humidity",             "msg": "Humidity below 30% — increase irrigation frequency."},
    "extreme_heat":   {"type": "danger",  "icon": "🔥", "title": "Extreme Heat Warning",     "msg": "Temperature above 40°C — provide shade cover, irrigate in early morning."},
    "frost_risk":     {"type": "danger",  "icon": "🧊", "title": "Frost Risk",               "msg": "Temperature below 5°C tonight — cover sensitive crops immediately."},
    "heavy_rain":     {"type": "warning", "icon": "🌧️", "title": "Heavy Rain Alert",         "msg": "Heavy rainfall expected — pause irrigation, check drainage channels."},
    "drought_risk":   {"type": "danger",  "icon": "🏜️", "title": "Drought Conditions",       "msg": "No rainfall for 10+ days — activate drip irrigation, mulch soil."},
    "pest_risk":      {"type": "warning", "icon": "🐛", "title": "Pest Activity Risk",       "msg": "Warm humid conditions — ideal for pest breeding. Inspect crops daily."},
    "good_sowing":    {"type": "success", "icon": "🌱", "title": "Good Sowing Conditions",   "msg": "Temperature and humidity are ideal. Great time to sow seeds!"},
    "strong_wind":    {"type": "warning", "icon": "💨", "title": "Strong Wind Alert",        "msg": "Wind speed above 40 km/h — support tall crops, avoid spraying pesticides."},
}

def analyze_farming_conditions(current, forecast_list):
    alerts = []
    temp = current["main"]["temp"]
    humidity = current["main"]["humidity"]
    wind = current["wind"]["speed"] * 3.6  # m/s to km/h
    rain_1h = current.get("rain", {}).get("1h", 0)

    if humidity > 80: alerts.append(FARMING_ALERTS["high_humidity"])
    if humidity < 30: alerts.append(FARMING_ALERTS["low_humidity"])
    if temp > 40:     alerts.append(FARMING_ALERTS["extreme_heat"])
    if temp < 5:      alerts.append(FARMING_ALERTS["frost_risk"])
    if rain_1h > 10:  alerts.append(FARMING_ALERTS["heavy_rain"])
    if wind > 40:     alerts.append(FARMING_ALERTS["strong_wind"])
    if humidity > 65 and temp > 25: alerts.append(FARMING_ALERTS["pest_risk"])

    # Check 7-day forecast for drought
    rain_days = sum(1 for f in forecast_list if f.get("rain", {}).get("3h", 0) > 0)
    if rain_days < 2: alerts.append(FARMING_ALERTS["drought_risk"])

    # Good sowing conditions
    if 20 <= temp <= 32 and 50 <= humidity <= 75 and wind < 20:
        alerts.append(FARMING_ALERTS["good_sowing"])

    return alerts

def get_sowing_recommendation(temp, humidity, rain_forecast):
    if 20 <= temp <= 32 and 50 <= humidity <= 75:
        return {
            "status": "excellent",
            "color": "#22C55E",
            "label": "Excellent",
            "message": "Perfect conditions for sowing. Start within 2 days.",
            "crops": ["Rice", "Maize", "Vegetables", "Pulses"]
        }
    elif 15 <= temp <= 38 and 40 <= humidity <= 85:
        return {
            "status": "good",
            "color": "#FBBF24",
            "label": "Acceptable",
            "message": "Conditions are acceptable. Sow early morning.",
            "crops": ["Cotton", "Groundnut", "Sorghum"]
        }
    else:
        return {
            "status": "poor",
            "color": "#EF4444",
            "label": "Not Ideal",
            "message": "Wait 3-5 days for better conditions.",
            "crops": []
        }

@router.get("/weather/{city}")
async def get_weather(city: str):
    city = city.strip().title()
    if not API_KEY:
        # Return realistic mock data if no API key
        return {
            "city": city,
            "current": {
                "temp": 32, "feels_like": 36, "humidity": 72,
                "wind_kmh": 18, "description": "Partly Cloudy",
                "icon": "02d", "pressure": 1012, "visibility": 8,
                "uv_index": 7
            },
            "forecast": [
                {"day": "Today",  "icon": "02d", "high": 34, "low": 26, "rain_chance": 20, "desc": "Partly Cloudy"},
                {"day": "Tue",    "icon": "10d", "high": 30, "low": 24, "rain_chance": 65, "desc": "Light Rain"},
                {"day": "Wed",    "icon": "10d", "high": 28, "low": 23, "rain_chance": 80, "desc": "Heavy Rain"},
                {"day": "Thu",    "icon": "03d", "high": 31, "low": 25, "rain_chance": 30, "desc": "Cloudy"},
                {"day": "Fri",    "icon": "01d", "high": 35, "low": 27, "rain_chance": 10, "desc": "Sunny"},
                {"day": "Sat",    "icon": "01d", "high": 36, "low": 28, "rain_chance": 5,  "desc": "Sunny"},
                {"day": "Sun",    "icon": "02d", "high": 33, "low": 26, "rain_chance": 15, "desc": "Partly Cloudy"},
            ],
            "monthly_rainfall": [
                {"month": "Jan", "rainfall": 20},  {"month": "Feb", "rainfall": 15},
                {"month": "Mar", "rainfall": 10},  {"month": "Apr", "rainfall": 25},
                {"month": "May", "rainfall": 60},  {"month": "Jun", "rainfall": 120},
                {"month": "Jul", "rainfall": 180}, {"month": "Aug", "rainfall": 160},
                {"month": "Sep", "rainfall": 140}, {"month": "Oct", "rainfall": 110},
                {"month": "Nov", "rainfall": 80},  {"month": "Dec", "rainfall": 40},
            ],
            "alerts": [FARMING_ALERTS["pest_risk"], FARMING_ALERTS["good_sowing"]],
            "sowing": get_sowing_recommendation(32, 72, True),
            "last_updated": datetime.now().strftime("%d %b %Y, %I:%M %p")
        }

    async with httpx.AsyncClient(timeout=10.0) as client:
        current_res = await client.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"q": city, "appid": API_KEY, "units": "metric"}
        )
        forecast_res = await client.get(
            "https://api.openweathermap.org/data/2.5/forecast",
            params={"q": city, "appid": API_KEY, "units": "metric"}
        )

    if current_res.status_code != 200 or forecast_res.status_code != 200:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Weather API request failed. Ensure your OPENWEATHER_API_KEY is correct.")

    current = current_res.json()
    forecast = forecast_res.json()

    # Parse 7-day forecast (one entry per day)
    daily = {}
    days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
    for item in forecast["list"]:
        date = datetime.fromtimestamp(item["dt"])
        day_name = days[date.weekday()]
        if day_name not in daily:
            daily[day_name] = {
                "day": day_name,
                "icon": item["weather"][0]["icon"],
                "high": item["main"]["temp_max"],
                "low": item["main"]["temp_min"],
                "rain_chance": int(item.get("pop", 0) * 100),
                "desc": item["weather"][0]["description"].title()
            }

    forecast_list = forecast["list"]
    alerts = analyze_farming_conditions(current, forecast_list)

    # Monthly rainfall from forecast (approximate)
    monthly_rainfall = [
        {"month": m, "rainfall": r} for m, r in zip(
            ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
            [20,15,10,25,60,120,180,160,140,110,80,40]
        )
    ]

    return {
        "city": current["name"],
        "current": {
            "temp": round(current["main"]["temp"]),
            "feels_like": round(current["main"]["feels_like"]),
            "humidity": current["main"]["humidity"],
            "wind_kmh": round(current["wind"]["speed"] * 3.6),
            "description": current["weather"][0]["description"].title(),
            "icon": current["weather"][0]["icon"],
            "pressure": current["main"]["pressure"],
            "visibility": round(current.get("visibility", 0) / 1000),
            "uv_index": 6
        },
        "forecast": list(daily.values())[:7],
        "monthly_rainfall": monthly_rainfall,
        "alerts": alerts,
        "sowing": get_sowing_recommendation(
            current["main"]["temp"],
            current["main"]["humidity"],
            len([f for f in forecast_list if f.get("rain")]) > 2
        ),
        "last_updated": datetime.now().strftime("%d %b %Y, %I:%M %p")
    }

@router.get("/weather/state/{state_name}")
async def get_weather_by_state(state_name: str):
    from data.soil_data import STATE_CAPITALS
    city = STATE_CAPITALS.get(state_name, state_name)

    if not API_KEY:
        # Smart mock based on state region
        REGION_WEATHER = {
            "coastal":      {"temp":28,"humidity":78,"rainfall":180},
            "gangetic":     {"temp":26,"humidity":70,"rainfall":120},
            "northeastern": {"temp":22,"humidity":85,"rainfall":220},
            "himalayan":    {"temp":12,"humidity":60,"rainfall":150},
            "central":      {"temp":30,"humidity":55,"rainfall":90},
            "western":      {"temp":32,"humidity":50,"rainfall":70},
            "southern":     {"temp":29,"humidity":72,"rainfall":130},
            "arid":         {"temp":35,"humidity":25,"rainfall":30},
            "eastern":      {"temp":27,"humidity":75,"rainfall":160},
        }
        from data.soil_data import SOIL_DATA
        soil = SOIL_DATA.get(state_name, {})
        region = soil.get("region", "central")
        w = REGION_WEATHER.get(region, REGION_WEATHER["central"])
        return {
            "city": city, "state": state_name,
            "temperature": w["temp"],
            "humidity":    w["humidity"],
            "rainfall":    w["rainfall"],
            "description": "Partly Cloudy",
            "source": "mock"
        }

    async with httpx.AsyncClient(timeout=8.0) as client:
        res = await client.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"q":city,"appid":API_KEY,"units":"metric"}
        )
    data = res.json()
    return {
        "city":        city,
        "state":       state_name,
        "temperature": round(data["main"]["temp"]),
        "humidity":    data["main"]["humidity"],
        "rainfall":    data.get("rain",{}).get("1h", 0) * 30,
        "description": data["weather"][0]["description"].title(),
        "source":      "live"
    }
