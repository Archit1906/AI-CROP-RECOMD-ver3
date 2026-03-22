from fastapi import APIRouter
from pydantic import BaseModel
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

if API_KEY and API_KEY != "your_key_here":
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None

SYSTEM_PROMPT = """You are AMRITKRISHI AI, a smart and friendly agricultural assistant built specifically for Indian farmers. You speak like a helpful expert friend, not a robot.

You help farmers with:
- Crop selection based on soil, season, location
- Plant disease diagnosis and organic/chemical treatment
- Weather-based farming decisions
- Government schemes, subsidies, loans (PM-KISAN, PMFBY, etc.)
- Market prices and best time to sell
- Irrigation, fertilizer, and pest management
- Tamil Nadu specific farming advice

Rules:
- Keep answers SHORT, practical, bullet points preferred
- Use simple words, avoid technical jargon
- Always end with one encouraging line for the farmer
- If asked about disease, always mention: diagnosis, cure, prevention
- For crop questions always mention: best season, water need, profit estimate
- Never give wrong medical or chemical advice — say "consult local agricultural officer" if unsure"""

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    history: list[Message] = []

@router.post("/chatbot")
async def chat(req: ChatRequest):
    if not model:
        return {
            "reply": "⚠️ API key is missing. Please add a valid GEMINI_API_KEY to your .env file.",
            "success": False
        }

    # Build message history for context
    messages = []
    
    # Add history (last 10 messages only to save tokens)
    for msg in req.history[-10:]:
        role = "user" if msg.role == "user" else "model"
        messages.append({
            "role": role,
            "parts": [msg.content]
        })
    
    try:
        # Create a new chat session with history and system prompt
        chat_session = model.start_chat(history=messages)
        
        # Prepend the system instructions explicitly to the user's latest message
        # (Since generic flash doesn't always support pure system instructions perfectly via start_chat)
        lang_map = {"en": "English", "ta": "Tamil", "hi": "Hindi"}
        target_lang = lang_map.get(req.language, "English")
        
        full_msg = f"{SYSTEM_PROMPT}\n\nCRITICAL INSTRUCTION: You MUST respond entirely in the {target_lang} language regardless of what language the user types in.\n\nUser Question:\n{req.message}"
        
        response = chat_session.send_message(full_msg)
        
        return {
            "reply": response.text,
            "tokens_used": 0,
            "success": True
        }
    
    except Exception as e:
        return {
            "reply": f"⚠️ Something went wrong: {str(e)}",
            "success": False
        }
