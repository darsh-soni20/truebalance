// Live Production vs Local API Base URL configuration
const LIVE_BACKEND_URL = 'https://truebalance-7i5t.onrender.com';

const isLocalhost = 
  typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE = import.meta.env.VITE_API_BASE || (isLocalhost ? 'http://localhost:5000' : LIVE_BACKEND_URL);
