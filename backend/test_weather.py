import urllib.request

try:
    req = urllib.request.Request("http://localhost:8000/api/weather/Chennai")
    with urllib.request.urlopen(req) as response:
        data = response.read()
        with open("weather2.json", "wb") as f:
            f.write(data)
        print("Done")
except Exception as e:
    print("Error:", e)
