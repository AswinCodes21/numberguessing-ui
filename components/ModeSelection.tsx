
import React from 'react';
import { GameMode } from '../types';

interface Props {
  onSelect: (mode: GameMode) => void;
  onBack: () => void;
}

const ModeSelection: React.FC<Props> = ({ onSelect, onBack }) => {
  return (
    <div className="p-12 text-center">
      <button onClick={onBack} className="mb-8 text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-bold text-sm">Main Menu</span>
      </button>

      <h2 className="text-4xl font-black text-slate-900 mb-2">Game Mode</h2>
      <p className="text-slate-500 mb-12 font-medium">Choose how you want to play today</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <button
          onClick={() => onSelect('AI')}
          className="group p-8 bg-white border-4 border-slate-100 rounded-[2rem] hover:border-indigo-600 transition-all text-left shadow-xl hover:shadow-indigo-100"
        >
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:bg-indigo-600 group-hover:scale-110 transition-all">🤖</div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">VS Computer</h3>
          <p className="text-slate-500 text-sm">Practice your logic against our smart AI bot.</p>
        </button>

        <button
          onClick={() => onSelect('ONLINE')}
          className="group p-8 bg-white border-4 border-slate-100 rounded-[2rem] hover:border-emerald-500 transition-all text-left shadow-xl hover:shadow-emerald-100"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:bg-emerald-500 group-hover:scale-110 transition-all">🌐</div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Online Duel</h3>
          <p className="text-slate-500 text-sm">Challenge a friend or join a room worldwide.</p>
        </button>
      </div>
    </div>
  );
};

export default ModeSelection;
