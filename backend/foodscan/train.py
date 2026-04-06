"""
Food Recognition Model Trainer
================================
Run this script once after you've collected your dataset.

Expected dataset structure:
  backend/foodscan/dataset/
    apple/         (100-200 images)
    banana/        (100-200 images)
    chicken_breast/
    ... (one folder per food, folder name = food_id)

Usage:
  cd backend
  python foodscan/train.py

Output:
  backend/foodscan/model/food_model.h5
  backend/foodscan/model/class_labels.json
"""

import os
import json
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

# ── Config ────────────────────────────────────────────────────────────────────
IMG_SIZE    = 224
BATCH_SIZE  = 32
PHASE1_EPOCHS = 10   # train head only
PHASE2_EPOCHS = 15   # fine-tune top layers

DATASET_DIR = os.path.join(os.path.dirname(__file__), 'dataset')
MODEL_DIR   = os.path.join(os.path.dirname(__file__), 'model')
MODEL_PATH  = os.path.join(MODEL_DIR, 'food_model.h5')
LABELS_PATH = os.path.join(MODEL_DIR, 'class_labels.json')

os.makedirs(MODEL_DIR, exist_ok=True)

# ── Data ──────────────────────────────────────────────────────────────────────
train_gen = ImageDataGenerator(
    rescale=1.0 / 255,
    validation_split=0.2,
    rotation_range=25,
    width_shift_range=0.15,
    height_shift_range=0.15,
    horizontal_flip=True,
    zoom_range=0.2,
    brightness_range=[0.8, 1.2],
)

val_gen = ImageDataGenerator(
    rescale=1.0 / 255,
    validation_split=0.2,
)

train_data = train_gen.flow_from_directory(
    DATASET_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True,
)

val_data = val_gen.flow_from_directory(
    DATASET_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False,
)

num_classes = len(train_data.class_indices)
print(f"\nFound {num_classes} classes: {list(train_data.class_indices.keys())}\n")

# Save index → food_id mapping (folder names ARE the food_ids)
index_to_class = {str(v): k for k, v in train_data.class_indices.items()}
with open(LABELS_PATH, 'w') as f:
    json.dump(index_to_class, f, indent=2)
print(f"Class labels saved to {LABELS_PATH}")

# ── Model ─────────────────────────────────────────────────────────────────────
base = MobileNetV2(weights='imagenet', include_top=False, input_shape=(IMG_SIZE, IMG_SIZE, 3))
base.trainable = False  # freeze base for phase 1

x = base.output
x = GlobalAveragePooling2D()(x)
x = Dropout(0.3)(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.2)(x)
out = Dense(num_classes, activation='softmax')(x)

model = Model(inputs=base.input, outputs=out)

# ── Phase 1: Train classification head only ───────────────────────────────────
print("\n── Phase 1: Training classification head ──")
model.compile(
    optimizer=Adam(1e-3),
    loss='categorical_crossentropy',
    metrics=['accuracy'],
)

model.fit(
    train_data,
    validation_data=val_data,
    epochs=PHASE1_EPOCHS,
    callbacks=[EarlyStopping(patience=3, restore_best_weights=True)],
)

# ── Phase 2: Fine-tune top 40 layers of base ─────────────────────────────────
print("\n── Phase 2: Fine-tuning top layers ──")
base.trainable = True
for layer in base.layers[:-40]:
    layer.trainable = False

model.compile(
    optimizer=Adam(1e-5),   # much lower LR to avoid destroying pretrained weights
    loss='categorical_crossentropy',
    metrics=['accuracy'],
)

model.fit(
    train_data,
    validation_data=val_data,
    epochs=PHASE2_EPOCHS,
    callbacks=[
        EarlyStopping(patience=4, restore_best_weights=True),
        ModelCheckpoint(MODEL_PATH, save_best_only=True, monitor='val_accuracy'),
    ],
)

model.save(MODEL_PATH)
print(f"\nModel saved to {MODEL_PATH}")
print("Training complete. You can now start the Django server.")
