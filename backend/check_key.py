import os
import urllib.request
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("OPENWEATHER_API_KEY", "")

try:
    url = f"https://api.openweathermap.org/data/2.5/weather?q=Chennai&appid={API_KEY}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        print("Success:", response.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTP ERROR {e.code}:")
    print(e.read().decode())
except Exception as e:
    print("Error:", e)
