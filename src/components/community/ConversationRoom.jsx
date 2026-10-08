import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Send, Sparkles, Volume2, Flame, CheckCircle2, Award, BookOpen } from 'lucide-react';
import { getTodayConversationChallenge } from '../../data/conversationChallenges';
import { conversationContextService } from '../../services/conversationContextService';
import { progressService } from '../../services/progressService';
import { useGamification } from '../../context/GamificationContext';

export default function ConversationRoom({ data = {}, user = null }) {
  const { addXp, currentLevel } = useGamification();

  // 1. Fallback base challenge
  const fallbackChallenge = useMemo(() => {
    const chal = getTodayConversationChallenge();
    return chal || {
      id: 'default',
      theme: data.topic || 'Apresentações & Cumprimentos',
      title: data.title || 'Hello! Como se Apresentar',
      phrase: data.promptPhrase || 'Hello, my friend! Nice to meet you. What is your name?',
      translation: data.translationPrompt || 'Olá, meu amigo! Prazer em conhecer você. Qual é o seu nome?',
      suggestions: [
        "Hello! My name is Maria. Nice to meet you!",
        "Good morning my friend! Ready to sing and play.",
        "I'm feeling great on this lovely day!"
      ],
      dateKey: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    };
  }, [data]);

  // 2. Dynamic Pedagogical Challenge State
  const [activeChallenge, setActiveChallenge] = useState(fallbackChallenge);

  // Load pedagogical challenge matched to student's studied lessons & songs
  useEffect(() => {
    let isMounted = true;
    async function loadPedagogicalChallenge() {
      try {
        const chal = await conversationContextService.getDailyChallengeForUser(user?.id);
        if (isMounted && chal) {
          setActiveChallenge(chal);
        }
      } catch (err) {
        console.warn('Erro ao carregar desafio contextual pedagógico:', err);
      }
    }
    loadPedagogicalChallenge();
    return () => { isMounted = false; };
  }, [user?.id]);

  // Today Date String (America/Sao_Paulo)
  const todayDateStr = useMemo(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  }, []);

  // Yesterday Date String for streak continuity
  const yesterdayDateStr = useMemo(() => {
    const spNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    spNow.setDate(spNow.getDate() - 1);
    const yyyy = spNow.getFullYear();
    const mm = String(spNow.getMonth() + 1).padStart(2, '0');
    const dd = String(spNow.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // 3. Local State & Streak Storage
  const [messages, setMessages] = useState(() => data.messages || []);
  const [inputValue, setInputValue] = useState('');
  const [isPracticedToday, setIsPracticedToday] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  // Synchronize streak and daily completion state with DB events & localStorage
  useEffect(() => {
    let isMounted = true;
    async function checkDailyCompletion() {
      try {
        let hasEventToday = false;
        if (user?.id) {
          const { data: xpEvents } = await progressService.getUserXpEvents(user.id);
          if (Array.isArray(xpEvents)) {
            hasEventToday = xpEvents.some(
              (e) => e.source === 'conversation_daily' && String(e.ref || '').includes(todayDateStr)
            );
          }
        }

        const lastDate = localStorage.getItem('magic_conversation_last_date');
        const savedStreak = parseInt(localStorage.getItem('magic_conversation_streak') || '0', 10);

        if (isMounted) {
          if (user?.id) {
            if (hasEventToday) {
              setIsPracticedToday(true);
              setStreakCount(savedStreak > 0 ? savedStreak : 1);
            } else {
              setIsPracticedToday(false);
              setStreakCount(lastDate === yesterdayDateStr ? savedStreak : 0);
            }
          } else {
            if (lastDate === todayDateStr) {
              setIsPracticedToday(true);
              setStreakCount(savedStreak > 0 ? savedStreak : 1);
            } else if (lastDate === yesterdayDateStr) {
              setIsPracticedToday(false);
              setStreakCount(savedStreak);
            } else {
              setIsPracticedToday(false);
              setStreakCount(0);
            }
          }
        }
      } catch {
        if (isMounted) {
          setIsPracticedToday(false);
          setStreakCount(0);
        }
      }
    }
    checkDailyCompletion();
    return () => { isMounted = false; };
  }, [user?.id, todayDateStr, yesterdayDateStr]);

  // 4. Audio Pronunciation Handler
  const speakPhrase = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 5. Send Message & Claim XP Handler
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      author: user?.name || user?.user_metadata?.full_name || 'Você (Aluno Magic)',
      avatar: user?.avatar || user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      level: currentLevel?.title ? `🎵 ${currentLevel.title}` : '🎵 Music Learner',
      content: text,
      time: 'Agora mesmo',
      likes: 1
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue('');

    // Attempt official XP grant
    try {
      if (typeof addXp === 'function') {
        const refId = `conversation_daily_${todayDateStr}`;
        console.log('[MagicConversation] Disparando addXp:', { source: 'conversation_daily', ref: refId });
        const xpRes = await addXp('conversation_daily', refId, {
          showModal: true,
          type: 'xp',
          title: '💬 Conversação Praticada!',
          subtitle: 'Parabéns por praticar o conteúdo das suas aulas hoje!',
          bonusText: '+5 Magic XP adicionados à sua jornada!'
        });
        console.log('[MagicConversation] Retorno recebido de addXp:', xpRes);

        // Only after XP confirmation
        if (xpRes && xpRes.success) {
          const lastDate = localStorage.getItem('magic_conversation_last_date');
          const currentSavedStreak = parseInt(localStorage.getItem('magic_conversation_streak') || '0', 10);
          
          let newStreak = 1;
          if (lastDate === yesterdayDateStr) {
            newStreak = currentSavedStreak + 1;
          } else if (lastDate === todayDateStr) {
            newStreak = currentSavedStreak > 0 ? currentSavedStreak : 1;
          }

          localStorage.setItem('magic_conversation_last_date', todayDateStr);
          localStorage.setItem('magic_conversation_streak', String(newStreak));
          
          setIsPracticedToday(true);
          setStreakCount(newStreak);
        }
      }
    } catch (err) {
      console.warn('Erro ao processar XP de conversação diária:', err);
    }
  };

  const onSubmitForm = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="p-6 rounded-3xl bg-[#111426] border border-purple-500/30 shadow-2xl space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f253d]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded border border-purple-500/30">
              Prática Diária de Fala
            </span>
            
            {/* Pedagogical source indicator if available */}
            {activeChallenge.lessonRef && (
              <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-cyan-400" />
                {activeChallenge.lessonRef}
              </span>
            )}

            {/* Streak & Status Badges */}
            {streakCount > 0 && (
              <span className="text-xs text-amber-400 font-extrabold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {streakCount} {streakCount === 1 ? 'dia seguido' : 'dias seguidos'}
              </span>
            )}

            {isPracticedToday ? (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Praticou hoje (+5 XP)
              </span>
            ) : (
              <span className="text-xs text-purple-300 font-semibold flex items-center gap-1 bg-purple-600/10 px-2 py-0.5 rounded border border-purple-500/20">
                <Award className="w-3 h-3 text-purple-400" />
                +5 XP disponível hoje
              </span>
            )}
          </div>
          
          <h3 className="text-lg sm:text-xl font-black text-white mt-1 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <span>{activeChallenge.title}</span>
          </h3>
        </div>

        <div className="text-xs text-slate-400 self-start sm:self-center">
          Tema: <strong className="text-purple-300">{activeChallenge.theme}</strong>
        </div>
      </div>

      {/* Daily Challenge Prompt Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#15182d] to-indigo-950/20 border border-purple-500/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Frase Desafio do Dia (Pratique a Pronúncia):
          </span>
          <button
            onClick={() => speakPhrase(activeChallenge.phrase)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 text-xs font-bold transition-all cursor-pointer"
            title="Ouvir pronúncia nativa"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Ouvir</span>
          </button>
        </div>

        <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
          "{activeChallenge.phrase}"
        </p>
        <p className="text-xs text-slate-400 italic">
          🇧🇷 {activeChallenge.translation}
        </p>

        {/* Suggested Quick Response Pills */}
        {Array.isArray(activeChallenge.suggestions) && activeChallenge.suggestions.length > 0 && (
          <div className="pt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Sugestões:</span>
            {activeChallenge.suggestions.map((ans, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputValue(ans)}
                className="text-[11px] bg-[#181d33] hover:bg-purple-600/30 text-purple-200 border border-slate-700 hover:border-purple-500/50 px-2.5 py-1 rounded-lg transition-all cursor-pointer text-left"
              >
                {ans}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages Thread */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#14172a]/60 border border-dashed border-slate-800 text-center space-y-1">
            <p className="text-xs font-bold text-slate-300">Nenhuma mensagem nesta sala ainda</p>
            <p className="text-[11px] text-slate-500">
              Escolha uma das sugestões acima ou digite sua resposta para responder ao desafio e resgatar +5 XP hoje!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
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
          ))
        )}
      </div>

      {/* Input Message Form */}
      <form onSubmit={onSubmitForm} className="relative flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Escreva sua resposta em inglês..."
          className="w-full bg-[#161a30] border border-[#242b4a] text-white text-xs sm:text-sm rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-500"
        />
        <button
          type="submit"
          className="absolute right-2 p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer"
          title="Enviar mensagem e praticar"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
