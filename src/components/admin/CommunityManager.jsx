import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Trash2, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Power, 
  Search, 
  Filter, 
  Heart, 
  MessageCircle, 
  ShieldAlert, 
  User, 
  Layers, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { communityService } from '../../services/communityService.js';

export default function CommunityManager() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [settings, setSettings] = useState(() => communityService.getCommunitySettings());
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'post' | 'comment', postId, commentId, title }
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const { data } = await communityService.getPosts();
      setPosts(data || []);
    } catch (err) {
      console.warn('Error loading posts for admin moderation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();

    // Subscribe to real-time changes
    const unsubFeed = communityService.subscribeToFeed((event) => {
      if (event.type === 'post_created' && event.post) {
        setPosts((prev) => [event.post, ...prev.filter((p) => p.id !== event.post.id)]);
      } else if (event.type === 'post_deleted' && event.postId) {
        setPosts((prev) => prev.filter((p) => p.id !== event.postId));
      } else if (event.type === 'comment_added' && event.postId && event.comment) {
        setPosts((prev) => prev.map((p) => {
          if (p.id === event.postId) {
            const list = (p.commentsList || []).filter((c) => c.id !== event.comment.id);
            return {
              ...p,
              comments: list.length + 1,
              commentsList: [...list, event.comment]
            };
          }
          return p;
        }));
      } else if (event.type === 'comment_deleted' && event.postId && event.commentId) {
        setPosts((prev) => prev.map((p) => {
          if (p.id === event.postId) {
            const list = (p.commentsList || []).filter((c) => c.id !== event.commentId);
            return {
              ...p,
              comments: list.length,
              commentsList: list
            };
          }
          return p;
        }));
      }
    });

    const unsubSettings = communityService.subscribeToSettings((newSettings) => {
      setSettings(newSettings);
    });

    return () => {
      unsubFeed();
      unsubSettings();
    };
  }, []);

  const handleToggleCommunityStatus = async () => {
    const nextEnabled = !settings.isPostingEnabled;
    const updated = {
      isPostingEnabled: nextEnabled,
      status: nextEnabled ? 'active' : 'maintenance',
      maintenanceMessage: nextEnabled ? '' : 'O mural da comunidade está em manutenção temporária.'
    };
    setSettings(updated);
    await communityService.updateCommunitySettings(updated);
    showToast(
      nextEnabled 
        ? 'Comunidade reativada (Status: active)! Alunos podem publicar normalmente.' 
        : 'Comunidade colocada em Manutenção (Status: maintenance)! Ações bloqueadas para todos os alunos.',
      nextEnabled ? 'success' : 'info'
    );
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'post') {
      const postId = deleteTarget.postId;
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      await communityService.deletePost(postId);
      showToast('Publicação excluída com sucesso da Comunidade e do banco de dados!');
    } else if (deleteTarget.type === 'comment') {
      const { postId, commentId } = deleteTarget;
      setPosts((prev) => prev.map((p) => {
        if (p.id === postId) {
          const list = (p.commentsList || []).filter((c) => c.id !== commentId);
          return { ...p, comments: list.length, commentsList: list };
        }
        return p;
      }));
      await communityService.deleteComment(postId, commentId);
      showToast('Comentário excluído com sucesso!');
    }

    setDeleteTarget(null);
  };

  const filteredPosts = posts.filter((post) => {
    const matchesType = filterType === 'all' || post.type === filterType;
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      !searchTerm ||
      (post.author?.name || '').toLowerCase().includes(term) ||
      (post.title || '').toLowerCase().includes(term) ||
      (post.content || '').toLowerCase().includes(term);

    return matchesType && matchesSearch;
  });

  const totalComments = posts.reduce((acc, p) => acc + (p.comments || (p.commentsList?.length || 0)), 0);
  const totalLikes = posts.reduce((acc, p) => acc + (p.likes || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#161a32] border border-purple-500/60 shadow-2xl text-white text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 max-w-md">
          <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* 1. Header Banner & Quick Controls */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#181c30] via-[#121526] to-[#0a0c16] border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              <span>Moderação & Controle da Comunidade</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Gerenciamento da Comunidade Magic English
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Monitore publicações, exclua conteúdos impróprios ou spam e alterne o status global da comunidade em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadPosts}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#171b30] hover:bg-[#202642] border border-[#262c4a] text-slate-200 text-xs font-bold cursor-pointer transition-all"
              title="Recarregar publicações"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={handleToggleCommunityStatus}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer shadow-lg ${
                settings.isPostingEnabled
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30 shadow-emerald-950/40'
                  : 'bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/30 shadow-amber-950/40'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>Status: {settings.isPostingEnabled ? 'Comunidade Aberta (Ativa)' : 'Em Manutenção (Fechada)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#141728] to-[#0c0e18] border border-purple-500/25 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total de Publicações</span>
            <p className="text-2xl font-black text-white">{posts.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#141728] to-[#0c0e18] border border-cyan-500/25 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total de Comentários</span>
            <p className="text-2xl font-black text-white">{totalComments}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#141728] to-[#0c0e18] border border-amber-500/25 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Parabéns / Palmas</span>
            <p className="text-2xl font-black text-white">{totalLikes}</p>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters */}
      <div className="p-4 rounded-2xl bg-[#111425] border border-[#1e233b] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por autor, título ou conteúdo do post..."
            className="w-full bg-[#161a2e] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'achievement', label: '🏆 Conquistas' },
            { id: 'streak', label: '🔥 Sequências' },
            { id: 'module_completed', label: '✈️ Módulos' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterType === f.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-[#161a2e] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Posts List with Moderation Actions */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center rounded-3xl bg-[#111425] border border-slate-800 text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-400" />
            <p className="text-sm font-bold">Carregando mural da comunidade...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#111425] border border-dashed border-[#1e233b] space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Nenhum post encontrado</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Nenhuma publicação corresponde aos filtros atuais.
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="p-5 sm:p-6 rounded-3xl bg-[#111426] border border-[#1e233b] hover:border-purple-500/40 transition-all space-y-4 shadow-xl"
            >
              {/* Post Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src={post.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'}
                    alt={post.author?.name}
                    className="w-10 h-10 rounded-2xl object-cover ring-2 ring-purple-500/30 flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{post.author?.name || 'Aluno'}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25">
                        {post.author?.level || 'Iniciante'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {post.timeAgo || 'Hoje'}
                    </span>
                  </div>
                </div>

                {/* Post Action Buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400 bg-[#161a2e] px-2.5 py-1 rounded-lg border border-slate-800">
                    👏 {post.likes || 0} palmas • 💬 {post.comments || (post.commentsList?.length || 0)} comentários
                  </span>

                  <button
                    onClick={() => setDeleteTarget({ type: 'post', postId: post.id, title: post.title || post.content })}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                    title="Excluir publicação da comunidade"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Excluir Post</span>
                  </button>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-4 rounded-2xl bg-[#161a2e] border border-[#222846] space-y-2">
                {post.title && (
                  <h5 className="text-sm font-bold text-purple-300">{post.title}</h5>
                )}
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {post.content || post.message}
                </p>
              </div>

              {/* Comments Section */}
              {(() => {
                const postComments = post.commentsList || post.comments_list || [];
                if (!Array.isArray(postComments) || postComments.length === 0) return null;

                return (
                  <div className="p-4 rounded-2xl bg-[#0d1020] border border-slate-800/80 space-y-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-800">
                      Comentários vinculados ({postComments.length})
                    </span>

                    <div className="space-y-2">
                      {postComments.map((c) => (
                        <div
                          key={c.id}
                          className="p-2.5 rounded-xl bg-[#141728] border border-slate-800 text-xs flex items-center justify-between gap-3 group/comm hover:border-slate-700"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <strong className="text-purple-300 font-bold">{c.author || 'Aluno'}</strong>
                              <span className="text-[10px] text-slate-500">{c.time || 'Hoje'}</span>
                            </div>
                            <p className="text-slate-200 mt-0.5">{c.text}</p>
                          </div>

                          <button
                            onClick={() => setDeleteTarget({ type: 'comment', postId: post.id, commentId: c.id, title: c.text })}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors cursor-pointer opacity-80 group-hover/comm:opacity-100 flex-shrink-0"
                            title="Excluir comentário individual"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </div>
          ))
        )}
      </div>

      {/* 5. Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#131628] border border-rose-500/40 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white">
                Confirmar Exclusão de {deleteTarget.type === 'post' ? 'Publicação' : 'Comentário'}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Você tem certeza que deseja excluir este {deleteTarget.type === 'post' ? 'post' : 'comentário'} permanentemente? Esta ação será refletida instantaneamente no feed de todos os alunos conectados.
            </p>

            <div className="p-3 rounded-xl bg-[#0c0e1a] border border-slate-800 text-xs text-slate-400 italic line-clamp-2">
              "{deleteTarget.title}"
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-[#1c223c] hover:bg-[#252c4e] text-slate-300 font-bold text-xs cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer transition-colors shadow-lg shadow-rose-600/30"
              >
                Sim, Excluir Agora
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
