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
    setTimeout(() => onSelect(count), 280);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500 ${
      isDarkMode
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900'
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    }`}>
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
      </div>

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
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 1.78a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 7a3 3 0 100 6 3 3 0 000-6zm-4.22-1.78a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>

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

      <div className="w-full max-w-4xl space-y-8 relative z-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className={`text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r tracking-tight ${
            isDarkMode
              ? 'from-cyan-300 via-blue-300 to-cyan-300'
              : 'from-blue-600 via-cyan-500 to-blue-600'
          }`}>
            Choose Difficulty
          </h1>
          <p className={`text-lg font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Pick the challenge level that matches your strategy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <button
            onClick={() => handleSelect(3)}
            className={`text-left rounded-3xl p-6 border-2 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${
              selected === 3 ? 'ring-2 ring-offset-2 ring-blue-500' : ''
            } ${
              isDarkMode
                ? 'bg-slate-800/60 backdrop-blur-md border-blue-400/50 hover:border-blue-300'
                : 'bg-white/90 backdrop-blur-md border-blue-200 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-2xl font-black ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>3 Digits</h3>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">Quick Match</span>
            </div>
            <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'} text-sm mb-4`}>
              Faster rounds and easier deduction — ideal for learning or short sessions.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${isDarkMode ? 'bg-blue-500/20 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
                Avg 4-8 turns
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                Beginner friendly
              </span>
            </div>
          </button>

          <button
            onClick={() => handleSelect(4)}
            className={`text-left rounded-3xl p-6 border-2 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${
              selected === 4 ? 'ring-2 ring-offset-2 ring-cyan-500' : ''
            } ${
              isDarkMode
                ? 'bg-slate-800/60 backdrop-blur-md border-cyan-400/50 hover:border-cyan-300'
                : 'bg-white/90 backdrop-blur-md border-cyan-200 hover:border-cyan-400'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-2xl font-black ${isDarkMode ? 'text-cyan-200' : 'text-cyan-700'}`}>4 Digits</h3>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white">Pro Mode</span>
            </div>
            <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'} text-sm mb-4`}>
              More combinations and deeper mind games — great for competitive players.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${isDarkMode ? 'bg-cyan-500/20 text-cyan-200' : 'bg-cyan-100 text-cyan-700'}`}>
                Avg 7-12 turns
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                Advanced strategy
              </span>
            </div>
          </button>
        </div>

        <div className={`rounded-2xl p-5 border ${
          isDarkMode
            ? 'bg-blue-900/30 border-blue-400/30'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <p className={`text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
            Rule Reminder
          </p>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-blue-100' : 'text-blue-700'}`}>
            Secret codes may include repeated digits. Use that to create deceptive patterns.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
