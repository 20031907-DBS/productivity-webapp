import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import './Auth.css';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);

  if (!isOpen) return null;

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="auth-modal" onClick={handleOverlayClick}>
      <div className="auth-modal-content">
        <button className="auth-close-btn" onClick={onClose}>
          ×
        </button>
        
        {mode === 'login' ? (
          <LoginForm 
            onToggleMode={handleToggleMode}
            onClose={onClose}
          />
        ) : (
          <RegisterForm 
            onToggleMode={handleToggleMode}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;