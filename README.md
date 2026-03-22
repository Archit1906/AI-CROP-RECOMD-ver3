# AmritKrishi 2.0 - AI Crop Recommendation System 🌱

> An end-to-end AI-powered Crop Recommendation and Agricultural Management System.

Welcome to **AmritKrishi 2.0**, a comprehensive platform designed to empower farmers and agricultural enthusiasts. Our system leverages advanced machine learning models to suggest the best crops for cultivation based on soil metrics and environmental factors, alongside providing a suite of powerful agricultural management tools.

---

## 🔥 Key Features

- 🌾 **AI Crop Recommendation**: Get highly accurate predictive suggestions using Scikit-learn models (Decision Tree & Random Forest) based on N, P, K levels, pH, temperature, humidity, and rainfall.
- 🌤️ **Real-time Weather Dashboard**: Integrated with the OpenWeather API to display current conditions and hyper-local forecasts.
- 📈 **Market Analytics**: Discover real-time insights into crop prices and market trends to maximize profitability, utilizing Data.gov APIs.
- 📚 **Government Schemes Repository**: Access an up-to-date and organized list of the latest agricultural government policies and subsidies.
- 🩺 **Disease Detection Module**: Upload images of infected plants and let our AI assist you in diagnosing the disease and suggesting treatments.
- 💵 **Financial Planner**: A robust toolset for managing agricultural loans, running EMI calculations, tracking subscriptions, and strategic tax planning.
- 🤖 **Interactive Chatbot**: Ask any farming-related queries to our Gemini-powered intelligent assistant.
- 🌓 **Dynamic Interface & Dark Mode**: Experience a stunning UI with smooth animations, glassmorphism, and a customizable "Ignite" dark theme (state persisted locally).

---

## 🛠️ Tech Stack

**Frontend**:
- React 18 & Vite
- Tailwind CSS (Utility-first styling with custom Dark Mode strategy)
- React Router DOM
- Data Visualizations (Charts & Graphs)

**Backend**:
- Python & FastAPI
- Scikit-learn (Machine Learning Models)
- Uvicorn (ASGI Web Server)
- Pandas & NumPy (Data Processing)

**Databases & APIs**:
- MongoDB (Data Storage)
- OpenWeather API
- Google Gemini API (Chatbot)
- Indian Government Open Data (Data.gov.in)

---

## 🚀 Installation & Setup

Follow these steps to set up the project locally.

### 1. Clone the repository
```bash
git clone https://github.com/Archit1906/AI-CROP-RECOMD.git
cd AI-CROP-RECOMD
```

### 2. Backend Setup
Navigate to the `backend` directory and start the FastAPI server:
```bash
cd backend
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
```
*Note: Make sure your machine learning `.pkl` models are placed in the `backend/models/` directory.*

### 3. Frontend Setup
Open a new terminal window, navigate to the `frontend` directory, and start the React development server:
```bash
cd frontend
# Install Node modules
npm install

# Start the Vite development server
npm run dev
```

---

## 🔐 Environment Variables

You will need to set up environment variables for both the frontend and backend. 

### Backend (`backend/.env`)
Create a `.env` file inside the `backend/` folder and add your specific keys:
```env
OPENWEATHER_API_KEY=your_openweather_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
MONGO_URI=your_mongodb_connection_string
DATA_GOV_API_KEY=your_data_gov_api_key_here
```

### Frontend (`frontend/.env`)
Create a `.env` file inside the `frontend/` folder:
```env
# URL for the FastAPI backend (Default is usually http://localhost:8000)
VITE_API_URL=http://localhost:8000
```

---

## 💡 Usage Guide

1. **Dashboard**: The central hub providing a quick summary of weather, active tasks, and recent recommendations.
2. **Crop Recommendation**: Input your soil metrics (Nitrogen, Phosphorous, Potassium, pH) and location. The system will auto-fetch weather details and use the loaded ML model to recommend the best crop.
3. **Market Analytics**: View market trends before making a sale. Click the "View Analytics" button to dive deep into historical pricing graphs and forecast metrics.
4. **Financial Planner**: Click on the planner tabs to calculate EMIs for new equipment, track operational subscription costs, and list tax-saving instruments.

---

## 👥 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License
This project is licensed under the MIT License.
