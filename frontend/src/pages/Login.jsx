import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { API_BASE } from '../api';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const navigate = useNavigate();

  // Detect Google OAuth Access Token callback in URL Hash
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    const accessToken = hashParams.get('access_token');

    if (accessToken) {
      setLoading(true);
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
        .then((res) => res.json())
        .then((userInfo) => {
          if (userInfo.email) {
            handleGoogleAuth(userInfo.email, userInfo.name);
          }
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError('Please enter a valid, verified email address (e.g. name@gmail.com)');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: password.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      onLoginSuccess(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRedirect = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '717467389270-d7a0v43g7q7k5k50k.apps.googleusercontent.com',
          callback: async (response) => {
            if (response && response.credential) {
              try {
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                const payload = JSON.parse(jsonPayload);
                if (payload && payload.email) {
                  handleGoogleAuth(payload.email, payload.name || payload.given_name);
                  return;
                }
              } catch (e) {}
            }
            setShowGoogleModal(true);
          }
        });

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setShowGoogleModal(true);
          }
        });
        return;
      } catch (err) {
        console.error('Google One-Tap error:', err);
      }
    }
    setShowGoogleModal(true);
  };

  const handleGoogleAuth = async (emailVal, nameVal) => {
    setError('');
    const targetEmail = (emailVal || googleEmail).trim().toLowerCase();

    if (!EMAIL_REGEX.test(targetEmail)) {
      setError('Please enter a valid Google Account email address (e.g. user@gmail.com)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: nameVal || googleName || targetEmail.split('@')[0],
          monthly_budget: 25000
        })
      });

      const data = await safeJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Google Authentication failed');

      setShowGoogleModal(false);
      onLoginSuccess(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  const handleGoogleCredentialResponse = (response) => {
    if (response && response.credential) {
      try {
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        if (payload && payload.email) {
          handleGoogleAuth(payload.email, payload.name || payload.given_name);
          return;
        }
      } catch (err) {
        console.error('Google Token Decode error:', err);
      }
    }
  };

  useEffect(() => {
    const initGoogleBtn = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '717467389270-d7a0v43g7q7k5k50k.apps.googleusercontent.com',
            callback: handleGoogleCredentialResponse
          });

          const btnContainer = document.getElementById('officialGoogleBtnContainer');
          if (btnContainer) {
            btnContainer.innerHTML = '';
            window.google.accounts.id.renderButton(btnContainer, {
              theme: 'outline',
              size: 'large',
              width: '360',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            });
          }
        } catch (e) {
          console.error('Google GIS Init error:', e);
        }
      }
    };

    initGoogleBtn();
    const timer = setTimeout(initGoogleBtn, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all">
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/assets/logo_light.png" alt="TrueBalance Logo" className="h-28 object-contain block dark:hidden" />
            <img src="/assets/logo_dark.png" alt="TrueBalance Logo" className="h-28 object-contain hidden dark:block" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to manage your income & expenses</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Official Google Native Button Container */}
        <div className="flex justify-center mb-4">
          <div id="officialGoogleBtnContainer" className="w-full min-h-[44px] flex justify-center"></div>
        </div>

        {/* Fallback Google Button */}
        <button
          type="button"
          onClick={handleGoogleRedirect}
          className="w-full py-2.5 px-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer mb-5"
        >
          <span>Select Account Manually</span>
        </button>

        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-gray-200 dark:border-gray-800 w-full" />
          <span className="bg-white dark:bg-gray-900 px-3 text-[10px] uppercase font-bold text-gray-400 absolute">or sign in with email</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Verified Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Sign up here
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/60">
          <p className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-widest mb-3">
            Instant 1-Click Demo Login
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => quickLogin('admin@tracker.com', 'admin123')}
              className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/20 transition-all cursor-pointer text-center"
            >
              1-Click Admin 👑
            </button>
            <button
              onClick={() => quickLogin('user@tracker.com', 'user123')}
              className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-all cursor-pointer text-center"
            >
              1-Click User 👤
            </button>
          </div>
        </div>

      </div>

      {/* Google Account Selector Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Choose a Google Account</h3>
              <p className="text-xs text-gray-500">to continue to TrueBalance</p>
            </div>

            {/* Quick Select Preset Google Accounts */}
            <div className="space-y-2 pt-2">
              <p className="text-[10px] font-bold uppercase text-gray-400">Verified Google Accounts</p>
              
              <button
                onClick={() => handleGoogleAuth('darshsoni20@gmail.com', 'Darsh Soni')}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/80 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  D
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-gray-900 dark:text-white truncate">Darsh Soni</div>
                  <div className="text-[10px] text-gray-400 truncate">darshsoni20@gmail.com</div>
                </div>
              </button>

              <button
                onClick={() => handleGoogleAuth('user@gmail.com', 'Heri Ghetiya')}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/80 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  H
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-gray-900 dark:text-white truncate">Heri Ghetiya</div>
                  <div className="text-[10px] text-gray-400 truncate">user@gmail.com</div>
                </div>
              </button>
            </div>

            <div className="relative my-3 flex items-center justify-center">
              <div className="border-t border-gray-200 dark:border-gray-800 w-full" />
              <span className="bg-white dark:bg-gray-900 px-2 text-[10px] uppercase font-bold text-gray-400 absolute">or enter custom gmail</span>
            </div>

            <div className="space-y-3">
              <div>
                <input
                  type="email"
                  placeholder="Enter your Gmail (e.g. name@gmail.com)"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => handleGoogleAuth()}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-all"
              >
                Sign In with Google Gmail 🚀
              </button>

              <button
                onClick={() => setShowGoogleModal(false)}
                className="w-full py-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
