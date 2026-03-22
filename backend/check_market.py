import urllib.request

try:
    req = urllib.request.Request("http://localhost:8000/api/market-prices/Tamil%20Nadu")
    with urllib.request.urlopen(req) as response:
        print("Success:", response.status)
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTP ERROR {e.code}:")
    print(e.read().decode())
except Exception as e:
    print("Error:", e)
