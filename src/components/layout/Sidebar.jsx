import React from 'react';
import { 
  Home, 
  Tv, 
  Compass, 
  Music, 
  BookOpen, 
  Mic, 
  Award, 
  Trophy,
  Users,
  User, 
  Settings, 
  Sparkles,
  LogOut
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const mainMenuItems = [
    { id: 'home', label: 'Início', icon: Home, badge: null },
    { id: 'classes', label: 'Minhas Aulas', icon: Tv, badge: 'Principal' },
    { id: 'tracks', label: 'Trilhas', icon: Compass, badge: null },
    { id: 'songs', label: 'Magic Songs', icon: Music, badge: 'Fixação' },
    { id: 'materials', label: 'Materiais', icon: BookOpen, badge: null },
    { id: 'pronunciation', label: 'Pronúncia', icon: Mic, badge: 'IA' },
    { id: 'achievements', label: 'Conquistas', icon: Award, badge: null },
    { id: 'ranking', label: 'Ranking', icon: Trophy, badge: null },
    { id: 'community', label: 'Comunidade', icon: Users, badge: null },
  ];

  const bottomMenuItems = [
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a0c16] border-r border-[#1a1e32] h-screen sticky top-0 flex flex-col justify-between p-5 select-none z-30 transition-all duration-300">
      
      {/* Top Section: Brand Logo & Navigation */}
      <div className="space-y-6">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 py-1 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-purple-600/30">
            <div className="w-full h-full bg-[#0c0e17] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
                Magic<span className="text-purple-400">English</span>
              </span>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/70">
              Aulas em Vídeo & Fixação
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Menu Principal
          </p>

          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 group relative cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/25 to-blue-600/10 text-white border border-purple-500/50 shadow-lg shadow-purple-500/15'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-purple-500 to-blue-500 rounded-r-full shadow-md shadow-purple-500/80" />
                  )}
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      item.badge === 'Principal'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : item.badge === 'Fixação'
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                        : item.badge === 'Top 5%'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-extrabold'
                        : item.badge === '12.5k'
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25 font-bold'
                        : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Profile, Settings, Logout */}
      <div className="space-y-1.5 pt-3 border-t border-[#1a1e32]">
        {bottomMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da conta</span>
        </button>
      </div>

    </aside>
  );
}
