from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image, ImageFilter
import numpy as np
import io, os

router = APIRouter()

# Try to load real model — fallback gracefully if not found
disease_model = None
try:
    from tensorflow.keras.models import load_model
    model_abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../models/plant_disease_model.h5"))
    print(f"Looking for model at: {model_abs_path}")
    if os.path.exists(model_abs_path):
        disease_model = load_model(model_abs_path)
        print("✅ Disease model loaded successfully")
    else:
        print("⚠️  plant_disease_model.h5 not found — using smart mock")
except Exception as e:
    print(f"⚠️  Could not load disease model: {e}")

import json

class_names_path = os.path.join(os.path.dirname(__file__), "../models/correct_class_names.json")

if os.path.exists(class_names_path):
    with open(class_names_path) as f:
        CLASS_NAMES = json.load(f)
    print(f"✅ Loaded {len(CLASS_NAMES)} class names from file")
else:
    CLASS_NAMES = [
        "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
        "Blueberry___healthy", "Cherry___Powdery_mildew", "Cherry___healthy",
        "Corn___Cercospora_leaf_spot", "Corn___Common_rust", "Corn___Northern_Leaf_Blight", "Corn___healthy",
        "Grape___Black_rot", "Grape___Esca", "Grape___Leaf_blight", "Grape___healthy",
        "Orange___Haunglongbing", "Peach___Bacterial_spot", "Peach___healthy",
        "Pepper___Bacterial_spot", "Pepper___healthy",
        "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
        "Raspberry___healthy", "Soybean___healthy", "Squash___Powdery_mildew",
        "Strawberry___Leaf_scorch", "Strawberry___healthy",
        "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
        "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
        "Tomato___Spider_mites", "Tomato___Target_Spot",
        "Tomato___Yellow_Leaf_Curl_Virus", "Tomato___Mosaic_virus", "Tomato___healthy"
    ]
    print("⚠️  Using hardcoded class names")

def smart_mock_predict(img_array):
    """
    Smart mock that gives different results based on image color analysis
    instead of always returning the same class
    """
    # Analyze image colors to give varied results
    mean_r = float(np.mean(img_array[:,:,0]))
    mean_g = float(np.mean(img_array[:,:,1]))
    mean_b = float(np.mean(img_array[:,:,2]))

    # Color-based disease mapping (approximate logic)
    if mean_g > mean_r and mean_g > mean_b:
        # Mostly green — likely healthy or mild disease
        if mean_g > 120:
            top_class = "Tomato___healthy"
            conf = 0.82 + (mean_g - 120) / 1000
        else:
            top_class = "Tomato___Early_blight"
            conf = 0.75
    elif mean_r > mean_g and mean_r > 100:
        # Reddish — possible disease
        top_class = "Tomato___Late_blight"
        conf = 0.78
    elif mean_b > mean_g:
        # Bluish tones
        top_class = "Apple___Apple_scab"
        conf = 0.71
    elif mean_r > 150 and mean_g > 100:
        # Orange/yellow tones
        top_class = "Corn___Common_rust"
        conf = 0.69
    else:
        # Dark image
        top_class = "Potato___Late_blight"
        conf = 0.74

    conf = min(0.97, max(0.55, conf))

    # Build top3 with varied classes
    all_classes = [top_class]
    for c in CLASS_NAMES:
        if c != top_class and len(all_classes) < 3:
            all_classes.append(c)

    remaining = round((1 - conf) * 100, 1)
    top3 = [
        {"disease": all_classes[0], "confidence": round(conf * 100, 1)},
        {"disease": all_classes[1], "confidence": round(remaining * 0.6, 1)},
        {"disease": all_classes[2], "confidence": round(remaining * 0.4, 1)},
    ]

    return top3

def preprocess_image(contents):
    img = Image.open(io.BytesIO(contents)).convert('RGB')

    # Center crop to remove background noise
    w, h = img.size
    crop_size = min(w, h)
    left   = (w - crop_size) // 2
    top    = (h - crop_size) // 2
    right  = left + crop_size
    bottom = top + crop_size
    img = img.crop((left, top, right, bottom))

    # Resize to model input size
    img = img.resize((224, 224), Image.LANCZOS)

    # Slight sharpening helps detect disease patterns
    img = img.filter(ImageFilter.SHARPEN)

    return np.expand_dims(np.array(img, dtype=np.float32) / 255.0, axis=0)

@router.post("/detect-disease")
async def detect_disease(file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()

    try:
        img_batch = preprocess_image(contents)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not process image")

    if disease_model is not None:
        predictions = disease_model.predict(img_batch, verbose=0)[0]
        top3_indices = np.argsort(predictions)[::-1][:3]

        top3 = [
            {
                "disease":    CLASS_NAMES[i] if i < len(CLASS_NAMES) else "Unknown",
                "confidence": round(float(predictions[i]) * 100, 1)
            }
            for i in top3_indices
        ]

        # KEY FIX — if top result is "healthy" but a disease
        # is close behind (within 15%), prefer the disease
        # Real-world rule: when in doubt, warn the farmer
        best = top3[0]
        if "healthy" in best["disease"].lower() and len(top3) > 1:
            second = top3[1]
            gap = best["confidence"] - second["confidence"]
            if gap < 15 and "healthy" not in second["disease"].lower():
                # Disease is close — trust the disease prediction
                top3[0], top3[1] = top3[1], top3[0]
                best = top3[0]
    else:
        img_array = img_batch[0]
        top3 = smart_mock_predict(img_array)
        best = top3[0]

    return {
        "disease":    best["disease"],
        "confidence": best["confidence"],
        "top3":       top3,
        "model_used": "real" if disease_model is not None else "smart_mock"
    }
