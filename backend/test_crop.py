import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        # Try weather
        res = await client.get("http://127.0.0.1:8000/api/weather/state/Rajasthan")
        print("Weather response:", res.status_code)
        if res.status_code != 200:
            print(res.text)
            
        weather_data = res.json()
        print("Weather Data:", weather_data)
        
        # Try crop prediction
        req_data = {
            "nitrogen": 60,
            "phosphorus": 30,
            "potassium": 42,
            "temperature": weather_data.get("temperature", 35),
            "humidity": weather_data.get("humidity", 25),
            "ph": 8.0,
            "rainfall": weather_data.get("rainfall", 30)
        }
        print("Predicting with:", req_data)
        res = await client.post("http://127.0.0.1:8000/api/predict-crop", json=req_data)
        print("Crop response:", res.status_code)
        if res.status_code != 200:
            print("ERROR:")
            print(res.text)
        else:
            print(res.json())

if __name__ == "__main__":
    asyncio.run(test())
