import React, { useState } from 'react';

interface SetupScreenProps {
  onSelect: (count: 3 | 4) => void;
  onBack: () => void;
  onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onSelect, onBack, onShowToast, isDarkMode, toggleDarkMode }) => {
  const [selected, setSelected] = useState<3 | 4 | null>(null);

  const handleSelect = (count: 3 | 4) => {
    setSelected(count);
    onShowToast?.('success', 'Difficulty Selected', `You chose ${count}-digit mode`);
    setTimeout(() => onSelect(count), 300);
  };

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

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onBack}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl ${
            isDarkMode
              ? 'bg-slate-800 bg-opacity-50 backdrop-blur-md border border-cyan-400 border-opacity-30 hover:border-opacity-50 text-cyan-300 hover:text-cyan-200'
              : 'bg-white bg-opacity-70 backdrop-blur-md border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-bold uppercase tracking-wide">Back</span>
        </button>
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-2xl space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className={`text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r tracking-tight ${
            isDarkMode
              ? 'from-cyan-300 via-blue-300 to-cyan-300'
              : 'from-blue-600 via-cyan-500 to-blue-600'
          }`}>
            Choose Difficulty
          </h1>
          <p className={`text-lg font-medium ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            How many digits should the secret code have?
          </p>
        </div>

        {/* Difficulty Options */}
        <div className="space-y-4">
          {/* 3 Digits */}
          <button
            onClick={() => handleSelect(3)}
            className={`w-full group rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 border-2 cursor-pointer relative overflow-hidden ${
              selected === 3 ? 'ring-2 ring-offset-2 ring-blue-500' : ''
            } ${
              isDarkMode
                ? 'bg-slate-800 bg-opacity-50 backdrop-blur-md border-blue-400 border-opacity-50 hover:border-blue-300 hover:bg-opacity-70'
                : 'bg-white bg-opacity-80 backdrop-blur-md border-blue-300 border-opacity-60 hover:border-blue-500 hover:bg-opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className={`text-2xl font-bold ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>
                  3 Digits
                </h3>
                <p className={`text-sm mt-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Easier for beginners
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white transition-all ${
                selected === 3 ? 'bg-blue-500 scale-110' : 'bg-blue-400'
              }`}>
                3
              </div>
            </div>
          </button>

          {/* 4 Digits */}
          <button
            onClick={() => handleSelect(4)}
            className={`w-full group rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 border-2 cursor-pointer relative overflow-hidden ${
              selected === 4 ? 'ring-2 ring-offset-2 ring-cyan-500' : ''
            } ${
              isDarkMode
                ? 'bg-slate-800 bg-opacity-50 backdrop-blur-md border-cyan-400 border-opacity-50 hover:border-cyan-300 hover:bg-opacity-70'
                : 'bg-white bg-opacity-80 backdrop-blur-md border-cyan-300 border-opacity-60 hover:border-cyan-500 hover:bg-opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className={`text-2xl font-bold ${
                  isDarkMode ? 'text-cyan-300' : 'text-cyan-600'
                }`}>
                  4 Digits
                </h3>
                <p className={`text-sm mt-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Pro level challenge
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white transition-all ${
                selected === 4 ? 'bg-cyan-500 scale-110' : 'bg-cyan-400'
              }`}>
                4
              </div>
            </div>
          </button>
        </div>

        {/* Game Rule Info */}
        <div className={`rounded-2xl p-5 border ${
          isDarkMode
            ? 'bg-blue-900 bg-opacity-30 border-blue-400 border-opacity-30'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <p className={`text-xs font-bold uppercase tracking-wide ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`}>
            Game Rule
          </p>
          <p className={`text-sm mt-2 italic ${
            isDarkMode ? 'text-blue-200' : 'text-blue-700'
          }`}>
            "The secret code can contain any combination of digits. Repeating digits are allowed!"
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
