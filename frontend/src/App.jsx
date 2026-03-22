import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CropRecommendation from './pages/CropRecommendation';
import DiseaseDetection from './pages/DiseaseDetection';
import WeatherPage from './pages/WeatherPage';
import MarketPrices from './pages/MarketPrices';
import MarketAnalytics from './pages/MarketAnalytics';
import Chatbot from './pages/Chatbot';
import GovernmentSchemes from './pages/GovernmentSchemes';
import { ThemeProvider } from './contexts/ThemeContext';
import { useState } from 'react';
import SeedToForest from './components/SeedToForest';
import EcoBg from './components/EcoBg';

export default function App() {
  const [introComplete, setIntroComplete] = useState(
    () => sessionStorage.getItem('seed_intro_shown') === 'true'
  )

  const handleIntroComplete = () => {
    sessionStorage.setItem('seed_intro_shown', 'true')
    setIntroComplete(true)
  }

  return (
    <ThemeProvider>
      <EcoBg />
      {!introComplete && (
        <SeedToForest onComplete={handleIntroComplete} />
      )}
      <div style={{
        opacity: introComplete ? 1 : 0,
        transition: 'opacity 0.6s',
        pointerEvents: introComplete ? 'all' : 'none',
        position: 'relative',
        zIndex: 1
      }}>
        <BrowserRouter>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full lg:ml-0 ml-20" style={{ background: 'transparent' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/crop" element={<CropRecommendation />} />
                <Route path="/disease" element={<DiseaseDetection />} />
                <Route path="/weather" element={<WeatherPage />} />
                <Route path="/market" element={<MarketPrices />} />
                <Route path="/market/analytics" element={<MarketAnalytics />} />
                <Route path="/chat" element={<Chatbot />} />
                <Route path="/schemes" element={<GovernmentSchemes />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}
