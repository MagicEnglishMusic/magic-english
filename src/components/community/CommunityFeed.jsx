import React, { useState } from 'react';
import { Sparkles, Trophy, Flame, Award, Filter, Send, MessageSquare, AlertCircle } from 'lucide-react';
import CommunityPost from './CommunityPost';

export default function CommunityFeed({ 
  posts = [], 
  onCreatePost, 
  isPostingEnabled = true, 
  user 
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'achievements' | 'modules' | 'streaks'
  const [newContent, setNewContent] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [postType, setPostType] = useState('achievement');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onCreatePost) {
        await onCreatePost({
          title: newTitle.trim() || 'Minha Conquista no Magic English',
          content: newContent.trim(),
          type: postType
        });
        setNewContent('');
        setNewTitle('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (filter === 'achievements') return post.type === 'achievement';
    if (filter === 'modules') return post.type === 'module_completed';
    if (filter === 'streaks') return post.type === 'streak';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Post Creation Box (If enabled) OR Maintenance Card */}
      {isPostingEnabled ? (
        <form onSubmit={handleSubmit} className="p-5 rounded-3xl bg-[#111426] border border-[#1e233b] space-y-3 shadow-xl">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'}
              alt="Avatar"
              className="w-10 h-10 rounded-2xl object-cover ring-2 ring-purple-500/30 flex-shrink-0"
            />
            <input
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Compartilhe seu progresso, uma música dominada ou dica de inglês..."
              className="flex-1 bg-[#161a2e] border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPostType('achievement')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  postType === 'achievement' ? 'bg-purple-600 text-white' : 'text-slate-400 bg-slate-800/40 hover:text-white'
                }`}
              >
                🏆 Conquista
              </button>
              <button
                type="button"
                onClick={() => setPostType('streak')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  postType === 'streak' ? 'bg-amber-600 text-white' : 'text-slate-400 bg-slate-800/40 hover:text-white'
                }`}
              >
                🔥 Sequência
              </button>
            </div>

            <button
              type="submit"
              disabled={!newContent.trim() || isSubmitting}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Publicando...' : 'Publicar'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1a142e] via-[#121528] to-[#0c0e1a] border border-amber-500/40 shadow-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                Aviso da Comunidade
              </span>
              <h4 className="text-base font-bold text-white">
                Comunidade em Manutenção Programada
              </h4>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-13">
            Estamos preparando novidades imperdíveis: novos desafios musicais, salas temáticas de conversação e eventos ao vivo! Novas publicações estão temporariamente pausadas. O feed completo volta em breve.
          </p>
        </div>
      )}

      {/* Feed Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1c2035]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">
            Feed em Tempo Real
          </span>
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Evolução da Comunidade</span>
          </h3>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tudo' },
            { id: 'achievements', label: '🏆 Conquistas' },
            { id: 'modules', label: '✈️ Módulos' },
            { id: 'streaks', label: '🔥 Sequências' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === f.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-[#121526] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Stream */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#111425] border border-dashed border-[#1e233b] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Nenhuma atividade recente na comunidade</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Seja o primeiro a praticar uma música, assistir a uma aula ou conquistar um marco para compartilhar sua evolução com os outros alunos!
              </p>
            </div>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <CommunityPost key={post.id} post={post} user={user} isMaintenance={!isPostingEnabled} />
          ))
        )}
      </div>
    </div>
  );
}
