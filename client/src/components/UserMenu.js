import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button 
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="user-avatar">
          {getInitials(user.name)}
        </div>
        <span>{user.name}</span>
        <span style={{ fontSize: '0.8rem' }}>▼</span>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-info">
            <h4>{user.name}</h4>
            <p>{user.email}</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              {user.analysisCount} analyses completed
            </p>
          </div>
          
          <button 
            className="user-menu-item"
            onClick={() => {
              setIsOpen(false);
              window.dispatchEvent(new CustomEvent('showHistory'));
            }}
          >
            📊 Analysis History
          </button>
          
          <button 
            className="user-menu-item"
            onClick={() => {
              setIsOpen(false);
              // Navigate to profile settings
            }}
          >
            ⚙️ Profile Settings
          </button>
          
          <button 
            className="user-menu-item danger"
            onClick={handleLogout}
          >
            🚪 Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;