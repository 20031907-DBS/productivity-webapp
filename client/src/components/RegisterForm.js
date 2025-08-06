import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const RegisterForm = ({ onToggleMode, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { registerUser } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (formData.firstName.trim().length < 2) {
      return 'First name must be at least 2 characters long';
    }
    
    if (formData.lastName.trim().length < 2) {
      return 'Last name must be at least 2 characters long';
    }
    
    if (formData.username.trim().length < 3) {
      return 'Username must be at least 3 characters long';
    }

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const result = await registerUser(
      formData.firstName, 
      formData.lastName, 
      formData.username, 
      formData.email, 
      formData.password
    );
    
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogleSignup = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="auth-form">
      <h2>Create Account</h2>
      <p>Join to save and track your video analyses</p>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder="First name"
              minLength="2"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              placeholder="Last name"
              minLength="2"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Choose a username"
            minLength="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Create a password"
            minLength="6"
          />
          <small className="form-hint">
            Must be at least 6 characters with letters and numbers
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
            minLength="6"
          />
        </div>

        <button 
          type="submit" 
          className="auth-btn primary"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <button 
        type="button" 
        className="auth-btn google"
        onClick={handleGoogleSignup}
        disabled={loading}
      >
        <span className="google-icon">🔍</span>
        Continue with Google
      </button>

      <div className="auth-footer">
        <p>
          Already have an account?{' '}
          <button 
            type="button" 
            className="link-btn"
            onClick={onToggleMode}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;