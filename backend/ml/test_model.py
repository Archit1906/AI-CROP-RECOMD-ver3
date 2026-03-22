# backend/ml/test_model.py
from tensorflow.keras.models import load_model
from PIL import Image
import numpy as np, json
import os

model_path = "../models/plant_disease_model.h5"
if not os.path.exists(model_path):
    print("Model not found!")
    exit(1)

model = load_model(model_path)

with open("../models/correct_class_names.json") as f:
    CLASS_NAMES = json.load(f)

# Test with your image
if not os.path.exists("test_leaf.jpg"):
    print("Please place test_leaf.jpg in the backend/ml directory!")
    exit(1)

img = Image.open("test_leaf.jpg").convert('RGB')

# Try with center crop
w, h = img.size
crop = min(w, h)
img_cropped = img.crop(((w-crop)//2, (h-crop)//2,
                         (w+crop)//2, (h+crop)//2))
img_cropped = img_cropped.resize((224, 224))

arr = np.expand_dims(np.array(img_cropped) / 255.0, axis=0)
preds = model.predict(arr, verbose=0)[0]

top5 = np.argsort(preds)[::-1][:5]
print("Top 5 predictions:")
for i in top5:
    print(f"  {CLASS_NAMES[i]}: {preds[i]*100:.1f}%")
