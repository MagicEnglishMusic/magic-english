import React from 'react';

export default function ProgressBar({ value = 0, max = 100, showLabel = true, label = 'Progresso', size = 'md' }) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className="w-full space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-slate-300">{label}</span>
          <span className="font-bold text-white">{percentage}% concluído</span>
        </div>
      )}
      <div className={`w-full bg-[#161a2c] ${heightClasses[size] || 'h-2'} rounded-full overflow-hidden p-[1px]`}>
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-700 shadow-sm shadow-purple-500/50"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
