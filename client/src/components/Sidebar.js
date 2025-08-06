import React from 'react';
import './Sidebar.css';

const Sidebar = ({
  currentView,
  onViewChange,
  collapsed,
  onToggleCollapse,
  user,
  isAdmin
}) => {
  const menuItems = [
    {
      id: 'analyzer',
      icon: '🎯',
      label: 'Video Analyzer',
      description: 'Analyze YouTube videos with local AI'
    }
  ];

  // Add admin menu item if user is admin
  if (isAdmin) {
    menuItems.push({
      id: 'admin',
      icon: '👑',
      label: 'Admin Panel',
      description: 'Manage users and system settings'
    });
  }



  return (
    <>
      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🎯</span>
            {!collapsed && (
              <div className="logo-text">
                <h3>Local AI Analyzer</h3>
                <p>Privacy-First Learning</p>
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
                    className={`nav-link ${currentView === item.id ? 'active' : ''}`}
                    onClick={() => onViewChange(item.id)}
                    title={collapsed ? item.label : item.description}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!collapsed && (
                      <div className="nav-text">
                        <span className="nav-label">{item.label}</span>
                        <span className="nav-description">{item.description}</span>
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {user && (
            <div className="user-info-section">
              <div className="user-card">
                <div className="user-avatar">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
                {!collapsed && (
                  <div className="user-details">
                    <h4>{user.firstName} {user.lastName}</h4>
                    <p>@{user.username}</p>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="ai-info-section">
            <div className="ai-card">
              <div className="ai-icon">🤖</div>
              {!collapsed && (
                <div className="ai-info">
                  <h4>Local AI Powered</h4>
                  <p>Whisper + Qwen3 running locally</p>
                  <div className="ai-stats">
                    <span className="stat-item">🔒 Privacy First</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
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
    </>
  );
};

export default Sidebar;