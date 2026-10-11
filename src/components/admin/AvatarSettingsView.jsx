import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sliders, 
  Image as ImageIcon, 
  Mic, 
  Volume2, 
  MessageSquare, 
  RefreshCw,
  Upload,
  Layers,
  Lock,
  Unlock,
  Eye,
  User,
  Users
} from 'lucide-react';
import { avatarPracticeService, DEFAULT_AVATAR_SETTINGS, TEACHER_PRESETS } from '../../services/avatarPracticeService';

export const THEME_PRESETS = [
  {
    id: 'classroom',
    name: 'Sala de Aula Moderna',
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80',
    description: 'Ambiente aconchegante de estúdio educacional'
  },
  {
    id: 'library',
    name: 'Biblioteca Clássica',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&auto=format&fit=crop&q=80',
    description: 'Estilo clássico e focado em leitura e estudo'
  },
  {
    id: 'studio',
    name: 'Estúdio Neon Magic English',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop&q=80',
    description: 'Luzes neon e tecnologia interativa moderna'
  }
];

export default function AvatarSettingsView() {
  const [settings, setSettings] = useState(DEFAULT_AVATAR_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', text: '' }

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await avatarPracticeService.getSettings();
        if (isMounted) setSettings(data);
      } catch (err) {
        console.error('Erro ao carregar configurações do avatar:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await avatarPracticeService.saveSettings(settings);
      if (res?.error) {
        showToast('Configurações salvas localmente! (Aviso do servidor: ' + res.error + ')', 'error');
      } else {
        showToast('Configurações da Professora Avatar 3D salvas com sucesso!');
      }
    } catch (err) {
      showToast('Configurações salvas localmente no navegador!', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentBgPreview = settings.backgroundUrl || (
    THEME_PRESETS.find(t => t.id === settings.backgroundTheme)?.url || THEME_PRESETS[0].url
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-purple-900/30 border border-purple-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-purple-600/30 flex-shrink-0">
            <div className="w-full h-full bg-[#0c0e17] rounded-[14px] flex items-center justify-center">
              <Bot className="w-7 h-7 text-purple-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Professora Avatar (IA)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                MagicAdmin PRO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Controle pedagógico, rigor de pronúncia, visual do estúdio e voz neural da Professora 3D.
            </p>
          </div>
        </div>

        {/* Botão de Salvar no Topo */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-purple-600/30 hover:scale-[1.02] cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </>
          )}
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in duration-200 ${
          toast.type === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          )}
          <span className="text-xs font-bold">{toast.text}</span>
        </div>
      )}

      {/* Grid de Configurações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Rigor da Pronúncia (Tolerância STT) */}
        <div className="bg-[#0e111d] border border-purple-500/20 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-3 pb-3 border-b border-purple-500/10">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                1. Rigor da Pronúncia (Tolerância STT)
              </h2>
              <p className="text-xs text-slate-400">
                Cobertura da Frase Inteira. Nunca aprova trechos picados.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300">Nível de Rigor</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'easy', label: 'Fácil (Iniciante)', desc: '70% de cobertura', badge: '70%' },
                { id: 'medium', label: 'Médio (Padrão)', desc: '85% de cobertura', badge: '85%' },
                { id: 'hard', label: 'Rigoroso (Avançado)', desc: '95% de cobertura', badge: '95%' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, toleranceMode: opt.id })}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    settings.toleranceMode === opt.id
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-600/20'
                      : 'bg-[#121526] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      {opt.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{opt.desc}</span>
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Trava Pedagógica Ativa:</strong> Se o aluno falar menos de 75% da quantidade de palavras esperadas da frase, o sistema rejeita automaticamente e orienta a falar a frase inteira.
              </span>
            </div>
          </div>
        </div>

        {/* 2. Cenário de Fundo (Background) */}
        <div className="bg-[#0e111d] border border-purple-500/20 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-3 pb-3 border-b border-purple-500/10">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                2. Cenário de Fundo (Sala de Aula 3D)
              </h2>
              <p className="text-xs text-slate-400">
                Temas imersivos rápidos ou imagem personalizada do Drive/Storage.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              {THEME_PRESETS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, backgroundTheme: t.id, backgroundUrl: '' })}
                  className={`p-2 rounded-2xl border text-left transition-all cursor-pointer overflow-hidden group ${
                    settings.backgroundTheme === t.id && !settings.backgroundUrl
                      ? 'border-purple-500 ring-2 ring-purple-500/40'
                      : 'border-slate-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="h-14 rounded-xl overflow-hidden mb-1.5 bg-black">
                    <img src={t.url} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <p className="text-[11px] font-bold text-white truncate">{t.name}</p>
                </button>
              ))}
            </div>

            {/* Imagem personalizada */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Ou URL de Imagem Personalizada</label>
              <input
                type="text"
                value={settings.backgroundUrl}
                onChange={(e) => setSettings({ ...settings, backgroundUrl: e.target.value })}
                placeholder="https://... ou Google Drive URL"
                className="w-full px-4 py-2.5 rounded-xl bg-[#121526] border border-slate-700/60 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Blur slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Desfoque Suave de Fundo (Blur)</span>
                <span className="text-purple-300 font-mono">{settings.backgroundBlur || 0}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={settings.backgroundBlur || 0}
                onChange={(e) => setSettings({ ...settings, backgroundBlur: Number(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. Tempo Diário e Trava de 24 Horas */}
        <div className="bg-[#0e111d] border border-purple-500/20 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-3 pb-3 border-b border-purple-500/10">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                3. Tempo de Sessão & Trava de 24h
              </h2>
              <p className="text-xs text-slate-400">
                Limita o tempo diário de conversação para disciplina e controle de custos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Duração Diária (Minutos)</label>
              <input
                type="number"
                min="5"
                max="60"
                value={settings.sessionDurationMinutes}
                onChange={(e) => setSettings({ ...settings, sessionDurationMinutes: Number(e.target.value) || 15 })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121526] border border-slate-700/60 text-white text-xs font-mono font-bold focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-500">Padrão recomendado: 15 minutos</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Trava Diária (Cooldown)</label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, cooldownEnabled: !settings.cooldownEnabled })}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    settings.cooldownEnabled
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                  }`}
                >
                  {settings.cooldownEnabled ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{settings.cooldownEnabled ? 'Ativada (Bloqueia até amanhã)' : 'Desativada (Ilimitado)'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Campo Numérico de Horas de Trava Customizável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-purple-500/10">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Tempo de Cooldown (Horas)</label>
                {!settings.cooldownEnabled && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Ilimitado (Trava Desligada)
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                max="72"
                disabled={!settings.cooldownEnabled}
                value={settings.cooldownHours || 24}
                onChange={(e) => setSettings({ ...settings, cooldownHours: Number(e.target.value) || 24 })}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none transition-all ${
                  settings.cooldownEnabled
                    ? 'bg-[#121526] border-slate-700/60 text-white focus:border-purple-500'
                    : 'bg-[#0a0c16] border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              />
              <span className="text-[10px] text-slate-500">
                Exemplos: <strong>1h</strong>, <strong>2h</strong>, <strong>12h</strong> ou <strong>24h</strong> (Padrão: 24).
              </span>
            </div>

            {/* Botão Utilitário: Resetar Bloqueio de Todos os Alunos Agora */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="text-xs font-bold text-slate-300">Testes Imediatos</label>
              <button
                type="button"
                onClick={async () => {
                  const res = await avatarPracticeService.resetAllDailySessions();
                  if (res?.success) {
                    showToast('Bloqueio resetado com sucesso para todos os alunos!');
                  } else {
                    showToast('Erro ao resetar bloqueios: ' + (res?.error || 'Erro'), 'error');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resetar Bloqueio de Todos os Alunos Agora</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Modo de Virada do Cooldown</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: '24h', label: 'Horas Corridas', desc: `Libera exatamente ${settings.cooldownHours || 24}h após terminar` },
                { id: 'midnight', label: 'Virada da Noite (00:00)', desc: 'Libera no dia seguinte às 00:00' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={!settings.cooldownEnabled}
                  onClick={() => setSettings({ ...settings, cooldownResetMode: m.id })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    !settings.cooldownEnabled
                      ? 'bg-[#0a0c16] border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                      : settings.cooldownResetMode === m.id
                        ? 'bg-purple-600/20 border-purple-500 text-white'
                        : 'bg-[#121526] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{m.label}</p>
                  <p className="text-[10px] text-slate-500">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Voz Neural & Velocidade */}
        <div className="bg-[#0e111d] border border-purple-500/20 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-3 pb-3 border-b border-purple-500/10">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                4. Galeria de Professores & Velocidade de Fala
              </h2>
              <p className="text-xs text-slate-400">
                Selecione o(a) professor(a) 3D e sua voz neural Microsoft Azure sincronizada.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Professores Virtuais Oficiais (Multigênero)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEACHER_PRESETS.map((t) => {
                  const isSelected = (settings.teacherPresetId || 'sarah') === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSettings({ 
                        ...settings, 
                        teacherPresetId: t.id, 
                        modelUrl: t.modelUrl 
                      })}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group ${
                        isSelected
                          ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/30 border-purple-500 ring-2 ring-purple-500/30 text-white shadow-lg'
                          : 'bg-[#121526] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                            t.gender === 'F' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {t.gender === 'F' ? '♀' : '♂'}
                          </div>
                          <div>
                            <p className="text-xs font-black text-white flex items-center gap-1.5">
                              {t.name}
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                t.gender === 'F' ? 'bg-pink-500/10 text-pink-300' : 'bg-cyan-500/10 text-cyan-300'
                              }`}>
                                {t.role}
                              </span>
                            </p>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{t.description}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-purple-400 shadow-sm shadow-purple-400 animate-pulse" />
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-mono text-purple-300">{t.voiceEn}</span>
                        <span className="font-mono text-indigo-300">{t.voicePt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* URL Personalizada de Modelo 3D (.glb) */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-300">
                Ou URL de Avatar Personalizado (.glb / Ready Player Me)
              </label>
              <input
                type="text"
                value={settings.modelUrl || ''}
                onChange={(e) => setSettings({ ...settings, modelUrl: e.target.value })}
                placeholder="/avatars/brunette.glb ou https://models.readyplayer.me/...glb"
                className="w-full px-4 py-2.5 rounded-xl bg-[#121526] border border-slate-700/60 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-500">
                Você pode colar a URL de qualquer avatar .glb do Ready Player Me ou CDN compatível.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Velocidade de Fala (Aceleração Pedagógica)</span>
                <span className="text-purple-300 font-mono font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{settings.ttsSpeed ? Number(settings.ttsSpeed).toFixed(2) : '1.00'}x</span>
              </div>
              <input
                type="range"
                min="0.85"
                max="1.50"
                step="0.05"
                value={settings.ttsSpeed || 1.0}
                onChange={(e) => setSettings({ ...settings, ttsSpeed: Number(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.85x (Pausado)</span>
                <span>1.0x (Nativo)</span>
                <span>1.25x (Dinâmico)</span>
                <span>1.50x (Ultra Rápido)</span>
              </div>

              {/* Botões Rápidos de Velocidade (Presets) */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[1.0, 1.05, 1.10, 1.15, 1.25, 1.35, 1.50].map((rate) => {
                  const isSelected = Math.abs((settings.ttsSpeed || 1.0) - rate) < 0.01;
                  return (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setSettings({ ...settings, ttsSpeed: rate })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                          : 'bg-[#121526] hover:bg-[#1a1f36] text-slate-300 border border-slate-800'
                      }`}
                    >
                      {rate.toFixed(2)}x
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Personalização dos Textos da Avatar */}
      <div className="bg-[#0e111d] border border-purple-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 pb-3 border-b border-purple-500/10">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              5. Personalização dos Textos da Avatar (Repertório Dinâmico)
            </h2>
            <p className="text-xs text-slate-400">
              Suporta as tags dinâmicas <code className="text-purple-300 font-mono">{'{nome_aluno}'}</code> e <code className="text-purple-300 font-mono">{'{titulo_musica}'}</code>
            </p>
            <p className="text-[11px] text-cyan-300/90 bg-cyan-950/30 border border-cyan-800/40 rounded-xl px-3 py-1.5 mt-2 flex items-center gap-1.5">
              <span>💡</span>
              <span><strong>Dica:</strong> Digite uma frase por linha para a Avatar alternar aleatoriamente entre elas durante a aula, evitando repetições monótonas.</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Saudações Iniciais (Acolhimento)
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                {String(settings.welcomeMessage || '').split('\n').filter(s => s.trim()).length} variações
              </span>
            </div>
            <textarea
              rows={5}
              value={settings.welcomeMessage}
              onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
              placeholder="Digite uma frase por linha..."
              className="w-full px-4 py-3 rounded-2xl bg-[#121526] border border-slate-700/60 text-white text-xs leading-relaxed focus:outline-none focus:border-purple-500 resize-y"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Elogios de Acerto / Celebração
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {String(settings.successMessage || '').split('\n').filter(s => s.trim()).length} variações
              </span>
            </div>
            <textarea
              rows={5}
              value={settings.successMessage}
              onChange={(e) => setSettings({ ...settings, successMessage: e.target.value })}
              placeholder="Digite uma frase por linha..."
              className="w-full px-4 py-3 rounded-2xl bg-[#121526] border border-slate-700/60 text-white text-xs leading-relaxed focus:outline-none focus:border-purple-500 resize-y"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Encorajamentos ao Errar / Repetir
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {String(settings.retryMessage || '').split('\n').filter(s => s.trim()).length} variações
              </span>
            </div>
            <textarea
              rows={5}
              value={settings.retryMessage}
              onChange={(e) => setSettings({ ...settings, retryMessage: e.target.value })}
              placeholder="Digite uma frase por linha..."
              className="w-full px-4 py-3 rounded-2xl bg-[#121526] border border-slate-700/60 text-white text-xs leading-relaxed focus:outline-none focus:border-purple-500 resize-y"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Mensagens de Despedida ao Zerar o Tempo
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {String(settings.farewellMessage || '').split('\n').filter(s => s.trim()).length} variações
              </span>
            </div>
            <textarea
              rows={5}
              value={settings.farewellMessage}
              onChange={(e) => setSettings({ ...settings, farewellMessage: e.target.value })}
              placeholder="Digite uma frase por linha..."
              className="w-full px-4 py-3 rounded-2xl bg-[#121526] border border-slate-700/60 text-white text-xs leading-relaxed focus:outline-none focus:border-purple-500 resize-y"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Mensagem de Retomada de Sessão (Ao voltar de aba ou F5)
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {String(settings.resumeMessage || '').split('\n').filter(s => s.trim()).length} variações
              </span>
            </div>
            <textarea
              rows={4}
              value={settings.resumeMessage}
              onChange={(e) => setSettings({ ...settings, resumeMessage: e.target.value })}
              placeholder="Digite uma frase por linha..."
              className="w-full px-4 py-3 rounded-2xl bg-[#121526] border border-slate-700/60 text-white text-xs leading-relaxed focus:outline-none focus:border-purple-500 resize-y"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-purple-500/10 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-purple-600/30 hover:scale-[1.01] cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Todas as Configurações</span>
          </button>
        </div>
      </div>

    </div>
  );
}
