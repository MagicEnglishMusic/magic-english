import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, CheckCircle2, Eye, X, Image, Sparkles, FolderPlus, Tv, GripVertical, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { modulesService } from '../../services/modulesService';
import { isGoogleDriveUrl, getDriveImageUrl } from '../../utils/googleDriveHelper';

export default function ModuleManager({ onManageLessons }) {
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    track: 'Inglês do Zero',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80',
    status: 'Rascunho',
    order: 1
  });

  useEffect(() => {
    async function fetchModules() {
      setIsLoading(true);
      try {
        const { data } = await modulesService.getModules();
        if (data) {
          const formatted = data.map((m, idx) => ({
            id: m.id,
            order: m.order_index || m.order || idx + 1,
            title: m.title || 'Módulo Sem Nome',
            description: m.description || '',
            image: getDriveImageUrl(m.banner_url || m.image || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80'),
            lessonsCount: m.lessons_count || m.lessonsCount || 0,
            songsCount: m.songs_count || m.songsCount || 0,
            status: m.status === 'published' ? 'Publicado' : (m.status === 'coming_soon' ? 'Em Breve' : 'Rascunho'),
            isVisible: m.is_visible !== false,
            track: m.track || 'Inglês do Zero'
          }));
          setModules(formatted);
          setFormData((prev) => ({ ...prev, order: formatted.length + 1 }));
        }
      } catch (err) {
        console.warn('Error fetching modules:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchModules();
  }, []);

  // Independent ON/OFF Visibility Toggle
  const handleToggleVisibility = async (moduleId) => {
    if (updatingVisibilityId) return;

    const targetModule = modules.find((m) => m.id === moduleId);
    if (!targetModule) return;

    const newVisibility = !targetModule.isVisible;
    const previousModules = [...modules];

    // Optimistic UI update
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, isVisible: newVisibility } : m))
    );
    setUpdatingVisibilityId(moduleId);
    setSaveStatus({
      type: 'saving',
      message: `${newVisibility ? 'Ativando' : 'Desativando'} visibilidade do módulo...`
    });

    try {
      const res = await modulesService.updateModule(moduleId, { is_visible: newVisibility });
      if (res?.error) {
        throw new Error(res.error);
      }
      setSaveStatus({
        type: 'success',
        message: `Módulo ${newVisibility ? 'LIGADO (Visível)' : 'DESLIGADO (Oculto)'} com sucesso!`
      });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Falha ao alternar visibilidade do módulo:', err);
      setModules(previousModules);
      setSaveStatus({ type: 'error', message: 'Erro ao salvar visibilidade no servidor.' });
      setTimeout(() => setSaveStatus(null), 4000);
    } finally {
      setUpdatingVisibilityId(null);
    }
  };

  // Quick change module publication status (published, coming_soon, draft)
  const handleStatusChange = async (moduleId, newStatusLabel) => {
    if (updatingStatusId) return;

    const statusMap = {
      'Publicado': 'published',
      'Em Breve': 'coming_soon',
      'Rascunho': 'draft'
    };
    const dbStatus = statusMap[newStatusLabel] || 'draft';

    const previousModules = [...modules];
    // Optimistic UI update
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, status: newStatusLabel } : m))
    );
    setUpdatingStatusId(moduleId);
    setSaveStatus({ type: 'saving', message: `Atualizando status para "${newStatusLabel}"...` });

    try {
      const res = await modulesService.updateModule(moduleId, { status: dbStatus });
      if (res?.error) {
        throw new Error(res.error);
      }
      setSaveStatus({ type: 'success', message: `Status alterado para "${newStatusLabel}" com sucesso!` });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Falha ao atualizar status do módulo:', err);
      // Revert optimistic state
      setModules(previousModules);
      setSaveStatus({ type: 'error', message: 'Erro ao salvar novo status no servidor.' });
      setTimeout(() => setSaveStatus(null), 4000);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Reorder modules with optimistic update and resilient server rollback
  const reorderModules = async (fromIndex, toIndex) => {
    if (fromIndex === toIndex || isSavingOrder) return;
    if (fromIndex < 0 || fromIndex >= modules.length || toIndex < 0 || toIndex >= modules.length) return;

    const previousModules = [...modules];
    const updated = [...modules];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);

    // Recalculate 1-based order
    const reorderedWithNumbers = updated.map((m, idx) => ({
      ...m,
      order: idx + 1
    }));

    // 1. Optimistic update in UI
    setModules(reorderedWithNumbers);
    setIsSavingOrder(true);
    setSaveStatus({ type: 'saving', message: 'Salvando nova ordem...' });

    // 2. Persist to Supabase
    try {
      const res = await modulesService.updateModulesOrder(reorderedWithNumbers);
      if (res?.success) {
        setSaveStatus({ type: 'success', message: 'Ordem salva com sucesso!' });
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        throw new Error(res?.error || 'Erro ao persistir ordem no banco');
      }
    } catch (err) {
      console.error('Falha ao salvar ordem de módulos:', err);
      // Rollback to previous state
      setModules(previousModules);
      setSaveStatus({ type: 'error', message: 'Falha ao salvar no servidor. Ordem revertida.' });
      setTimeout(() => setSaveStatus(null), 5000);
    } finally {
      setIsSavingOrder(false);
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  };

  // Drag & Drop Event Handlers
  const handleDragStart = (e, idx) => {
    if (isSavingOrder) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== idx) {
      setDragOverIndex(idx);
    }
  };

  const handleDragEnter = (e, idx) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };

  const handleDrop = (e, toIdx) => {
    e.preventDefault();
    const fromIdx = draggedIndex !== null ? draggedIndex : parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(fromIdx) && fromIdx !== toIdx) {
      reorderModules(fromIdx, toIdx);
    } else {
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Accessible Reorder Controls (Mobile / Keyboard)
  const handleMoveUp = (idx) => {
    if (idx > 0 && !isSavingOrder) {
      reorderModules(idx, idx - 1);
    }
  };

  const handleMoveDown = (idx) => {
    if (idx < modules.length - 1 && !isSavingOrder) {
      reorderModules(idx, idx + 1);
    }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!formData.title) return;

    const formattedBanner = isGoogleDriveUrl(formData.image)
      ? getDriveImageUrl(formData.image)
      : formData.image;

    const statusMap = {
      'Publicado': 'published',
      'Em Breve': 'coming_soon',
      'Rascunho': 'draft'
    };
    const dbStatus = statusMap[formData.status] || 'draft';

    const payload = {
      title: formData.title,
      description: formData.description || '',
      banner_url: formattedBanner,
      order_index: modules.length + 1,
      status: dbStatus,
      is_visible: true,
      lessons_count: 0,
      songs_count: 0
    };

    const res = await modulesService.createModule(payload);
    const newMod = {
      id: res.data?.id || `mod-${Date.now()}`,
      order: modules.length + 1,
      title: formData.title,
      description: formData.description || '',
      image: formattedBanner,
      lessonsCount: 0,
      songsCount: 0,
      status: formData.status,
      isVisible: true,
      track: formData.track
    };

    setModules([newMod, ...modules]);
    setIsModalOpen(false);
    setFormData({
      title: '',
      description: '',
      track: 'Inglês do Zero',
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80',
      status: 'Rascunho',
      order: modules.length + 2
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este módulo? Esta ação não pode ser desfeita.')) {
      return;
    }
    const res = await modulesService.deleteModule(id);
    if (res?.error) {
      alert(`Erro ao excluir módulo: ${res.error}`);
      return;
    }
    setModules((prev) => prev.filter((m) => m.id !== id));
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
          <p className="text-xs text-slate-400 mt-1">
            Arraste os cards para reorganizar a ordem visual exibida para os alunos, ou use as setas de ordenação.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {/* Order Saving Status Indicator */}
          {saveStatus && (
            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              saveStatus.type === 'saving'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
                : saveStatus.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {saveStatus.type === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
              {saveStatus.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {saveStatus.type === 'error' && <X className="w-3.5 h-3.5 text-rose-400" />}
              <span>{saveStatus.message}</span>
            </div>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Criar Módulo</span>
          </button>
        </div>
      </div>

      {/* Modules Grid / Cards */}
      {modules.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {modules.map((mod, idx) => {
            const isBeingDragged = draggedIndex === idx;
            const isDropTarget = dragOverIndex === idx && draggedIndex !== idx;

            return (
              <div
                key={mod.id}
                draggable={!isSavingOrder}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnter={(e) => handleDragEnter(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`p-4 rounded-2xl bg-[#111425] border transition-all flex flex-col justify-between space-y-4 group shadow-xl ${
                  isBeingDragged
                    ? 'opacity-40 scale-95 border-dashed border-cyan-500/70'
                    : isDropTarget
                      ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-500/60 scale-[1.02] shadow-cyan-500/25'
                      : 'border-[#1e233b] hover:border-purple-500/40'
                } ${isSavingOrder ? 'cursor-wait' : 'cursor-grab active:cursor-grabbing'}`}
              >
                <div className="space-y-3">
                  {/* Top Card Bar: [ARRASTAR] [ON/OFF] [STATUS ▼] [▲] [▼] */}
                  <div className="flex items-center justify-between gap-1 pb-1 text-slate-400">
                    {/* Drag Handle */}
                    <div 
                      className="flex items-center gap-1 text-slate-400 group-hover:text-cyan-300 transition-colors cursor-grab"
                      title="Clique e arraste para reordenar a sequência de módulos"
                    >
                      <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider select-none hidden xl:inline">
                        Arrastar
                      </span>
                    </div>

                    {/* Independent ON/OFF Visibility Switch */}
                    <button
                      type="button"
                      disabled={updatingVisibilityId === mod.id || isSavingOrder}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibility(mod.id);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1 select-none shadow-sm ${
                        mod.isVisible
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40'
                          : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/50 shadow-rose-950/40'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={mod.isVisible ? 'Módulo LIGADO (Ativo). Clique para DESLIGAR e ocultar dos alunos.' : 'Módulo DESLIGADO (Oculto). Clique para LIGAR e liberar visibilidade.'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${mod.isVisible ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                      <span>{mod.isVisible ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* Quick Status Selector: [STATUS ▼] */}
                    <div className="flex-1 max-w-[125px]">
                      <select
                        value={mod.status}
                        disabled={updatingStatusId === mod.id || isSavingOrder}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(mod.id, e.target.value);
                        }}
                        className={`w-full text-[11px] font-black rounded-lg px-2 py-1 border transition-all cursor-pointer focus:outline-none ${
                          mod.status === 'Publicado'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/90'
                            : mod.status === 'Em Breve'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 hover:bg-amber-900/90'
                              : 'bg-slate-800/90 text-slate-300 border-slate-600/50 hover:bg-slate-700/90'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Alterar status pedagógico do módulo (Publicado, Em Breve, Rascunho)"
                      >
                        <option value="Publicado">🟢 Publicado</option>
                        <option value="Em Breve">🟡 Em Breve</option>
                        <option value="Rascunho">⚪ Rascunho</option>
                      </select>
                    </div>

                    {/* Accessible Up / Down Buttons for Mobile & Keyboard */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMoveUp(idx); }}
                        disabled={idx === 0 || isSavingOrder}
                        className="p-1 rounded-lg bg-[#191d30] hover:bg-cyan-600/30 text-slate-400 hover:text-cyan-300 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                        title="Mover para cima (Ordem anterior)"
                        aria-label="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMoveDown(idx); }}
                        disabled={idx === modules.length - 1 || isSavingOrder}
                        className="p-1 rounded-lg bg-[#191d30] hover:bg-cyan-600/30 text-slate-400 hover:text-cyan-300 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                        title="Mover para baixo (Próxima ordem)"
                        aria-label="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Cover Banner (9:16 aspect ratio) */}
                  <div className="relative aspect-[9/16] w-full rounded-xl overflow-hidden border border-slate-800 bg-[#0c0e1a]">
                    <img
                      src={mod.image}
                      alt={mod.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80';
                      }}
                      className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 pointer-events-none ${
                        !mod.isVisible ? 'grayscale-[50%] brightness-75' : ''
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-black/75 text-cyan-300 font-mono text-xs font-black border border-cyan-500/40 shadow-md">
                      Ordem: #{mod.order || idx + 1}
                    </span>

                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      {!mod.isVisible && (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-500/50 shadow-md">
                          OFF (Oculto)
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md ${
                        mod.status === 'Publicado'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : mod.status === 'Em Breve'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-700/40 text-slate-300 border border-slate-500/40'
                      }`}>
                        {mod.status}
                      </span>
                    </div>

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
                <div className="pt-3 flex items-center justify-between gap-2 border-t border-[#1e2338]">
                  <button
                    type="button"
                    onClick={() => onManageLessons && onManageLessons(mod.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 hover:border-purple-500/50 text-xs font-bold transition-all cursor-pointer shadow-sm group/btn"
                    title="Gerenciar Aulas deste Módulo"
                  >
                    <Tv className="w-3.5 h-3.5 text-purple-400 group-hover/btn:scale-110 transition-transform" />
                    <span>Gerenciar Aulas</span>
                  </button>

                  <button
                    onClick={() => handleDelete(mod.id)}
                    className="p-2 rounded-lg bg-[#191d30] text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    title="Excluir Módulo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-[#111425] border border-[#1e233b] shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 mx-auto">
            <Layers className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-white">Nenhum módulo cadastrado</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Comece criando o primeiro módulo de aprendizado para estruturar as aulas e músicas do curso.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Criar Primeiro Módulo</span>
          </button>
        </div>
      )}

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
