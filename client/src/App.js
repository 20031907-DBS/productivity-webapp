import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import './App.css';

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/admin-panel" element={<AdminPanel />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;