import urllib.request
import json

url = "http://localhost:8080/api/predict-crop"

tests = [
    {"name": "Rice", "payload": {"nitrogen": 90, "phosphorus": 42, "potassium": 43, "temperature": 21, "humidity": 82, "ph": 6.5, "rainfall": 202}},
    {"name": "Chickpea", "payload": {"nitrogen": 20, "phosphorus": 67, "potassium": 20, "temperature": 25, "humidity": 16, "ph": 7.0, "rainfall": 60}},
    {"name": "Cotton", "payload": {"nitrogen": 8, "phosphorus": 38, "potassium": 38, "temperature": 27, "humidity": 60, "ph": 6.8, "rainfall": 85}},
    {"name": "Coconut", "payload": {"nitrogen": 25, "phosphorus": 60, "potassium": 200, "temperature": 24, "humidity": 92, "ph": 6.0, "rainfall": 150}},
    {"name": "Muskmelon", "payload": {"nitrogen": 0, "phosphorus": 0, "potassium": 0, "temperature": 38, "humidity": 14, "ph": 6.5, "rainfall": 50}}
]

for test in tests:
    try:
        data_json = json.dumps(test["payload"]).encode('utf-8')
        req = urllib.request.Request(url, data=data_json, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                predicted = data.get("recommended_crop", "")
                match = "PASS" if predicted and predicted.lower() == test["name"].lower() else "FAIL"
                print(f"[{match}] Expected: {test['name']} | Got: {predicted} | Confidence: {data.get('confidence')}")
            else:
                print(f"[ERROR] HTTP {response.status}")
    except Exception as e:
        print(f"[ERROR] {e}")
