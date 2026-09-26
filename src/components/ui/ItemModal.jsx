import React from 'react';
import { X, Play, Music, Sparkles, Clock, Headphones, CheckCircle2 } from 'lucide-react';

export default function ItemModal({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#121522] border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/30">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cover / Header */}
        {item.image ? (
          <div className="relative h-48 w-full">
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121522] via-black/40 to-transparent"></div>
            <div className="absolute bottom-4 left-6">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-600 text-white">
                {item.level || item.category || 'Música'}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-28 bg-gradient-to-r from-purple-900/60 to-blue-900/60 flex items-center px-6">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-2xl font-black text-white">{item.title}</h3>
            <p className="text-sm text-slate-400 mt-1">
              {item.subtitle || item.description || item.category}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#181d2f] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Music className="w-4 h-4 text-purple-400" />
                Player de Áudio & Letra Sincronizada
              </span>
              <span className="text-purple-400 font-semibold">Pronto</span>
            </div>
            <p className="text-xs text-slate-400">
              Na próxima etapa, este card carregará o áudio original, letra interativa com karaokê e repetições guiadas.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm shadow-lg shadow-purple-600/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Iniciar Sessão Musical</span>
            </button>
            <button
              onClick={onClose}
              className="py-3 px-5 rounded-xl bg-[#1c2033] hover:bg-[#252a42] text-slate-300 text-sm font-semibold transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
