import React from 'react';
import { Sparkles, Music2 } from 'lucide-react';

export default function MagicLoadingScreen({ message = 'Carregando experiência mágica...' }) {
  return (
    <div className="w-full min-h-[380px] flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center mb-6">
        {/* Ambient Glows */}
        <div className="absolute w-24 h-24 bg-purple-600/30 rounded-full blur-2xl animate-pulse" />
        <div className="absolute w-20 h-20 bg-cyan-500/20 rounded-full blur-xl animate-pulse delay-150" />

        {/* Outer Rotating Glowing Ring */}
        <div className="w-16 h-16 rounded-full border-2 border-transparent border-t-purple-500 border-r-cyan-400 border-b-indigo-500 animate-spin" />

        {/* Center Glowing Logo / Icon */}
        <div className="absolute w-10 h-10 rounded-2xl bg-[#121526] border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-600/30">
          <Music2 className="w-5 h-5 text-purple-400 animate-bounce" />
        </div>
      </div>

      {/* Loading Status Text */}
      <div className="space-y-1.5 max-w-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>Magic English</span>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-slate-300">
          {message}
        </p>
      </div>
    </div>
  );
}
