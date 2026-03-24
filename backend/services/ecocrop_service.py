import json
import os

class EcocropService:
    def __init__(self):
        self._ecocrop_data = []
        self._load_data()

    def _load_data(self):
        base_dir = os.path.dirname(os.path.dirname(__file__))
        data_path = os.path.join(base_dir, "data", "ecocrop.json")
        try:
            with open(data_path, "r", encoding="utf-8") as f:
                self._ecocrop_data = json.load(f)
            print(f"✅ Loaded {len(self._ecocrop_data)} crops from Ecocrop dataset into memory.")
        except Exception as e:
            print(f"❌ Failed to load ecocrop.json: {e}")
            self._ecocrop_data = []

    def filter_crops(self, temperature: float, rainfall: float, ph: float) -> list:
        """
        Returns a list of crop names where the input falls within the acceptable ranges.
        """
        filtered = []
        for crop in self._ecocrop_data:
            t_min = crop.get("temp_min")
            t_max = crop.get("temp_max")
            r_min = crop.get("rain_min", 0)
            r_max = crop.get("rain_max", 9999)
            ph_min = crop.get("ph_min", 0.0)
            ph_max = crop.get("ph_max", 14.0)

            # Check Temperature
            if t_min is not None and t_max is not None:
                if not (t_min <= temperature <= t_max):
                    continue
            
            # Check Rainfall
            if r_min is not None and r_max is not None:
                if not (r_min <= rainfall <= r_max):
                    continue

            # Check Soil pH
            if ph_min is not None and ph_max is not None:
                if not (ph_min <= ph <= ph_max):
                    continue
            
            filtered.append(crop["crop"])

        return filtered

# Create a singleton instance for global use
ecocrop_service = EcocropService()
