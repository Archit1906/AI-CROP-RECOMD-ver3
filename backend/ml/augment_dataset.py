import pandas as pd
import numpy as np
import os

# Load original
csv_path = os.path.join(os.path.dirname(__file__), "Crop_recommendation.csv")
df       = pd.read_csv(csv_path)

# Normalize column names
df.columns = [c.strip().lower() for c in df.columns]

# Find label column
label_col = None
for col in ['label', 'crop', 'class', 'target']:
    if col in df.columns:
        label_col = col
        break
if not label_col:
    label_col = df.columns[-1]

print(f"Original dataset: {len(df)} rows")
print(f"Label column: '{label_col}'")
print(f"Crops: {df[label_col].unique().tolist()}")

# Rename to standard names
df = df.rename(columns={
    'n':           'N',
    'p':           'P',
    'k':           'K',
    'temperature': 'temperature',
    'humidity':    'humidity',
    'ph':          'ph',
    'rainfall':    'rainfall',
    label_col:     'label'
})

feature_cols = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']

# Realistic bounds per feature
BOUNDS = {
    'N':           (0, 140),
    'P':           (5, 145),
    'K':           (5, 205),
    'temperature': (8,  43),
    'humidity':    (14, 99),
    'ph':          (3.5, 9.5),
    'rainfall':    (20, 400),
}

# Noise per crop type — tighter for specific crops
NOISE = {
    'N':           4,
    'P':           3,
    'K':           3,
    'temperature': 1.2,
    'humidity':    2.5,
    'ph':          0.15,
    'rainfall':    12,
}

augmented = [df.copy()]   # keep originals

# 19 variations per row = 20x dataset = ~44,000 rows
VARIATIONS = 19

for _ in range(VARIATIONS):
    new_df = df.copy()
    for col in feature_cols:
        noise = np.random.normal(0, NOISE[col], len(df))
        new_df[col] = (df[col] + noise).clip(
            BOUNDS[col][0], BOUNDS[col][1]
        )
    augmented.append(new_df)

final = pd.concat(augmented, ignore_index=True)
final = final.sample(frac=1, random_state=42).reset_index(drop=True)

print(f"\nAugmented dataset: {len(final)} rows")
print(f"Per crop: ~{len(final) // final['label'].nunique()} samples")

out_path = os.path.join(os.path.dirname(__file__), "augmented_crop.csv")
final.to_csv(out_path, index=False)
print(f"Saved to: {out_path}")
