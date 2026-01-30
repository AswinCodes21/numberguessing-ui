
import React, { useState, useEffect } from 'react';
import { PlayerRole } from '../types';
import { signalRService } from '../signalrService';

interface Props {
  onConfirm: (role: PlayerRole, code: string) => void;
  onBack: () => void;
}

const RoomSetup: React.FC<Props> = ({ onConfirm, onBack }) => {
  const [code, setCode] = useState('');
  const [isConnected, setIsConnected] = useState(signalRService.isConnected);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(signalRService.isConnected);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-12 text-center max-w-md mx-auto">
      <button onClick={onBack} className="mb-8 text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto transition-all">
        <span className="font-bold text-sm">Back to Modes</span>
      </button>

      <h2 className="text-3xl font-black text-slate-900 mb-2">Multiplayer Setup</h2>
      
      <div className="mb-8 flex items-center justify-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
        <span className={`text-[10px] font-black uppercase tracking-widest ${isConnected ? 'text-emerald-600' : 'text-rose-500'}`}>
          {isConnected ? 'Connection Ready' : 'Connecting to Server...'}
        </span>
      </div>

      <div className="space-y-4">
        <button
          disabled={!isConnected}
          onClick={() => onConfirm('HOST', Math.random().toString(36).substring(2, 8).toUpperCase())}
          className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Create New Room</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="flex items-center gap-4 my-6">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-slate-400 font-bold text-xs uppercase">Or Join Room</span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        <input
          type="text"
          placeholder="ENTER ROOM CODE"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="w-full p-5 border-4 border-slate-100 rounded-2xl text-center text-xl font-black tracking-widest focus:border-indigo-200 outline-none transition-all placeholder:text-slate-300"
        />

        <button
          disabled={!isConnected || code.length < 4}
          onClick={() => onConfirm('GUEST', code)}
          className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-lg hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Join Lobby
        </button>
      </div>

      {!isConnected && (
        <div className="mt-6 p-4 bg-rose-50 rounded-xl border border-rose-100">
          <p className="text-rose-600 text-xs font-bold leading-relaxed">
            Unable to reach backend. Make sure your C# app is running on port 7263 and CORS is enabled.
          </p>
        </div>
      )}
    </div>
  );
};

export default RoomSetup;
