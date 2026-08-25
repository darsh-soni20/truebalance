import React, { useState } from 'react';
import { Lock, Delete, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function PinLockModal({ correctPin, onUnlock }) {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => setPinInput(''), 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
        
        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 w-fit mx-auto shadow-md">
          <Lock className="w-8 h-8 animate-bounce" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">TrueBalance Security Lock</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Enter your 4-digit security PIN to unlock</p>
        </div>

        {/* 4 Pin Dot Indicators */}
        <div className="flex items-center justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                error
                  ? 'bg-red-500 animate-ping'
                  : pinInput.length > idx
                  ? 'bg-emerald-500 scale-110 shadow-lg shadow-emerald-500/40'
                  : 'bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="text-xs text-red-500 font-semibold flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Incorrect PIN. Try again!</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 pt-2 max-w-[240px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 font-bold text-lg text-gray-900 dark:text-white transition-all active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 font-bold text-lg text-gray-900 dark:text-white transition-all active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-red-500/20 text-gray-500 hover:text-red-500 font-bold transition-all active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
            title="Delete"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
