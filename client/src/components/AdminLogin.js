import React, { useState } from 'react';
import './AdminLogin.css';

const AdminLogin = ({ onAdminLogin, onBackToMain }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Hardcoded admin credentials
  const ADMIN_CREDENTIALS = {
    username: 'superadmin',
    password: 'admin123'
  };

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate loading delay
    setTimeout(() => {
      if (
        credentials.username === ADMIN_CREDENTIALS.username &&
        credentials.password === ADMIN_CREDENTIALS.password
      ) {
        onAdminLogin({
          id: 'admin-001',
          username: 'superadmin',
          firstName: 'Super',
          lastName: 'Admin',
          email: 'admin@system.local',
          role: 'admin'
        });
      } else {
        setError('Invalid admin credentials');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h2>🔐 Admin Panel Access</h2>
          <p>Enter admin credentials to access the management panel</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Admin Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              placeholder="Enter admin username"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Admin Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="Enter admin password"
              required
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onBackToMain}
              className="back-btn"
              disabled={loading}
            >
              ← Back to Main
            </button>
            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </button>
          </div>
        </form>

        <div className="admin-credentials-hint">
          <div className="hint-box">
            <h4>🔑 Demo Credentials</h4>
            <p><strong>Username:</strong> superadmin</p>
            <p><strong>Password:</strong> admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;