import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import './index.css';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import Home from './pages/Home/Home';
import LandingPage from './pages/LandingPage'
import Navbar from './components/Navbar';
import AIPlanner from './pages/Ai-planner/AIPlanner';
import Itineraries from './pages/Ai-planner/Itineraries'
import axios from 'axios';
import ResetPassword from './pages/Auth/ResetPassword';
import { BASE_URL } from './utils/constants';

const AppContent = () => {
  // Hydrate userInfo from localStorage for instant profile display
  const [userInfo, setUserInfo] = useState(() => {
    const saved = localStorage.getItem('userInfo');
    return saved ? JSON.parse(saved) : null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${BASE_URL}/get-user`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setUserInfo(res.data.user);
        localStorage.setItem('userInfo', JSON.stringify(res.data.user));
      })
      .catch(() => {
        setUserInfo(null);
        localStorage.removeItem('userInfo');
      })
      .finally(() => setLoading(false));
    } else {
      setUserInfo(null);
      localStorage.removeItem('userInfo');
      setLoading(false);
    }
  }, []);

  const handleShowPublicStories = () => {
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

 
  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white">
      </div>
    );
  }

  return (
    <>
      <Navbar
        userInfo={userInfo}
        showPublicStories={handleShowPublicStories}
      />
      <Routes>
        <Route path="/" exact element={
          <LandingPage
            userInfo={userInfo}
          />
        }/>
        <Route path="/dashboard" exact element={
          <Home/>
        }/>
        <Route path="/login" exact element={<Login/>}/>
        <Route path="/signup" exact element={<SignUp/>}/>
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/ai-planner" exact element={<AIPlanner />}/>
        <Route path="/itineraries" exact element={<Itineraries />}/>
      </Routes>
    </>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;