import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Layers, 
  Tv, 
  Music, 
  Clock, 
  Plus, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Zap,
  FileText,
  Activity
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminDashboard({
  onNavigateTab
}) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalModules: 0,
    totalLessons: 0,
    totalSongs: 0,
    totalContentTime: '0h'
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [statsRes, actRes] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getRecentActivities()
        ]);
        if (statsRes?.data) setStats(statsRes.data);
        if (actRes?.data) setRecentActivities(actRes.data);
      } catch (err) {
        console.warn('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const totalStudents = Number(stats?.totalStudents) || 0;
  const totalModules = Number(stats?.totalModules) || 0;
  const totalLessons = Number(stats?.totalLessons) || 0;
  const totalSongs = Number(stats?.totalSongs) || 0;
  const totalContentTime = stats?.totalContentTime || '0h';

  const statCards = [
    {
      id: "students",
      label: "Total de Alunos",
      value: totalStudents.toLocaleString('pt-BR'),
      sub: totalStudents > 0 ? "Alunos cadastrados" : "Nenhum aluno cadastrado",
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/25",
      action: () => onNavigateTab('students')
    },
    {
      id: "modules",
      label: "Total de Módulos",
      value: totalModules,
      sub: totalModules > 0 ? `${totalModules} módulos ativos` : "Nenhum módulo criado",
      icon: Layers,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/25",
      action: () => onNavigateTab('modules')
    },
    {
      id: "lessons",
      label: "Total de Aulas",
      value: totalLessons,
      sub: totalLessons > 0 ? `${totalLessons} aulas cadastradas` : "Nenhuma aula cadastrada",
      icon: Tv,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/25",
      action: () => onNavigateTab('lessons')
    },
    {
      id: "songs",
      label: "Magic Songs",
      value: totalSongs,
      sub: totalSongs > 0 ? "Com distribuição SSOT" : "Nenhuma música cadastrada",
      icon: Music,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/25",
      action: () => onNavigateTab('songs')
    },
    {
      id: "time",
      label: "Tempo de Conteúdo",
      value: totalContentTime,
      sub: "Aulas em vídeo e áudio",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/25",
      action: () => onNavigateTab('lessons')
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Admin Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#181c30] via-[#121526] to-[#0a0c16] border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Painel Geral de Controle</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Área Administrativa Magic English
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Gerencie módulos, aulas, músicas e materiais com o padrão <strong>Cadastro Único → Distribuição Automática</strong>.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('songs')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-purple-600/30 cursor-pointer transition-all"
            >
              <Music className="w-4 h-4" />
              <span>+ Nova Música (SSOT)</span>
            </button>

            <button
              onClick={() => onNavigateTab('lessons')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#171b30] hover:bg-[#202642] border border-[#262c4a] text-slate-200 text-xs font-extrabold cursor-pointer transition-all"
            >
              <Tv className="w-4 h-4 text-purple-400" />
              <span>+ Criar Aula</span>
            </button>

            <button
              onClick={() => onNavigateTab('modules')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#171b30] hover:bg-[#202642] border border-[#262c4a] text-slate-200 text-xs font-extrabold cursor-pointer transition-all"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>+ Novo Módulo</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              onClick={stat.action}
              className={`p-5 rounded-2xl bg-gradient-to-b from-[#141728] to-[#0c0e18] border ${stat.border} hover:border-purple-500/50 transition-all cursor-pointer group shadow-lg flex flex-col justify-between space-y-3`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center ${stat.color} shadow-inner`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </span>
                <p className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                  {stat.value}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {stat.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Grid: Recent Activities & SSOT Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Activities (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#101222] border border-[#1e233b] space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f243c]">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Log do Sistema
              </span>
              <h3 className="text-base font-black text-white">
                Atividades Recentes
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Tempo real</span>
          </div>

          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-2xl bg-[#141728] border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#1b1f35] border border-slate-700 flex items-center justify-center text-lg flex-shrink-0">
                      {act.icon || '⚡'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                        {act.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {act.desc}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-slate-500 font-medium block">
                      {act.time}
                    </span>
                    <span className="text-[10px] text-purple-300 font-semibold bg-purple-500/10 px-2 py-0.2 rounded border border-purple-500/20">
                      {act.admin || 'Admin'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl bg-[#141728]/50 border border-slate-800/50 space-y-2">
                <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-400">
                  Nenhuma atividade recente registrada
                </p>
                <p className="text-[11px] text-slate-500">
                  As ações administrativas e novos cadastros aparecerão em tempo real aqui.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SSOT Engine Status (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-gradient-to-b from-[#15192e] to-[#0e1120] border border-purple-500/30 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
              <h3 className="text-base font-black text-white">
                Motor de Distribuição Automática
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              O Magic English opera em arquitetura de <strong>Fonte Única da Verdade</strong>. Ao cadastrar uma música, o sistema gera instantaneamente os dados para:
            </p>

            <ul className="space-y-2 pt-2 text-xs text-slate-300">
              <li className="flex items-center gap-2 bg-[#101322] p-2 rounded-xl border border-slate-800">
                <span className="text-emerald-400">✓</span> <strong>Aba Música:</strong> Player e Karaokê sincronizado
              </li>
              <li className="flex items-center gap-2 bg-[#101322] p-2 rounded-xl border border-slate-800">
                <span className="text-emerald-400">✓</span> <strong>Aba Pronúncia:</strong> Extração fonética automática
              </li>
              <li className="flex items-center gap-2 bg-[#101322] p-2 rounded-xl border border-slate-800">
                <span className="text-emerald-400">✓</span> <strong>Prática Musical:</strong> Tradução reversa PT $\rightarrow$ EN
              </li>
              <li className="flex items-center gap-2 bg-[#101322] p-2 rounded-xl border border-slate-800">
                <span className="text-emerald-400">✓</span> <strong>Materiais:</strong> Vínculo com PDFs de estudo
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-[#1e233b]">
            <button
              onClick={() => onNavigateTab('songs')}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Testar Cadastro de Música</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
