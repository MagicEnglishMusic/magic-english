import React, { useState } from 'react';
import { Trophy, Zap, Plus, Award, Target, Sparkles, CheckCircle2, Flame, X } from 'lucide-react';
import { XP_REWARDS, INITIAL_BADGES, INITIAL_DAILY_CHALLENGES } from '../../data/gamificationData';

export default function GamificationManager() {
  const [xpRewards, setXpRewards] = useState(XP_REWARDS);
  const [badges, setBadges] = useState(INITIAL_BADGES);
  const [challenges, setChallenges] = useState(INITIAL_DAILY_CHALLENGES);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [newBadge, setNewBadge] = useState({
    title: '',
    icon: '🏆',
    condition: '',
    rewardXp: 100,
    category: 'Música'
  });

  const handleUpdateReward = (key, val) => {
    setXpRewards({
      ...xpRewards,
      [key]: parseInt(val, 10) || 0
    });
  };

  const handleSaveXpSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCreateBadge = (e) => {
    e.preventDefault();
    if (!newBadge.title) return;

    const created = {
      id: `badge-${Date.now()}`,
      title: newBadge.title,
      icon: newBadge.icon,
      condition: newBadge.condition,
      rewardXp: newBadge.rewardXp,
      category: newBadge.category,
      unlocked: true,
      unlockedAt: 'Hoje'
    };

    setBadges([created, ...badges]);
    setIsBadgeModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f243c]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
            Regras de Engajamento
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Configurações de Gamificação & Recompensas Magic XP</span>
          </h2>
        </div>

        <button
          onClick={() => setIsBadgeModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Criar Nova Conquista (Badge)</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Regras de XP atualizadas com sucesso para toda a plataforma!</span>
        </div>
      )}

      {/* 1. XP Rewards Table */}
      <div className="p-6 rounded-3xl bg-[#111425] border border-[#1e233b] space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              Tabela de Recompensas Magic XP
            </h3>
            <p className="text-xs text-slate-400">
              Ajuste a pontuação atribuída a cada ação completada pelos alunos.
            </p>
          </div>
          <button
            onClick={handleSaveXpSettings}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold cursor-pointer shadow-md"
          >
            Salvar Valores de XP
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {Object.entries(xpRewards).map(([key, val]) => (
            <div key={key} className="p-4 rounded-2xl bg-[#141728] border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {key.replace(/_/g, ' ')}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-black text-sm">+</span>
                <input
                  type="number"
                  value={val}
                  onChange={(e) => handleUpdateReward(key, e.target.value)}
                  className="w-24 bg-[#1b1f35] border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono font-bold text-sm"
                />
                <span className="text-xs text-slate-400 font-semibold">XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Badges List */}
      <div className="p-6 rounded-3xl bg-[#111425] border border-[#1e233b] space-y-4 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400" />
          Medalhas Cadastradas ({badges.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((b) => (
            <div key={b.id} className="p-4 rounded-2xl bg-[#141728] border border-slate-800/80 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#1b1f35] border border-slate-700 flex items-center justify-center text-2xl">
                {b.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-black text-white truncate">{b.title}</h4>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded">
                    +{b.rewardXp} XP
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{b.condition}</p>
                <span className="text-[10px] text-purple-300 font-semibold">{b.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Criar Badge */}
      {isBadgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#111425] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f243c]">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                <span>+ Criar Conquista (Badge)</span>
              </h3>
              <button
                onClick={() => setIsBadgeModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#191d30] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBadge} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Título da Conquista:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mestre do Ritmo"
                  value={newBadge.title}
                  onChange={(e) => setNewBadge({ ...newBadge, title: e.target.value })}
                  className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-4 py-2.5 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Ícone (Emoji):
                  </label>
                  <input
                    type="text"
                    value={newBadge.icon}
                    onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-lg text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Recompensa XP:
                  </label>
                  <input
                    type="number"
                    value={newBadge.rewardXp}
                    onChange={(e) => setNewBadge({ ...newBadge, rewardXp: parseInt(e.target.value, 10) || 50 })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Condição para Desbloqueio:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dominar 15 músicas completas"
                  value={newBadge.condition}
                  onChange={(e) => setNewBadge({ ...newBadge, condition: e.target.value })}
                  className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-4 py-2 text-white text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBadgeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#161a2e] text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  Salvar Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
