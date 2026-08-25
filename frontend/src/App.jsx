import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import PinLockModal from './components/PinLockModal';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Dedicated Full-Screen Feature Pages
import AiScannerPage from './pages/AiScannerPage';
import SplitBillsPage from './pages/SplitBillsPage';
import SavingsVaultsPage from './pages/SavingsVaultsPage';
import CreditCardsPage from './pages/CreditCardsPage';
import TaxSaverPage from './pages/TaxSaverPage';
import CalculatorsPage from './pages/CalculatorsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token') || '';
    } catch (e) {
      return '';
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') ? localStorage.getItem('theme') === 'dark' : true
  );

  // Security PIN Lock State
  const pinEnabled = localStorage.getItem('tb_pin_enabled') === 'true';
  const savedPin = localStorage.getItem('tb_security_pin') || '1234';
  const [isLocked, setIsLocked] = useState(token && user && pinEnabled);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    if (localStorage.getItem('tb_pin_enabled') === 'true') {
      setIsLocked(true);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setIsLocked(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleUserUpdated = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors pb-16 lg:pb-0">
        
        {/* Security PIN Lock Overlay */}
        {isLocked && (
          <PinLockModal
            correctPin={savedPin}
            onUnlock={() => setIsLocked(false)}
          />
        )}

        <Navbar
          user={user}
          token={token}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onUserUpdated={handleUserUpdated}
        />

        <main className="pb-12">
          {!token || !user ? (
            <Routes>
              <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} switchToSignup={() => window.location.href = '/signup'} />} />
              <Route path="/signup" element={<Signup onSignupSuccess={() => window.location.href = '/login'} switchToLogin={() => window.location.href = '/login'} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          ) : user.role === 'admin' ? (
            <Routes>
              <Route path="/admin" element={<AdminDashboard token={token} />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<UserDashboard token={token} user={user} />} />
              <Route path="/scanner" element={<AiScannerPage token={token} user={user} onUserUpdated={handleUserUpdated} />} />
              <Route path="/split-bills" element={<SplitBillsPage token={token} user={user} />} />
              <Route path="/vaults" element={<SavingsVaultsPage token={token} user={user} />} />
              <Route path="/cards" element={<CreditCardsPage token={token} user={user} />} />
              <Route path="/tax-saver" element={<TaxSaverPage token={token} user={user} onUserUpdated={handleUserUpdated} />} />
              <Route path="/calculators" element={<CalculatorsPage token={token} user={user} />} />
              <Route path="/settings" element={<SettingsPage user={user} token={token} onUserUpdated={handleUserUpdated} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </main>

        {/* Mobile Bottom Touch Navigation Bar */}
        {token && user && user.role !== 'admin' && (
          <MobileBottomNav user={user} />
        )}

      </div>
    </BrowserRouter>
  );
}
