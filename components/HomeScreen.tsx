import React from 'react';
import GameGuide from './GameGuide';

interface HomeScreenProps {
  onStart: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStart, isDarkMode, toggleDarkMode }) => {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    }`}>
      {/* 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient blobs */}
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

        {/* Grid Pattern Overlay */}
        <div className={`absolute inset-0 ${isDarkMode ? 'opacity-10' : 'opacity-5'}`}>
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(90deg, ${isDarkMode ? 'rgba(100, 200, 255, 0.1)' : 'rgba(100, 150, 255, 0.1)'} 1px, transparent 1px),
                              linear-gradient(${isDarkMode ? 'rgba(100, 200, 255, 0.1)' : 'rgba(100, 150, 255, 0.1)'} 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Floating particles */}
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

      {/* Main Content Container */}
      <div className="w-full max-w-2xl space-y-8 relative z-10">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-6">
          {/* Icon with 3D Effect */}
          <div className="relative group">
            <div className={`absolute -inset-4 rounded-3xl blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-300 animate-pulse ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400'
                : 'bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300'
            }`}></div>
            <div className={`relative w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300 ${
              isDarkMode
                ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                : 'bg-gradient-to-br from-blue-400 to-cyan-400'
            }`} style={{
              boxShadow: isDarkMode 
                ? '0 25px 50px -12px rgba(59, 130, 246, 0.5), 0 0 60px rgba(34, 211, 238, 0.3)'
                : '0 25px 50px -12px rgba(59, 130, 246, 0.3), 0 0 60px rgba(34, 211, 238, 0.2)'
            }}>
              <span className="text-7xl drop-shadow-lg">🎯</span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2 text-center">
            <h1 className={`text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r tracking-tight drop-shadow-lg ${
              isDarkMode
                ? 'from-cyan-300 via-blue-300 to-cyan-300'
                : 'from-blue-600 via-cyan-500 to-blue-600'
            }`}>
              Digit Duel
            </h1>
            <p className={`font-bold text-sm uppercase tracking-[0.25em] ${
              isDarkMode ? 'text-cyan-400' : 'text-blue-600'
            }`}>
              VILUTHUGAL PRODUCTION
            </p>
          </div>

          {/* Description */}
          <p className={`text-lg max-w-lg text-center leading-relaxed font-medium ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            The classic code-breaking logic game. Can you guess the secret number?
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <button
            onClick={onStart}
            className={`w-full font-bold text-lg py-6 px-8 rounded-full transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3 group relative overflow-hidden ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 hover:from-blue-600 hover:via-cyan-500 hover:to-blue-600 text-white'
                : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 hover:from-blue-600 hover:via-cyan-500 hover:to-blue-600 text-white'
            }`}
            style={{
              boxShadow: isDarkMode
                ? '0 20px 40px rgba(59, 130, 246, 0.4), 0 0 40px rgba(34, 211, 238, 0.2)'
                : '0 20px 40px rgba(59, 130, 246, 0.3), 0 0 40px rgba(34, 211, 238, 0.15)'
            }}
          >
            <span>Start New Game</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Game Rules Section */}
        <div className="space-y-4">
          {/* Green Card */}
          <div className={`group rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border hover:-translate-y-1 cursor-pointer ${
            isDarkMode
              ? 'bg-slate-800 bg-opacity-50 backdrop-blur-md border-emerald-400 border-opacity-30 hover:border-emerald-300 hover:bg-opacity-60'
              : 'bg-white bg-opacity-70 backdrop-blur-md border-emerald-300 border-opacity-50 hover:border-emerald-400 hover:bg-opacity-90'
          }`}>
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0">
                <div className={`flex items-center justify-center h-12 w-12 rounded-full transition-colors ${
                  isDarkMode
                    ? 'bg-emerald-500 bg-opacity-20 group-hover:bg-opacity-40'
                    : 'bg-emerald-400 bg-opacity-30 group-hover:bg-opacity-50'
                }`}>
                  <span className="text-2xl">🟢</span>
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className={`text-sm font-bold uppercase tracking-wide ${
                  isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                }`}>
                  Correct Number - Correct Place
                </h3>
                <p className={`text-sm mt-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Right digit, right spot
                </p>
              </div>
            </div>
          </div>

          {/* Yellow Card */}
          <div className={`group rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border hover:-translate-y-1 cursor-pointer ${
            isDarkMode
              ? 'bg-slate-800 bg-opacity-50 backdrop-blur-md border-amber-400 border-opacity-30 hover:border-amber-300 hover:bg-opacity-60'
              : 'bg-white bg-opacity-70 backdrop-blur-md border-amber-300 border-opacity-50 hover:border-amber-400 hover:bg-opacity-90'
          }`}>
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0">
                <div className={`flex items-center justify-center h-12 w-12 rounded-full transition-colors ${
                  isDarkMode
                    ? 'bg-amber-500 bg-opacity-20 group-hover:bg-opacity-40'
                    : 'bg-amber-400 bg-opacity-30 group-hover:bg-opacity-50'
                }`}>
                  <span className="text-2xl">🟡</span>
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className={`text-sm font-bold uppercase tracking-wide ${
                  isDarkMode ? 'text-amber-300' : 'text-amber-700'
                }`}>
                  Correct Number
                </h3>
                <p className={`text-sm mt-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Right digit, wrong spot
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Guide Section */}
        <div className="pt-4">
          <GameGuide compact={true} />
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
