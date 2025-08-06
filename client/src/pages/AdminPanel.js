import React, { useState } from 'react';
import AdminLogin from '../components/AdminLogin';
import AdminDashboard from '../components/AdminDashboard';
import './AdminPanel.css';

const AdminPanel = () => {
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAdminLogin = (user) => {
    setAdminUser(user);
    setIsAuthenticated(true);
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    setIsAuthenticated(false);
  };

  const handleBackToMain = () => {
    // Navigate back to main app
    window.location.href = '/dashboard';
  };

  if (!isAuthenticated) {
    return (
      <AdminLogin 
        onAdminLogin={handleAdminLogin}
        onBackToMain={handleBackToMain}
      />
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div className="admin-panel-title">
          <h1>🛠️ System Administration Panel</h1>
          <p>Complete user management and system control</p>
        </div>
        <div className="admin-panel-user">
          <div className="admin-user-info">
            <span className="admin-welcome">Welcome, {adminUser.firstName}!</span>
            <span className="admin-role">System Administrator</span>
          </div>
          <div className="admin-actions">
            <button onClick={handleBackToMain} className="back-to-main-btn">
              🏠 Main App
            </button>
            <button onClick={handleAdminLogout} className="admin-logout-btn">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
      
      <div className="admin-panel-content">
        <AdminDashboard />
      </div>
    </div>
  );
};

export default AdminPanel;