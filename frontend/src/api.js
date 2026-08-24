export const API_BASE = window.location.protocol === 'file:' || !window.location.origin.includes('5000') 
  ? 'http://localhost:5000' 
  : '';
