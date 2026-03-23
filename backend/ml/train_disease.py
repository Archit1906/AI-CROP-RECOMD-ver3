# Download PlantVillage dataset first:
# https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset
# Extract to: backend/ml/plantvillage/

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os

DATASET_PATH = "plantvillage dataset/color/"
IMG_SIZE     = (224, 224)
BATCH_SIZE   = 32
EPOCHS       = 10
# Dynamically determine the number of classes based on subdirectories
class_dirs = [d for d in os.listdir(DATASET_PATH) if os.path.isdir(os.path.join(DATASET_PATH, d))] if os.path.exists(DATASET_PATH) else []
NUM_CLASSES  = len(class_dirs) if class_dirs else 38
print(f"Detected {NUM_CLASSES} disease classes for training.")

# Data generators
train_gen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2,
    rotation_range=40,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.3,
    horizontal_flip=True,
    vertical_flip=True,
    brightness_range=[0.7, 1.3],  # handles lighting variation
    fill_mode='nearest'
)

val_gen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2
)

if os.path.exists(DATASET_PATH):
    train_data = train_gen.flow_from_directory(
        DATASET_PATH, target_size=IMG_SIZE,
        batch_size=BATCH_SIZE, subset='training',
        class_mode='categorical'
    )

    val_data = val_gen.flow_from_directory(
        DATASET_PATH, target_size=IMG_SIZE,
        batch_size=BATCH_SIZE, subset='validation',
        class_mode='categorical'
    )

    # MobileNetV2 transfer learning
    base = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224,224,3))
    
    # Unfreeze the base model for fine-tuning
    base.trainable = True
    # Freeze the early layers, fine-tune the later ones
    for layer in base.layers[:100]:
        layer.trainable = False

    x = GlobalAveragePooling2D()(base.output)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.3)(x)
    out = Dense(NUM_CLASSES, activation='softmax')(x)

    model = Model(inputs=base.input, outputs=out)
    
    # Use a smaller learning rate since we are fine-tuning and starting from existing weights
    optimizer = tf.keras.optimizers.Adam(learning_rate=1e-4)
    model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['accuracy'])

    checkpoint_path = "../models/plant_disease_model.h5"
    if os.path.exists(checkpoint_path):
        print(f"Loading existing weights from {checkpoint_path}...")
        try:
            model.load_weights(checkpoint_path, by_name=True, skip_mismatch=True)
            print("Successfully loaded matching weights! Mismatched layers (like the new output layer) will be re-initialized.")
        except Exception as e:
            print(f"Could not load all weights due to shape changes: {e}\nStarting fresh.")

    os.makedirs("../models", exist_ok=True)
    
    reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(
        monitor='val_accuracy', 
        factor=0.5, 
        patience=2, 
        min_lr=1e-6, 
        verbose=1
    )
    
    checkpoint = tf.keras.callbacks.ModelCheckpoint(
        checkpoint_path,
        save_best_only=True,
        monitor='val_accuracy',
        verbose=1
    )

    model.fit(train_data, validation_data=val_data, epochs=EPOCHS, callbacks=[checkpoint, reduce_lr])

    print("✅ Model training complete and best version saved!")
else:
    print(f"Dataset path {DATASET_PATH} not found. Please download it first.")
