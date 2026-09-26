import React, { useState } from 'react';
import { Layers, Plus, Edit2, Trash2, CheckCircle2, Eye, X, Image, Sparkles } from 'lucide-react';
import { INITIAL_ADMIN_MODULES } from '../../data/adminData';

export default function ModuleManager() {
  const [modules, setModules] = useState(INITIAL_ADMIN_MODULES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    track: 'Inglês do Zero',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80',
    status: 'Publicado',
    order: modules.length + 1
  });

  const handleCreateModule = (e) => {
    e.preventDefault();
    if (!formData.title) return;

    const newMod = {
      id: `mod-${Date.now()}`,
      order: modules.length + 1,
      title: formData.title,
      description: formData.description || 'Descrição do módulo de aprendizado.',
      image: formData.image,
      lessonsCount: 0,
      songsCount: 0,
      status: formData.status,
      track: formData.track
    };

    setModules([newMod, ...modules]);
    setIsModalOpen(false);
    setFormData({
      title: '',
      description: '',
      track: 'Inglês do Zero',
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80',
      status: 'Publicado',
      order: modules.length + 2
    });
  };

  const handleDelete = (id) => {
    setModules(modules.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f243c]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">
            Estrutura de Conteúdo
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" />
            <span>Gerenciamento de Módulos</span>
          </h2>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Criar Módulo</span>
        </button>
      </div>

      {/* Modules Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod, idx) => (
          <div
            key={mod.id}
            className="p-5 rounded-2xl bg-[#111425] border border-[#1e233b] hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 group shadow-xl"
          >
            <div className="space-y-3">
              {/* Cover Banner */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800">
                <img
                  src={mod.image}
                  alt={mod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-black/60 text-purple-300 font-mono text-xs font-bold border border-purple-500/30">
                  Ordem: #{mod.order || idx + 1}
                </span>

                <span className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  mod.status === 'Publicado'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {mod.status}
                </span>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-xs text-slate-300 font-semibold">
                  Trilha: {mod.track}
                </div>
              </div>

              {/* Info */}
              <div>
                <h3 className="text-base font-black text-white truncate">
                  {mod.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              {/* Metrics */}
              <div className="pt-3 border-t border-[#1e2338] flex items-center justify-between text-xs text-slate-400">
                <span>{mod.lessonsCount} aulas cadastradas</span>
                <span>{mod.songsCount} músicas SSOT</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1e2338]">
              <button
                onClick={() => handleDelete(mod.id)}
                className="p-2 rounded-lg bg-[#191d30] text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                title="Excluir Módulo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Criar Módulo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#111425] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f243c]">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <span>+ Novo Módulo de Aprendizado</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#191d30] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Nome do Módulo:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Inglês para Viagens"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Descrição:
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva as situações e objetivos deste módulo..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl p-3 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Trilha Relacionada:
                  </label>
                  <select
                    value={formData.track}
                    onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="Inglês do Zero">Inglês do Zero</option>
                    <option value="Inglês para Viagens">Inglês para Viagens</option>
                    <option value="Inglês para Trabalho">Inglês para Trabalho</option>
                    <option value="Conversação">Conversação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Status:
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="Publicado">Publicado</option>
                    <option value="Rascunho">Rascunho</option>
                    <option value="Em Breve">Em Breve</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  URL da Capa / Banner (3:4 ou 16:9):
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#161a2e] text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  Salvar Módulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
