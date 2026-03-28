import sys
import os
import numpy as np
from PIL import Image
import io
import json

# Modify sys.path so we can import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Create a dummy image with a black background, a green half, and a brown half
# To simulate a partially healthy and partially diseased leaf.
img_array = np.zeros((224, 224, 3), dtype=np.uint8)

# Add "green" plant pixels (healthy part)
img_array[50:150, 50:100] = [50, 150, 50]

# Add "brown" plant pixels (diseased part) -> roughly 50% of the plant area
img_array[50:150, 100:150] = [150, 100, 50]

img_partial = Image.fromarray(img_array)
buf_partial = io.BytesIO()
img_partial.save(buf_partial, format='JPEG')
byte_im_partial = buf_partial.getvalue()

print("Testing with partially brown/green image...")
response_partial = client.post(
    "/api/detect-disease",
    files={"file": ("partial_leaf.jpg", byte_im_partial, "image/jpeg")}
)

# Also test a pure green leaf to ensure it doesn't get flagged
img_green_array = np.zeros((224, 224, 3), dtype=np.uint8)
img_green_array[50:150, 50:150] = [50, 150, 50] # All green
img_green = Image.fromarray(img_green_array)
buf_green = io.BytesIO()
img_green.save(buf_green, format='JPEG')
byte_im_green = buf_green.getvalue()

print("Testing with pure green image...")
response_green = client.post(
    "/api/detect-disease",
    files={"file": ("green_leaf.jpg", byte_im_green, "image/jpeg")}
)

out = {
    "partial_response": response_partial.json(),
    "green_response": response_green.json()
}

with open("test_results_advanced.json", "w", encoding="utf-8") as f:
    json.dump(out, f, indent=4)

print("Test finished. Output saved to test_results_advanced.json")
