import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Layers, 
  Tv, 
  Music, 
  FileText, 
  Mic, 
  Brain, 
  Trophy, 
  Users, 
  Settings, 
  ArrowLeft,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export default function AdminSidebar({
  activeTab = 'dashboard',
  setActiveTab,
  onReturnToPlatform
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Cursos & Trilhas', icon: BookOpen },
    { id: 'modules', label: 'Módulos', icon: Layers, badge: '6' },
    { id: 'lessons', label: 'Aulas', icon: Tv, badge: '32' },
    { id: 'songs', label: 'Músicas (SSOT)', icon: Music, badge: 'Auto' },
    { id: 'materials', label: 'Materiais PDF', icon: FileText },
    { id: 'pronunciation', label: 'Pronúncia (IA)', icon: Mic },
    { id: 'practice', label: 'Prática Musical', icon: Brain },
    { id: 'gamification', label: 'Gamificação & XP', icon: Trophy },
    { id: 'students', label: 'Alunos', icon: Users, badge: '1.2k' },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#070810] border-r border-[#1a1e32] h-screen sticky top-0 flex flex-col justify-between p-5 select-none z-40 transition-all">
      
      {/* Top Section: Brand & Navigation */}
      <div className="space-y-6">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-amber-400 p-[2px] shadow-lg shadow-purple-600/30">
            <div className="w-full h-full bg-[#0c0e17] rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                Magic<span className="text-purple-400">Admin</span>
              </span>
              <span className="text-[9px] font-mono uppercase font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                PRO
              </span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400">
              Painel de Gestão & SSOT
            </p>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
            Gestão de Conteúdo
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 group relative cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/20 text-white border border-purple-500/50 shadow-md shadow-purple-950/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#131627]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-purple-500 to-amber-400 rounded-r-full" />
                  )}
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-purple-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#181c30] text-purple-300 border border-purple-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Action: Return to Student Platform */}
      <div className="pt-3 border-t border-[#1a1e32]">
        <button
          onClick={onReturnToPlatform}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-200 bg-[#121526] hover:bg-purple-600 hover:text-white border border-[#222842] hover:border-purple-500/50 transition-all cursor-pointer shadow-lg group"
        >
          <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
          <span>Visão do Aluno (Plataforma)</span>
        </button>
      </div>

    </aside>
  );
}
