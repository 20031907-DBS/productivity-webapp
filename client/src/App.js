import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import './App.css';

const AppContent = () => {
  const [guestMode, setGuestMode] = useState(false);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const handleTryFree = () => {
    setGuestMode(true);
  };

  if (authLoading) {
    return (
      <div className="App">
        <div className="loading-screen">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated and not in guest mode
  if (!isAuthenticated && !guestMode) {
    return <LoginPage onTryFree={handleTryFree} />;
  }

  // Show dashboard for authenticated users or guest mode
  return <Dashboard isGuestMode={guestMode} />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;