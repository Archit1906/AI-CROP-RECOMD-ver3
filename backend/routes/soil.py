from fastapi import APIRouter
from data.soil_data import SOIL_DATA

router = APIRouter()

@router.get("/soil/{state_name}")
def get_soil(state_name: str):
    soil = SOIL_DATA.get(state_name)
    if not soil:
        return {"error": f"No soil data for {state_name}"}
    return {"state": state_name, **soil}
