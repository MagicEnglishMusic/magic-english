import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, Volume2, ThumbsUp, Users, Mic } from 'lucide-react';

export default function ConversationRoom({ data }) {
  const [messages, setMessages] = useState(data.messages);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      author: 'Você (Aluno Magic)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      level: '🎵 Music Learner',
      content: inputValue,
      time: 'Agora mesmo',
      likes: 1
    };

    setMessages([...messages, newMsg]);
    setInputValue('');
  };

  const speakPhrase = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-[#111426] border border-purple-500/30 shadow-2xl space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f253d]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded border border-purple-500/30">
              Prática Diária de Fala
            </span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {data.activeParticipants} alunos conversando
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white mt-1 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <span>{data.title}</span>
          </h3>
        </div>

        <div className="text-xs text-slate-400">
          Tema: <strong className="text-purple-300">{data.topic}</strong>
        </div>
      </div>

      {/* Daily Challenge Prompt Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#15182d] to-indigo-950/20 border border-purple-500/40 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Frase Desafio do Dia (Pratique a Pronúncia):
          </span>
          <button
            onClick={() => speakPhrase(data.promptPhrase)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 text-xs font-bold transition-all cursor-pointer"
            title="Ouvir pronúncia nativa"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Ouvir</span>
          </button>
        </div>

        <p className="text-sm sm:text-base font-bold text-white">
          "{data.promptPhrase}"
        </p>
        <p className="text-xs text-slate-400 italic">
          🇧🇷 {data.translationPrompt}
        </p>

        {/* Suggested Quick Response Pills */}
        <div className="pt-2 flex flex-wrap gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase self-center">Sugestões:</span>
          {data.suggestedAnswers.map((ans, idx) => (
            <button
              key={idx}
              onClick={() => setInputValue(ans)}
              className="text-[11px] bg-[#181d33] hover:bg-purple-600/30 text-purple-200 border border-slate-700 hover:border-purple-500/50 px-2.5 py-1 rounded-lg transition-all cursor-pointer truncate max-w-xs"
            >
              {ans}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="p-3.5 rounded-2xl bg-[#14172a] border border-slate-800/80 flex items-start gap-3.5"
          >
            <img
              src={msg.avatar}
              alt={msg.author}
              className="w-9 h-9 rounded-xl object-cover ring-1 ring-purple-500/40 flex-shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{msg.author}</span>
                  <span className="text-[10px] text-purple-300 bg-purple-500/15 px-1.5 py-0.2 rounded font-semibold">
                    {msg.level}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">{msg.time}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Escreva sua frase em inglês para a comunidade..."
          className="w-full bg-[#161a30] border border-[#242b4a] text-white text-xs sm:text-sm rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-500"
        />
        <button
          type="submit"
          className="absolute right-2 p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
