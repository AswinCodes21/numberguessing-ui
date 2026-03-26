import React, { useState, useEffect } from 'react';
import { PlayerRole } from '../types';

interface RoomSetupProps {
  onConfirm: (role: PlayerRole, code: string) => void;
  onBack: () => void;
  onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const RoomSetup: React.FC<RoomSetupProps> = ({ onConfirm, onBack, onShowToast, isDarkMode, toggleDarkMode }) => {
  const [roomCode, setRoomCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<PlayerRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate random room code when HOST is selected
  useEffect(() => {
    if (selectedRole === 'HOST' && !roomCode) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomCode(code);
    }
  }, [selectedRole]);

  const handleConfirm = () => {
    setError('');
    
    if (!selectedRole) {
      setError('Please select a role (Host or Guest)');
      onShowToast?.('error', 'Role Required', 'Please select whether you want to create or join a room.');
      return;
    }

    if (!roomCode.trim()) {
      setError('Room code is required');
      onShowToast?.('error', 'Code Required', 'Please enter a room code.');
      return;
    }

    if (roomCode.length !== 6) {
      setError('Room code must be 6 characters');
      onShowToast?.('error', 'Invalid Code', 'Room code must be exactly 6 characters.');
      return;
    }

    if (!/^[A-Z0-9]+$/.test(roomCode)) {
      setError('Room code must contain only letters and numbers');
      onShowToast?.('error', 'Invalid Format', 'Room code can only contain uppercase letters and numbers.');
      return;
    }

    setIsLoading(true);
    onConfirm(selectedRole, roomCode);
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
            Online Duel
          </h1>
          <p className={`text-lg font-medium ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Create or join a room to play with friends
          </p>
        </div>

        {/* Role Selection */}
        <div className="space-y-4">
          {/* Host Button */}
          <button
            onClick={() => setSelectedRole('HOST')}
            disabled={isLoading}
            className={`w-full group rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 border-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedRole === 'HOST' ? 'ring-2 ring-offset-2 ring-blue-500' : ''
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
                  Create Room
                </h3>
                <p className={`text-sm mt-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Host and invite others
                </p>
              </div>
              <div className={`text-3xl ${selectedRole === 'HOST' ? 'scale-110' : ''} transition-transform`}><svg className="w-8 h-8 text-amber-400 animate-bounce" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z"/></svg></div>
            </div>
          </button>

          {/* Guest Button */}
          <button
            onClick={() => setSelectedRole('GUEST')}
            disabled={isLoading}
            className={`w-full group rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 border-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedRole === 'GUEST' ? 'ring-2 ring-offset-2 ring-cyan-500' : ''
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
                  Join Room
                </h3>
                <p className={`text-sm mt-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Enter a room code
                </p>
              </div>
              <div className={`text-3xl ${selectedRole === 'GUEST' ? 'scale-110' : ''} transition-transform`}><svg className="w-8 h-8 text-cyan-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="10" width="18" height="8" rx="4"/><path d="M8 14h4"/><path d="M10 12v4"/><circle cx="16" cy="13" r="1" fill="currentColor"/><circle cx="18" cy="15" r="1" fill="currentColor"/></svg></div>
            </div>
          </button>
        </div>

        {/* Room Code Input */}
        {selectedRole && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <label className={`text-xs font-bold uppercase tracking-widest mb-2 block ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {selectedRole === 'HOST' ? 'Your Room Code' : 'Enter Room Code'}
              </label>
              <input
                type="text"
                placeholder={selectedRole === 'HOST' ? 'Auto-generated' : 'e.g., ABC123'}
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setError('');
                }}
                disabled={selectedRole === 'HOST' || isLoading}
                maxLength={6}
                className={`w-full px-6 py-4 rounded-2xl font-mono text-lg font-bold uppercase tracking-widest text-center transition-all duration-300 border-2 ${
                  error
                    ? isDarkMode
                      ? 'bg-red-900 bg-opacity-20 border-red-500 text-red-300'
                      : 'bg-red-50 border-red-500 text-red-600'
                    : isDarkMode
                    ? 'bg-slate-700 bg-opacity-50 border-blue-400 border-opacity-30 text-cyan-300 placeholder-slate-500 focus:border-blue-300 focus:outline-none disabled:opacity-60'
                    : 'bg-white bg-opacity-50 border-blue-300 border-opacity-60 text-blue-600 placeholder-slate-400 focus:border-blue-500 focus:outline-none disabled:opacity-60'
                }`}
              />
              {error && (
                <p className={`text-xs font-medium mt-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  {error}
                </p>
              )}
            </div>

            {/* Copy Button for HOST */}
            {selectedRole === 'HOST' && roomCode && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomCode);
                  onShowToast?.('success', 'Copied', 'Room code copied to clipboard!');
                }}
                className={`w-full px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-blue-500 bg-opacity-30 text-blue-300 hover:bg-opacity-50'
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
              >
                Copy Code
              </button>
            )}

            {/* Continue Button */}
            <button
              onClick={handleConfirm}
              disabled={!roomCode.trim() || isLoading}
              className={`w-full font-bold text-lg py-5 px-8 rounded-full transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 hover:from-blue-600 hover:via-cyan-500 hover:to-blue-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 hover:from-blue-600 hover:via-cyan-500 hover:to-blue-600 text-white'
              }`}
            >
              <span>Continue</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomSetup;
