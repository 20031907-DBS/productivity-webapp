import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import AnalyzerView from '../components/AnalyzerView';
import AnalysisHistory from '../components/AnalysisHistory';
import AnalysisDetail from '../components/AnalysisDetail';
import ProfileView from '../components/ProfileView';
import StatsView from '../components/StatsView';
import SettingsView from '../components/SettingsView';
import './Dashboard.css';

const Dashboard = ({ isGuestMode = false }) => {
  const [currentView, setCurrentView] = useState('analyzer');
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const { user, logout } = useAuth();

  const handleViewChange = (view) => {
    setCurrentView(view);
    setSelectedAnalysisId(null);
  };

  const handleSelectAnalysis = (analysisId) => {
    setSelectedAnalysisId(analysisId);
    setCurrentView('detail');
  };

  const handleBackToHistory = () => {
    setCurrentView('history');
    setSelectedAnalysisId(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'analyzer':
        return <AnalyzerView isGuestMode={isGuestMode} />;
      case 'history':
        return isGuestMode ? (
          <div className="guest-restriction">
            <h2>🔐 Sign Up Required</h2>
            <p>Analysis history is only available for registered users.</p>
          </div>
        ) : (
          <AnalysisHistory onSelectAnalysis={handleSelectAnalysis} />
        );
      case 'detail':
        return selectedAnalysisId ? (
          <AnalysisDetail 
            analysisId={selectedAnalysisId} 
            onBack={handleBackToHistory} 
          />
        ) : null;
      case 'profile':
        return isGuestMode ? (
          <div className="guest-restriction">
            <h2>🔐 Sign Up Required</h2>
            <p>Profile management is only available for registered users.</p>
          </div>
        ) : (
          <ProfileView />
        );
      case 'stats':
        return isGuestMode ? (
          <div className="guest-restriction">
            <h2>🔐 Sign Up Required</h2>
            <p>Statistics are only available for registered users.</p>
          </div>
        ) : (
          <StatsView />
        );
      case 'settings':
        return isGuestMode ? (
          <div className="guest-restriction">
            <h2>🔐 Sign Up Required</h2>
            <p>Settings are only available for registered users.</p>
          </div>
        ) : (
          <SettingsView />
        );
      default:
        return <AnalyzerView isGuestMode={isGuestMode} />;
    }
  };

  return (
    <div className="dashboard">
      <Sidebar 
        currentView={currentView}
        onViewChange={handleViewChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        isGuestMode={isGuestMode}
        onLogout={logout}
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
              {currentView === 'analyzer' && '🎯 Video Analyzer'}
              {currentView === 'history' && '📊 Analysis History'}
              {currentView === 'detail' && '📋 Analysis Details'}
              {currentView === 'profile' && '👤 Profile'}
              {currentView === 'stats' && '📈 Statistics'}
              {currentView === 'settings' && '⚙️ Settings'}
            </h1>
          </div>
          
          <div className="header-right">
            {isGuestMode && (
              <div className="guest-badge">
                🚀 Guest Mode
              </div>
            )}
            {!isGuestMode && user && (
              <div className="user-info">
                <span className="user-name">Welcome, {user.name}!</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="dashboard-content">
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;