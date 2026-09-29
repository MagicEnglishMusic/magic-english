import React, { useState, useEffect } from 'react';
import { Award, Trophy, Flame, Sparkles, Heart, CheckCircle2, MessageCircle, Send, Lock } from 'lucide-react';
import { communityService } from '../../services/communityService.js';

export default function CommunityPost({ post, onLike, onAddComment, user, isMaintenance = false }) {
  const [likes, setLikes] = useState(post.likes ?? 0);
  const [hasLiked, setHasLiked] = useState(post.isLiked || false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState(() => post.commentsList || []);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    setCommentsList(post.commentsList || []);
    setLikes(post.likes ?? 0);
    setHasLiked(Boolean(post.isLiked));
  }, [post.commentsList, post.likes, post.isLiked]);

  const handleLike = async () => {
    if (isMaintenance) {
      alert('A comunidade está temporariamente em manutenção. Curtidas estão pausadas.');
      return;
    }
    if (isLiking) return;
    setIsLiking(true);

    const previousLiked = hasLiked;
    const previousLikes = likes;
    setHasLiked(!previousLiked);
    setLikes(previousLiked ? Math.max(0, previousLikes - 1) : previousLikes + 1);

    try {
      const res = await communityService.toggleLike(post.id);
      if (res.success && res.data) {
        setLikes(Number(res.data.likes_count) || 0);
        setHasLiked(Boolean(res.data.liked));
        if (onLike) onLike(post.id, res.data);
      } else {
        setHasLiked(previousLiked);
        setLikes(previousLikes);
      }
    } catch (_) {
      setHasLiked(previousLiked);
      setLikes(previousLikes);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (isMaintenance) {
      alert('A comunidade está em manutenção. Novos comentários estão pausados.');
      return;
    }
    if (!commentText.trim() || isCommenting) return;

    setIsCommenting(true);
    const textToSend = commentText.trim();
    setCommentText('');

    try {
      const res = await communityService.addComment(post.id, textToSend);
      if (res.success && res.data) {
        setCommentsList(res.data);
        if (onAddComment) onAddComment(post.id, res.data);
      }
    } catch (err) {
      console.error('Erro ao enviar comentário:', err);
    } finally {
      setIsCommenting(false);
    }
  };

  const displayMessage = post.content || 'Atividade realizada na plataforma!';
  const displayTitle = post.title || '';
  const displayTime = post.timeAgo || 'Hoje';
  const authorName = post.author?.name || 'Aluno Magic';
  const authorAvatar = post.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80';
  const authorLevel = post.author?.level || 'Iniciante';

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#111426] border border-[#1e233b] hover:border-purple-500/40 transition-all space-y-4 shadow-xl group">
      
      {/* Post Author Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={authorAvatar}
            alt={authorName}
            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-purple-500/40 group-hover:ring-purple-400 transition-all flex-shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate">
              {authorName}
            </h4>
            <span className="text-[11px] text-purple-300 font-medium">
              {authorLevel}
            </span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500 whitespace-nowrap">
          {displayTime}
        </span>
      </div>

      {/* Main Content Box */}
      <div className="p-4 rounded-2xl bg-[#161a2e] border border-[#222846] space-y-2.5">
        {displayTitle && (
          <h5 className="text-sm font-bold text-purple-300">
            {displayTitle}
          </h5>
        )}
        <p className="text-sm sm:text-base font-medium text-white leading-relaxed whitespace-pre-wrap">
          {displayMessage}
        </p>

        {/* Highlighted Badge / XP Pill if present */}
        {(post.badgeTitle || post.xpAwarded) && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xl">{post.badgeIcon || '🏆'}</span>
              <span className="text-xs font-extrabold text-slate-200">
                {post.badgeTitle || 'Marco Alcançado'}
              </span>
            </div>

            {post.xpAwarded && (
              <span className="text-xs font-black text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-xl border border-amber-500/30">
                +{post.xpAwarded} XP
              </span>
            )}
          </div>
        )}
      </div>

      {/* Interactive Actions Footer */}
      <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              isMaintenance
                ? 'opacity-60 cursor-not-allowed bg-[#181c33] text-slate-400 border border-slate-800'
                : hasLiked
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400/50'
                : 'bg-[#181c33] text-purple-300 hover:text-white hover:bg-purple-600/30 border border-purple-500/30'
            }`}
            title={isMaintenance ? 'Curtidas pausadas em manutenção' : 'Parabenizar colega'}
          >
            <span className="text-sm">👏</span>
            <span>{hasLiked ? 'Parabenizado!' : 'Parabenizar'}</span>
            <span className="text-[11px] font-mono font-black ml-0.5 bg-black/30 px-1.5 py-0.2 rounded">
              {likes}
            </span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181c33] text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Comentários ({commentsList.length})</span>
          </button>
        </div>

        <span className="text-slate-500 text-[11px] hidden sm:inline">
          Comunidade Magic English ✨
        </span>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="p-4 rounded-2xl bg-[#0e101f] border border-slate-800 space-y-3 animate-in fade-in duration-200">
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {commentsList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">
                Nenhum comentário ainda. Seja o primeiro a comentar!
              </p>
            ) : (
              commentsList.map((c) => (
                <div key={c.id} className="p-2.5 rounded-xl bg-[#141728] border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <strong className="text-purple-300 font-bold">{c.author || 'Aluno'}</strong>
                    <span className="text-[10px]">{c.time || 'Agora'}</span>
                  </div>
                  <p className="text-slate-200">{c.text}</p>
                </div>
              ))
            )}
          </div>

          {isMaintenance ? (
            <div className="p-3 rounded-xl bg-[#141728] border border-amber-500/25 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Comentários temporariamente pausados durante a manutenção da comunidade.</span>
            </div>
          ) : (
            <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escreva um comentário de incentivo..."
                className="flex-1 bg-[#141728] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isCommenting}
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      )}

    </div>
  );
}
