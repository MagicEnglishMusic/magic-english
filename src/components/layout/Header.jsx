import React, { useState } from 'react';
import { Search, Bell, Crown, ChevronDown, Flame, Volume2, Sparkles, Zap, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';

export default function Header({ onSearch, searchQuery, onOpenGamification }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();
  const { xp, streak, currentLevel } = useGamification();

  const studentName = user?.name || 'João Silva';
  const studentAvatar = user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';
  const displayLevelNumber = user?.levelNumber || currentLevel.level;
  const displayLevelTitle = user?.level?.includes('•') ? user.level.split('•')[1]?.trim() : currentLevel.title;

  const notifications = [
    {
      id: 1,
      title: '🎯 Desafio Diário pronto!',
      desc: 'Você assistiu a uma aula. Clique para resgatar +30 XP.',
      time: '5 min atrás',
      unread: true,
    },
    {
      id: 2,
      title: 'Parabéns pela Sequência! 🔥',
      desc: `Você atingiu ${streak} dias seguidos praticando.`,
      time: '2 horas atrás',
      unread: true,
    },
  ];

  return (
    <header className="sticky top-0 z-20 bg-[#08090e]/90 backdrop-blur-xl border-b border-[#1c2033] px-6 sm:px-8 py-4 flex items-center justify-between gap-4 sm:gap-6 transition-all">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch && onSearch(e.target.value)}
            placeholder="Buscar músicas, aulas, pronúncia ou trilhas..."
            className="w-full bg-[#121522] border border-[#22273d] text-slate-200 placeholder-slate-500 text-sm rounded-full pl-11 pr-12 py-2.5 focus:outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 absolute right-3.5 px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-[#1c2035] border border-slate-700/60 rounded">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right Controls: Magic XP, Streak, Notifications, User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        
        {/* ⭐ Magic XP Live Indicator */}
        <button
          onClick={onOpenGamification}
          title="Ver Minha Evolução & Conquistas"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 border border-amber-500/30 text-amber-300 text-xs font-black shadow-sm hover:border-amber-400 transition-all cursor-pointer group"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform animate-pulse" />
          <span>{xp.toLocaleString('pt-BR')} XP</span>
        </button>

        {/* 🔥 Streak Quick Indicator */}
        <button
          onClick={onOpenGamification}
          title="Sequência Diária"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold shadow-sm hover:border-amber-400 transition-all cursor-pointer"
        >
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
          <span>{streak} Dias</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-full bg-[#131625] border border-[#22273d] text-slate-300 hover:text-white hover:border-purple-500/40 transition-colors cursor-pointer"
            aria-label="Notificações"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full ring-2 ring-[#08090e] animate-pulse"></span>
          </button>

          {/* Notification Popup Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-[#121522] border border-[#242a42] rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#22273d] mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Notificações
                </span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                  2 Novas
                </span>
              </div>
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setShowNotifications(false);
                      onOpenGamification && onOpenGamification();
                    }}
                    className="p-2.5 rounded-xl bg-[#181d2f] hover:bg-[#1f253d] border border-transparent hover:border-purple-500/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-white">{n.title}</p>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div
          onClick={onOpenGamification}
          className="flex items-center gap-3 pl-2 border-l border-[#1f243a] cursor-pointer group"
        >
          <div className="relative">
            <img
              src={studentAvatar}
              alt={studentName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/50 group-hover:ring-purple-400 transition-all"
            />
            <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-500 to-amber-500 p-0.5 rounded-full text-white shadow-sm">
              <Crown className="w-2.5 h-2.5" />
            </span>
          </div>

          <div className="hidden lg:block text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition-colors">{studentName}</p>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                Nível {displayLevelNumber} • {displayLevelTitle}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
