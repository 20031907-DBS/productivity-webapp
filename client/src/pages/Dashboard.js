import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import AnalyzerView from '../components/AnalyzerView';
import AdminDashboard from '../components/AdminDashboard';
import Login from '../components/Login';
import Register from '../components/Register';
import './Dashboard.css';

const Dashboard = () => {
  const { user, login, logout, loading, isAuthenticated, isAdmin } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const navigate = useNavigate();
  const location = useLocation();

  // Get current view from URL
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes('/admin')) return 'admin';
    return 'analyzer';
  };

  const currentView = getCurrentView();

  const handleViewChange = (view) => {
    if (view === 'admin') {
      navigate('/dashboard/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/dashboard');
  };

  const renderAuthView = () => {
    if (authMode === 'login') {
      return (
        <Login
          onLogin={login}
          onSwitchToRegister={() => setAuthMode('register')}
        />
      );
    } else {
      return (
        <Register
          onRegister={login}
          onSwitchToLogin={() => setAuthMode('login')}
        />
      );
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return renderAuthView();
  }

  return (
    <div className="dashboard">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        isAdmin={isAdmin}
      />

      <div className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="dashboard-header">
          <div className="header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              ☰
            </button>
            <h1 className="page-title">
              {currentView === 'analyzer' && '🎯 Local AI Video Analyzer'}
              {currentView === 'admin' && '👑 Admin Dashboard'}
            </h1>
          </div>

          <div className="header-right">
            <div className="user-info">
              <span className="welcome-text">
                Welcome, {user.firstName}!
              </span>
              <button onClick={handleLogout} className="logout-btn">
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <Routes>
            <Route path="/" element={<AnalyzerView />} />
            <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <AnalyzerView />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;