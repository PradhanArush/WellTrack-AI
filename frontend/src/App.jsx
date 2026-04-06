import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import NutritionPage from './pages/NutritionPage';
import ActivityPage from './pages/ActivityPage';
import SleepPage from './pages/SleepPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import ScanFoodPage from './pages/ScanFoodPage';
import Chatbot from './components/Chatbot';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, tokens) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('demo_mode');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <div className="text-2xl text-teal-600">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <Navbar isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />
        
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <HomePage isAuthenticated={isAuthenticated} />} />
          <Route path="/dashboard" element={isAuthenticated ? <DashboardPage user={user} /> : <Navigate to="/login" />} />
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage onLogin={handleLogin} />
            }
          />
          <Route 
            path="/nutrition" 
            element={
              isAuthenticated ? <NutritionPage /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/activity" 
            element={
              isAuthenticated ? <ActivityPage /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/sleep" 
            element={
              isAuthenticated ? <SleepPage /> : <Navigate to="/login" />
            } 
          />
          <Route
            path="/scan"
            element={
              isAuthenticated ? <ScanFoodPage /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/profile"
            element={
              isAuthenticated ? <ProfilePage user={user} setUser={setUser} onLogout={handleLogout} /> : <Navigate to="/login" />
            }
          />
        </Routes>

        {isAuthenticated && <Chatbot />}
        <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
      </div>
    </Router>
  );
}

export default App;