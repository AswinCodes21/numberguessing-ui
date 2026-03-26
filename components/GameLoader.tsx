import React, { useState, useEffect } from 'react';

interface GameLoaderProps {
  status: string;
  subtext?: string;
  fullScreen?: boolean;
  compact?: boolean;
  showCancel?: boolean;
  onCancel?: () => void;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

const GameLoader: React.FC<GameLoaderProps> = ({
  status,
  subtext,
  fullScreen = true,
  compact = false,
  showCancel = false,
  onCancel,
  isDarkMode = false,
  toggleDarkMode,
}) => {
  const [dots, setDots] = useState('');

  // Animated dots for loading effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (fullScreen) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' 
          : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
      }`}>
        {/* 3D Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-20 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse ${
            isDarkMode 
              ? 'bg-gradient-to-r from-blue-500 to-cyan-400' 
              : 'bg-gradient-to-r from-blue-300 to-cyan-200'
          }`}></div>
          
          <div className={`absolute top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse ${
            isDarkMode 
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500' 
              : 'bg-gradient-to-r from-cyan-300 to-blue-300'
          }`} style={{ animationDelay: '2s' }}></div>
          
          <div className={`absolute -bottom-40 left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse ${
            isDarkMode 
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500' 
              : 'bg-gradient-to-r from-blue-300 to-cyan-200'
          }`} style={{ animationDelay: '4s' }}></div>

          <div className={`absolute inset-0 ${isDarkMode ? 'opacity-10' : 'opacity-5'}`}>
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(90deg, ${isDarkMode ? 'rgba(100, 200, 255, 0.1)' : 'rgba(100, 150, 255, 0.1)'} 1px, transparent 1px),
                                linear-gradient(${isDarkMode ? 'rgba(100, 200, 255, 0.1)' : 'rgba(100, 150, 255, 0.1)'} 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}></div>
          </div>

          <div className={`absolute top-1/4 left-1/4 w-2 h-2 rounded-full opacity-30 animate-pulse ${isDarkMode ? 'bg-cyan-400' : 'bg-blue-400'}`}></div>
          <div className={`absolute top-1/3 right-1/4 w-2 h-2 rounded-full opacity-30 animate-pulse ${isDarkMode ? 'bg-blue-400' : 'bg-cyan-400'}`} style={{ animationDelay: '1s' }}></div>
          <div className={`absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full opacity-30 animate-pulse ${isDarkMode ? 'bg-cyan-400' : 'bg-blue-400'}`} style={{ animationDelay: '2s' }}></div>
          <div className={`absolute top-2/3 right-1/3 w-3 h-3 rounded-full opacity-20 animate-pulse ${isDarkMode ? 'bg-blue-400' : 'bg-cyan-400'}`} style={{ animationDelay: '1.5s' }}></div>
        </div>

        {/* Theme Toggle Button */}
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl ${
              isDarkMode
                ? 'bg-slate-800 bg-opacity-50 backdrop-blur-md border border-cyan-400 border-opacity-30 hover:border-opacity-50'
                : 'bg-white bg-opacity-70 backdrop-blur-md border border-slate-200 hover:border-blue-300'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 1.78a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.828 2.828a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.828 2.829a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 7a3 3 0 100 6 3 3 0 000-6zm-4.22-1.78a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM2.344 5.656a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM2 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm1.464 4.464a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.828 2.828a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.828 2.829a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-2xl space-y-12 relative z-10">
          {/* Logo Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className={`absolute -inset-4 rounded-3xl blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-300 animate-pulse ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400'
                  : 'bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300'
              }`}></div>
              <div className={`relative w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl ${
                isDarkMode
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  : 'bg-gradient-to-br from-blue-400 to-cyan-400'
              }`}>
                <div className="relative w-12 h-12" aria-hidden="true"><div className="absolute inset-0 rounded-full border-2 border-cyan-300 animate-ping"></div><div className="absolute inset-[6px] rounded-full border-4 border-white/80"></div><div className="absolute inset-[14px] rounded-full bg-cyan-100"></div></div>
              </div>
            </div>
            <h1 className={`text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r tracking-tight ${
              isDarkMode
                ? 'from-cyan-300 via-blue-300 to-cyan-300'
                : 'from-blue-600 via-cyan-500 to-blue-600'
            }`}>
              Digit Duel
            </h1>
          </div>

          {/* Lobby Card */}
          <div className={`rounded-3xl p-10 shadow-2xl border-2 transition-all duration-300 ${
            isDarkMode
              ? 'bg-slate-800 bg-opacity-50 backdrop-blur-md border-blue-400 border-opacity-50'
              : 'bg-white bg-opacity-80 backdrop-blur-md border-blue-300 border-opacity-60'
          }`}>
            {/* Status Text */}
            <div className="text-center space-y-4 mb-8">
              <h2 className={`text-3xl font-bold ${
                isDarkMode ? 'text-cyan-300' : 'text-blue-600'
              }`}>
                {status}
                <span className="inline-block w-8 text-left">{dots}</span>
              </h2>
              {subtext && (
                <p className={`text-lg font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {subtext}
                </p>
              )}
            </div>

            {/* Animated Loading Indicator */}
            <div className="flex justify-center gap-3 mb-10">
              <div className={`w-4 h-4 rounded-full animate-bounce transition-all ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-400 to-cyan-400'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`} style={{ animationDelay: '0s' }}></div>
              <div className={`w-4 h-4 rounded-full animate-bounce transition-all ${
                isDarkMode
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-400'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500'
              }`} style={{ animationDelay: '0.2s' }}></div>
              <div className={`w-4 h-4 rounded-full animate-bounce transition-all ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-400 to-cyan-400'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`} style={{ animationDelay: '0.4s' }}></div>
            </div>

            {/* Fun Tips */}
            <div className={`rounded-2xl p-5 border ${
              isDarkMode
                ? 'bg-blue-900 bg-opacity-30 border-blue-400 border-opacity-30'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <p className={`text-sm font-semibold ${
                isDarkMode ? 'text-blue-300' : 'text-blue-700'
              }`}>
                Pro Tip: Use your guess history wisely to narrow down the secret!
              </p>
            </div>
          </div>

          {/* Cancel Button */}
          {showCancel && onCancel && (
            <button
              onClick={onCancel}
              className={`w-full py-4 px-6 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 ${
                isDarkMode
                  ? 'bg-slate-700 bg-opacity-50 border-2 border-red-400 border-opacity-50 text-red-300 hover:border-red-300 hover:bg-opacity-70'
                  : 'bg-red-50 border-2 border-red-300 text-red-600 hover:bg-red-100'
              }`}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  // Compact version for inside game container
  return (
    <div className={`w-full h-96 flex flex-col items-center justify-center p-8 relative overflow-hidden rounded-3xl transition-colors duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-800 via-blue-800 to-slate-800' 
        : 'bg-gradient-to-br from-slate-100 via-blue-100 to-slate-100'
    }`}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 -left-20 w-40 h-40 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse ${
          isDarkMode 
            ? 'bg-gradient-to-r from-blue-400 to-cyan-300' 
            : 'bg-gradient-to-r from-blue-300 to-cyan-200'
        }`}></div>
        
        <div className={`absolute top-0 -right-20 w-40 h-40 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse ${
          isDarkMode 
            ? 'bg-gradient-to-r from-cyan-300 to-blue-400' 
            : 'bg-gradient-to-r from-cyan-300 to-blue-300'
        }`} style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-6">
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="inline-flex gap-3">
            <div className={`w-4 h-4 rounded-full animate-bounce ${
              isDarkMode ? 'bg-cyan-400' : 'bg-blue-500'
            }`} style={{ animationDelay: '0s' }}></div>
            <div className={`w-4 h-4 rounded-full animate-bounce ${
              isDarkMode ? 'bg-blue-400' : 'bg-cyan-500'
            }`} style={{ animationDelay: '0.2s' }}></div>
            <div className={`w-4 h-4 rounded-full animate-bounce ${
              isDarkMode ? 'bg-cyan-400' : 'bg-blue-500'
            }`} style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>

        {/* Status Text */}
        <div className="space-y-2">
          <h2 className={`text-3xl font-bold ${
            isDarkMode ? 'text-cyan-200' : 'text-blue-600'
          }`}>
            {status}
            <span className="inline-block w-6 text-left">{dots}</span>
          </h2>
          {subtext && (
            <p className={`text-sm font-medium ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {subtext}
            </p>
          )}
        </div>

        {/* Cancel Button */}
        {showCancel && onCancel && (
          <button
            onClick={onCancel}
            className={`mt-6 px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              isDarkMode
                ? 'bg-red-500 bg-opacity-30 text-red-300 hover:bg-opacity-50 border border-red-400'
                : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-300'
            }`}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default GameLoader;
