import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ProfileView.css';

const ProfileView = () => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateProfile(formData.name);
      if (result.success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const result = await deleteAccount();
      if (!result.success) {
        setError(result.error);
      }
      // If successful, user will be logged out automatically
    } catch (err) {
      setError('Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="profile-view">
      <div className="profile-header">
        <h2>👤 Your Profile</h2>
        <p>Manage your account information and preferences</p>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="avatar-info">
              <h3>{user?.name}</h3>
              <p className="user-type">
                {user?.isGoogleUser ? '🔍 Google Account' : '📧 Email Account'}
              </p>
            </div>
          </div>

          {error && (
            <div className="alert error-alert">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="alert success-alert">
              <span className="alert-icon">✅</span>
              {success}
            </div>
          )}

          <div className="profile-form-section">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-group">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                    minLength="2"
                  />
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="edit-btn"
                    >
                      ✏️ Edit
                    </button>
                  ) : (
                    <div className="edit-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({ name: user?.name || '' });
                          setError('');
                          setSuccess('');
                        }}
                        className="cancel-btn"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="save-btn"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="disabled-input"
                />
                <small className="form-hint">Email cannot be changed</small>
              </div>
            </form>
          </div>

          <div className="profile-stats">
            <h4>📊 Account Statistics</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Member Since</span>
                <span className="stat-value">
                  {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Analyses</span>
                <span className="stat-value">{user?.analysisCount || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Account Type</span>
                <span className="stat-value">
                  {user?.isGoogleUser ? 'Google OAuth' : 'Email & Password'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="danger-zone">
          <h4>⚠️ Danger Zone</h4>
          <div className="danger-content">
            <div className="danger-info">
              <strong>Delete Account</strong>
              <p>
                Permanently delete your account and all associated data. 
                This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="delete-account-btn"
              disabled={loading}
            >
              🗑️ Delete Account
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="delete-modal">
          <div className="delete-modal-content">
            <h3>⚠️ Confirm Account Deletion</h3>
            <p>
              Are you sure you want to delete your account? This will permanently remove:
            </p>
            <ul>
              <li>Your profile information</li>
              <li>All analysis history</li>
              <li>All saved data</li>
            </ul>
            <p><strong>This action cannot be undone.</strong></p>
            
            <div className="delete-modal-actions">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="cancel-delete-btn"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="confirm-delete-btn"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;