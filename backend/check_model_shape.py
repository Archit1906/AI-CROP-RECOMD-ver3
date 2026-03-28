from tensorflow.keras.models import load_model

model = load_model("models/plant_disease_model.h5")
print("Model output shape:", model.output_shape)
