import pandas as pd
import numpy as np
import os
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.calibration import CalibratedClassifierCV
import joblib
import warnings
warnings.filterwarnings('ignore')

print("Loading merged dataset...")
dataset_path = "augmented_crop_data.csv"

if not os.path.exists(dataset_path):
    print(f"Error: {dataset_path} not found. Please run augment_dataset.py first.")
    exit(1)

df = pd.read_csv(dataset_path)
print(f"Total samples: {len(df)}")
print(f"Crops: {df['label'].nunique()}")
print(f"\nDistribution:\n{df['label'].value_counts()}")

X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
y = df['label']

# Encode labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# Split with stratification — ensures every crop in both train and test
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded  # CRITICAL — balanced split
)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

print("\nTraining Random Forest...")
rf = RandomForestClassifier(
    n_estimators=500,        # more trees = more stable predictions
    max_depth=None,
    min_samples_split=2,
    min_samples_leaf=1,
    max_features='sqrt',
    class_weight='balanced', # handles imbalanced crops
    random_state=42,
    n_jobs=-1                # use all CPU cores
)
rf.fit(X_train_scaled, y_train)

rf_acc = accuracy_score(y_test, rf.predict(X_test_scaled))
print(f"Random Forest Accuracy: {rf_acc * 100:.2f}%")

# Probability calibration — THIS IS THE KEY TO HIGHER CONFIDENCE
# Raw RF probabilities are often overconfident or underconfident
# Calibration makes probabilities more accurate and meaningful
print("\nCalibrating probabilities...")
calibrated_model = CalibratedClassifierCV(
    estimator=rf,
    method='isotonic',
    cv=2
)
calibrated_model.fit(X_train_scaled, y_train)

cal_acc = accuracy_score(y_test, calibrated_model.predict(X_test_scaled))
print(f"Calibrated Model Accuracy: {cal_acc * 100:.2f}%")

# Cross validation — real measure of model quality
print("\nRunning 5-fold cross validation...")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(rf, X_train_scaled, y_train, cv=cv, scoring='accuracy')
print(f"CV Scores: {[f'{s*100:.1f}%' for s in cv_scores]}")
print(f"Mean CV: {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")

# Per-crop accuracy report
print("\nPer-crop accuracy:")
y_pred = calibrated_model.predict(X_test_scaled)
report = classification_report(y_test, y_pred, target_names=le.classes_)
print(report)

# Feature importance — tells you which inputs matter most
print("\nFeature importance:")
importances = rf.feature_importances_
features    = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
for feat, imp in sorted(zip(features, importances), key=lambda x: -x[1]):
    bar = '█' * int(imp * 50)
    print(f"  {feat:12} {bar} {imp*100:.1f}%")

# Save everything
print("\nSaving models...")

if not os.path.exists("../models"):
    os.makedirs("../models")

joblib.dump(calibrated_model, "../models/crop_model.pkl")
joblib.dump(scaler,           "../models/crop_scaler.pkl")
joblib.dump(le,               "../models/crop_label_encoder.pkl")

# Save crop names list for backend
import json
with open("../models/crop_classes.json", "w") as f:
    json.dump(le.classes_.tolist(), f)

print(f"\nDone! Model saved.")
print(f"Final accuracy: {cal_acc * 100:.2f}%")
print(f"Classes saved: {le.classes_.tolist()}")
