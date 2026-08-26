// Live Production vs Local API Base URL configuration
const LIVE_BACKEND_URL = 'https://truebalance-7i5t.onrender.com';

const isLocalhost = 
  typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE = import.meta.env.VITE_API_BASE || (isLocalhost ? 'http://localhost:5000' : LIVE_BACKEND_URL);

// Resilient API Fetch Wrapper with Automatic Cold-Start Retry (for Render / Cloud backends)
export async function apiFetch(url, options = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status >= 500 && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        continue;
      }
      throw err;
    }
  }
}

// Safe JSON response parser that handles HTML error pages gracefully
export async function safeJsonResponse(res) {
  const contentType = (res.headers && res.headers.get && res.headers.get('content-type')) || '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch (e) {}
  }
  
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    if (res.status === 502 || res.status === 503) {
      throw new Error('Backend server is waking up. Please try again in a few seconds 🔄');
    }
    if (res.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    if (!res.ok) {
      throw new Error(`Server response error (${res.status}). Please try again.`);
    }
    throw new Error('Invalid response received from server.');
  }
}
