import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Classroom from './pages/Classroom';
import Productivity from './pages/Productivity';
import AiSolver from './pages/AiSolver';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import TimetableView from './pages/TimetableView';
import DoubtPortal from './pages/DoubtPortal';
import AdminDashboard from './pages/AdminDashboard';
import AdminClassroomView from './pages/AdminClassroomView';
import api from './api';

import Sparkles from './components/Sparkles';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) return null;

  return (
    <BrowserRouter>
      <Sparkles />
      <Routes>
        <Route path="/" element={!isAuthenticated ? <Landing /> : (user?.onboarded ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />)} />
        <Route path="/auth" element={!isAuthenticated ? <Auth handleLogin={handleLogin} /> : (user?.onboarded ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />)} />
        <Route path="/onboarding" element={isAuthenticated && !user?.onboarded ? <Onboarding updateUser={updateUser} /> : <Navigate to="/" />} />
        
        <Route element={isAuthenticated && user?.onboarded ? <MainLayout onLogout={handleLogout} user={user} updateUser={updateUser} /> : <Navigate to="/" />}>
          <Route path="/dashboard" element={user?.isAdmin ? <Navigate to="/admin" /> : <Dashboard user={user} updateUser={updateUser} />} />
          <Route path="/classroom" element={<Classroom user={user} updateUser={updateUser} />} />
          <Route path="/doubts" element={<DoubtPortal user={user} updateUser={updateUser} />} />
          <Route path="/productivity" element={<Productivity user={user} />} />
          <Route path="/ai" element={<AiSolver user={user} />} />
          <Route path="/timetable" element={<TimetableView user={user} />} />
          <Route path="/admin" element={user?.isAdmin ? <AdminDashboard user={user} /> : <Navigate to="/dashboard" />} />
          <Route path="/admin/classroom/:id" element={user?.isAdmin ? <AdminClassroomView /> : <Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
