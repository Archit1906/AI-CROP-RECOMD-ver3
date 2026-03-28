import sys
import os
import numpy as np
from PIL import Image
import io

# Modify sys.path so we can import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Create a dummy solid brown image
img = Image.new('RGB', (224, 224), color = (150, 100, 50))
buf = io.BytesIO()
img.save(buf, format='JPEG')
byte_im = buf.getvalue()

print("Testing with brown image...")
response = client.post(
    "/api/detect-disease",
    files={"file": ("brown_leaf.jpg", byte_im, "image/jpeg")}
)

import json

out = {
    "brown_response": response.json()
}

with open("test_results.json", "w", encoding="utf-8") as f:
    json.dump(out, f, indent=4)
