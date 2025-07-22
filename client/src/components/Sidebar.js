import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ 
  currentView, 
  onViewChange, 
  collapsed, 
  onToggleCollapse, 
  user, 
  isGuestMode, 
  onLogout 
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    {
      id: 'analyzer',
      icon: '🎯',
      label: 'Video Analyzer',
      description: 'Analyze YouTube videos'
    },
    {
      id: 'history',
      icon: '📊',
      label: 'Analysis History',
      description: 'View past analyses',
      requiresAuth: true
    },
    {
      id: 'stats',
      icon: '📈',
      label: 'Statistics',
      description: 'Learning insights',
      requiresAuth: true
    },
    {
      id: 'profile',
      icon: '👤',
      label: 'Profile',
      description: 'Manage your account',
      requiresAuth: true
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: 'Settings',
      description: 'App preferences',
      requiresAuth: true
    }
  ];

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    onLogout();
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🎯</span>
            {!collapsed && (
              <div className="logo-text">
                <h3>YouTube Analyzer</h3>
                <p>AI-Powered Learning</p>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <ul className="nav-list">
              {menuItems.map((item) => (
                <li key={item.id} className="nav-item">
                  <button
                    className={`nav-link ${currentView === item.id ? 'active' : ''} ${
                      item.requiresAuth && isGuestMode ? 'disabled' : ''
                    }`}
                    onClick={() => !item.requiresAuth || !isGuestMode ? onViewChange(item.id) : null}
                    disabled={item.requiresAuth && isGuestMode}
                    title={collapsed ? item.label : item.description}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!collapsed && (
                      <div className="nav-text">
                        <span className="nav-label">{item.label}</span>
                        <span className="nav-description">{item.description}</span>
                      </div>
                    )}
                    {item.requiresAuth && isGuestMode && !collapsed && (
                      <span className="lock-icon">🔒</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {!isGuestMode && user && (
            <div className="user-section">
              <div className="user-card">
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="user-details">
                    <h4 className="user-name">{user.name}</h4>
                    <p className="user-email">{user.email}</p>
                    <div className="user-stats">
                      <span className="stat-item">
                        📊 {user.analysisCount || 0} analyses
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isGuestMode && (
            <div className="guest-section">
              <div className="guest-card">
                <div className="guest-icon">🚀</div>
                {!collapsed && (
                  <div className="guest-info">
                    <h4>Guest Mode</h4>
                    <p>Sign up to unlock all features</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          {!isGuestMode && (
            <button 
              className="logout-btn"
              onClick={handleLogout}
              title={collapsed ? 'Logout' : 'Sign out of your account'}
            >
              <span className="logout-icon">🚪</span>
              {!collapsed && <span>Logout</span>}
            </button>
          )}
          
          <button 
            className="collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className={`collapse-icon ${collapsed ? 'collapsed' : ''}`}>
              ◀
            </span>
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to sign out?</p>
            <div className="logout-modal-actions">
              <button className="cancel-btn" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={confirmLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;