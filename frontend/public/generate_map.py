import geopandas as gpd
import json
import os

print("Downloading Natural Earth data...")
world = gpd.read_file(
    "https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip"
)

print("Filtering for India...")
india = world[world['admin'] == 'India'].copy()
india = india[['name', 'geometry']].rename(columns={'name': 'ST_NM'})

print("Converting to GeoJSON...")
geojson = json.loads(india.to_json())

for f in geojson['features']:
    f['properties']['ST_NM'] = f['properties'].get('ST_NM', '')

geojson_path = os.path.join(os.path.dirname(__file__), 'india-states.geojson')
with open(geojson_path, 'w') as f:
    json.dump(geojson, f)

print(f"Saved {len(geojson['features'])} states to {geojson_path}")
print("States:", [f['properties']['ST_NM'] for f in geojson['features']])
