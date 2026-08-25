import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TrueBalance Application Error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      const errorText = this.state.error ? (this.state.error.stack || this.state.error.toString()) : 'Unknown Session Error';
      return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <img src="/assets/logo_dark.png" alt="TrueBalance" className="h-20 object-contain mx-auto" />
            <h2 className="text-xl font-bold text-emerald-400">Connection Refresh Required</h2>
            <p className="text-xs text-gray-400">
              The app cache needs to be updated. Tap below to reload your session cleanly.
            </p>
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[10px] break-all text-left max-h-32 overflow-y-auto">
              {errorText}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
            >
              Reload TrueBalance App 🔄
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
