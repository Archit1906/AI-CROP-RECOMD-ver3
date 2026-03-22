import pandas as pd
import os

# Load all CSV files
dfs = []

# Add every CSV file you downloaded
csv_files = [
    "dataset1.csv",   # rename your downloaded files to these
    "dataset2.csv",
    "Crop_recommendation.csv"  # your original one
]

for f in csv_files:
    if os.path.exists(f):
        df = pd.read_csv(f)
        print(f"Loaded {f}: {len(df)} rows, columns: {list(df.columns)}")
        dfs.append(df)

# Standardize column names across datasets
# Most crop datasets use these column names — adjust if different
COLUMN_MAP = {
    'N': 'N', 'Nitrogen': 'N', 'nitrogen': 'N',
    'P': 'P', 'Phosphorus': 'P', 'phosphorus': 'P',
    'K': 'K', 'Potassium': 'K', 'potassium': 'K',
    'temperature': 'temperature', 'Temperature': 'temperature',
    'humidity': 'humidity', 'Humidity': 'humidity',
    'ph': 'ph', 'pH': 'ph', 'PH': 'ph',
    'rainfall': 'rainfall', 'Rainfall': 'rainfall',
    'label': 'label', 'crop': 'label', 'Crop': 'label',
    'Crop_Type': 'label', 'crop_type': 'label'
}

normalized = []
for df in dfs:
    df = df.rename(columns=COLUMN_MAP)
    required = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'label']
    if all(col in df.columns for col in required):
        normalized.append(df[required])
    else:
        print(f"WARNING: Missing columns. Available: {list(df.columns)}")

if normalized:
    merged = pd.concat(normalized, ignore_index=True)

    # Clean data
    merged = merged.dropna()
    merged = merged.drop_duplicates()

    # Remove outliers — values outside realistic ranges
    merged = merged[
        (merged['N'].between(0, 140))    &
        (merged['P'].between(0, 145))    &
        (merged['K'].between(0, 205))    &
        (merged['temperature'].between(0, 50)) &
        (merged['humidity'].between(0, 100))   &
        (merged['ph'].between(3, 10))    &
        (merged['rainfall'].between(0, 400))
    ]

    print(f"\nFinal dataset: {len(merged)} rows")
    print("\nCrop distribution:")
    print(merged['label'].value_counts())

    merged.to_csv("merged_crop_data.csv", index=False)
    print("\nSaved as merged_crop_data.csv")
else:
    print("No valid datasets loaded. Check if the files exist in the directory.")
