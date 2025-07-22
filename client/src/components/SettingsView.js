import React, { useState } from 'react';
import './SettingsView.css';

const SettingsView = () => {
  const [settings, setSettings] = useState({
    notifications: {
      analysisComplete: true,
      weeklyDigest: false,
      newFeatures: true
    },
    privacy: {
      saveAnalysisHistory: true,
      shareAnonymousData: false
    },
    display: {
      theme: 'light',
      compactView: false,
      showTips: true
    }
  });

  const [saved, setSaved] = useState(false);

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
    setSaved(false);
  };

  const handleSave = () => {
    // In a real app, this would save to backend
    localStorage.setItem('userSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    const defaultSettings = {
      notifications: {
        analysisComplete: true,
        weeklyDigest: false,
        newFeatures: true
      },
      privacy: {
        saveAnalysisHistory: true,
        shareAnonymousData: false
      },
      display: {
        theme: 'light',
        compactView: false,
        showTips: true
      }
    };
    setSettings(defaultSettings);
    setSaved(false);
  };

  return (
    <div className="settings-view">
      <div className="settings-header">
        <h2>⚙️ Settings</h2>
        <p>Customize your YouTube Learning Analyzer experience</p>
      </div>

      {saved && (
        <div className="save-notification">
          <span className="save-icon">✅</span>
          Settings saved successfully!
        </div>
      )}

      <div className="settings-container">
        <div className="settings-section">
          <h3>🔔 Notifications</h3>
          <p className="section-description">
            Choose what notifications you'd like to receive
          </p>
          
          <div className="setting-item">
            <div className="setting-info">
              <label>Analysis Complete</label>
              <span className="setting-description">
                Get notified when video analysis is finished
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.notifications.analysisComplete}
                onChange={(e) => handleSettingChange('notifications', 'analysisComplete', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Weekly Digest</label>
              <span className="setting-description">
                Receive a weekly summary of your learning progress
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.notifications.weeklyDigest}
                onChange={(e) => handleSettingChange('notifications', 'weeklyDigest', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>New Features</label>
              <span className="setting-description">
                Be the first to know about new features and updates
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.notifications.newFeatures}
                onChange={(e) => handleSettingChange('notifications', 'newFeatures', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>🔒 Privacy</h3>
          <p className="section-description">
            Control how your data is used and stored
          </p>
          
          <div className="setting-item">
            <div className="setting-info">
              <label>Save Analysis History</label>
              <span className="setting-description">
                Store your video analyses for future reference
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.privacy.saveAnalysisHistory}
                onChange={(e) => handleSettingChange('privacy', 'saveAnalysisHistory', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Share Anonymous Data</label>
              <span className="setting-description">
                Help improve the service by sharing anonymous usage data
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.privacy.shareAnonymousData}
                onChange={(e) => handleSettingChange('privacy', 'shareAnonymousData', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>🎨 Display</h3>
          <p className="section-description">
            Customize the appearance and layout
          </p>
          
          <div className="setting-item">
            <div className="setting-info">
              <label>Theme</label>
              <span className="setting-description">
                Choose your preferred color theme
              </span>
            </div>
            <select
              value={settings.display.theme}
              onChange={(e) => handleSettingChange('display', 'theme', e.target.value)}
              className="theme-select"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Compact View</label>
              <span className="setting-description">
                Use a more compact layout to fit more content
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.display.compactView}
                onChange={(e) => handleSettingChange('display', 'compactView', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Show Tips</label>
              <span className="setting-description">
                Display helpful tips and suggestions throughout the app
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.display.showTips}
                onChange={(e) => handleSettingChange('display', 'showTips', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>📊 Data & Storage</h3>
          <p className="section-description">
            Manage your data and storage preferences
          </p>
          
          <div className="data-info">
            <div className="data-item">
              <span className="data-label">Storage Used</span>
              <span className="data-value">2.3 MB</span>
            </div>
            <div className="data-item">
              <span className="data-label">Analyses Stored</span>
              <span className="data-value">47 items</span>
            </div>
            <div className="data-item">
              <span className="data-label">Account Created</span>
              <span className="data-value">March 2024</span>
            </div>
          </div>

          <div className="data-actions">
            <button className="export-btn">
              📥 Export Data
            </button>
            <button className="clear-data-btn">
              🗑️ Clear All Data
            </button>
          </div>
        </div>

        <div className="settings-actions">
          <button onClick={handleReset} className="reset-btn">
            🔄 Reset to Defaults
          </button>
          <button onClick={handleSave} className="save-btn">
            💾 Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;