from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import json, os
import warnings
warnings.filterwarnings('ignore')

model_path = "../models/plant_disease_model.h5"
if not os.path.exists(model_path):
    print("Error: model not found.")
    exit(1)

model = load_model(model_path)
print("Model output shape:", model.output_shape)

gen = ImageDataGenerator(rescale=1./255)
data = gen.flow_from_directory(
    "plantvillage dataset/color",
    target_size=(224, 224),
    batch_size=1,
    class_mode='categorical'
)

print("\nCorrect class order:")
classes = {v: k for k, v in data.class_indices.items()}
class_names = [classes[i] for i in range(len(classes))]

for i in range(len(class_names)):
    print(f"  {i}: {class_names[i]}")

import json
with open("../models/correct_class_names.json", "w") as f:
    json.dump(class_names, f, indent=2)

print("\nSaved to models/correct_class_names.json")
