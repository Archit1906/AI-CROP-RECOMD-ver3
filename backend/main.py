from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import crop, disease, weather, market, chatbot, schemes, soil

app = FastAPI(title="AmritKrishi API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "https://your-vercel-app.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(crop.router, prefix="/api", tags=["Crop"])
app.include_router(disease.router, prefix="/api", tags=["Disease"])
app.include_router(weather.router, prefix="/api", tags=["Weather"])
app.include_router(market.router, prefix="/api", tags=["Market"])
app.include_router(chatbot.router, prefix="/api", tags=["Chatbot"])
app.include_router(schemes.router, prefix="/api", tags=["Schemes"])
app.include_router(soil.router, prefix="/api", tags=["Soil"])

@app.get("/")
def root():
    return {"message": "AmritKrishi API is running 🌱"}

from services.schemes_updater import get_schemes

@app.on_event("startup")
async def startup_event():
    # Pre-load schemes into memory on server start
    await get_schemes()
    print("✅ Schemes loaded on startup")
