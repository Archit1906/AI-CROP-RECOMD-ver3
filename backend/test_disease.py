import os
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array

# Suppress TF warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

model_path = "models/plant_disease_model.h5"
if not os.path.exists(model_path):
    print("Model not found!")
    exit(1)

model = load_model(model_path)

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
print("Comparing against my exact class names.")
train_classes = sorted(os.listdir(r"ml\plantvillage dataset\color"))

blight_dir = r"ml\plantvillage dataset\color\Tomato___Early_blight"
test_imgs = os.listdir(blight_dir)
img_path = os.path.join(blight_dir, test_imgs[0])

img = load_img(img_path, target_size=(224, 224))
img_array = img_to_array(img)
img_batch = np.expand_dims(img_array, axis=0)

out = []
out.append("Class name match exactly? " + str(CLASS_NAMES == train_classes))

rescaled_batch = img_batch / 255.0
preds_r = model.predict(rescaled_batch, verbose=0)[0]
out.append(f"Rescaled -> {train_classes[np.argmax(preds_r)]} ({preds_r[np.argmax(preds_r)]*100:.1f}%)")

preds_raw = model.predict(img_batch, verbose=0)[0]
out.append(f"Raw -> {train_classes[np.argmax(preds_raw)]} ({preds_raw[np.argmax(preds_raw)]*100:.1f}%)")

from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
mob_batch = preprocess_input(img_batch.copy())
preds_m = model.predict(mob_batch, verbose=0)[0]
out.append(f"MobileNet -> {train_classes[np.argmax(preds_m)]} ({preds_m[np.argmax(preds_m)]*100:.1f}%)")

with open("results.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
