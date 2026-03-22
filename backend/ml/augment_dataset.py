# backend/ml/augment_dataset.py

import pandas as pd
import numpy as np

df = pd.read_csv("Crop_recommendation.csv")
print(f"Original: {len(df)} rows")

augmented_rows = []

for _, row in df.iterrows():
    # Keep original row
    augmented_rows.append(row.to_dict())

    # Generate 9 realistic variations per row
    for _ in range(9):
        new_row = {
            'N':           max(0,   min(140, row['N']           + np.random.normal(0, 5))),
            'P':           max(0,   min(145, row['P']           + np.random.normal(0, 3))),
            'K':           max(0,   min(205, row['K']           + np.random.normal(0, 4))),
            'temperature': max(5,   min(48,  row['temperature'] + np.random.normal(0, 1.5))),
            'humidity':    max(10,  min(99,  row['humidity']    + np.random.normal(0, 3))),
            'ph':          max(3.5, min(9.5, row['ph']          + np.random.normal(0, 0.2))),
            'rainfall':    max(10,  min(400, row['rainfall']    + np.random.normal(0, 15))),
            'label':       row['label']
        }
        augmented_rows.append(new_row)

augmented_df = pd.DataFrame(augmented_rows)
augmented_df = augmented_df.sample(frac=1, random_state=42).reset_index(drop=True)

print(f"Augmented: {len(augmented_df)} rows")
print(f"Per crop: {len(augmented_df) // augmented_df['label'].nunique()} samples each")
print(augmented_df['label'].value_counts())

augmented_df.to_csv("augmented_crop_data.csv", index=False)
print("Saved as augmented_crop_data.csv")
