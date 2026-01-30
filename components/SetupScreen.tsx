
import React from 'react';

interface SetupScreenProps {
  onSelect: (count: 3 | 4) => void;
  onBack: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onSelect, onBack }) => {
  return (
    <div className="p-8">
      <button 
        onClick={onBack}
        className="mb-8 text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-semibold text-sm">Back</span>
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Difficulty</h2>
      <p className="text-gray-500 mb-8 font-medium">How many digits should the secret code have?</p>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => onSelect(3)}
          className="group relative bg-white border-2 border-gray-100 hover:border-indigo-200 p-6 rounded-2xl transition-all duration-200 text-left hover:shadow-lg"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-800">3 Digits</h3>
              <p className="text-gray-500 text-sm">Easier for beginners</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              3
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelect(4)}
          className="group relative bg-white border-2 border-gray-100 hover:border-indigo-200 p-6 rounded-2xl transition-all duration-200 text-left hover:shadow-lg"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-800">4 Digits</h3>
              <p className="text-gray-500 text-sm">Pro level challenge</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              4
            </div>
          </div>
        </button>
      </div>

      <div className="mt-12 bg-blue-50 p-4 rounded-xl border border-blue-100">
        <h4 className="text-blue-800 font-bold text-xs uppercase tracking-widest mb-2">Game Rule</h4>
        <p className="text-blue-700 text-sm italic">
          "The secret code can contain any combination of digits. Repeating digits are allowed!"
        </p>
      </div>
    </div>
  );
};

export default SetupScreen;
