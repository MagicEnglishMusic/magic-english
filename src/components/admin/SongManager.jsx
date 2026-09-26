import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Plus, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Layers, 
  Tv, 
  Mic, 
  Brain, 
  FileText, 
  X, 
  Volume2, 
  Trash2,
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { songsService } from '../../services/songsService';
import { modulesService } from '../../services/modulesService';
import { lessonsService } from '../../services/lessonsService';
import { isGoogleDriveUrl, getDriveAudioUrl, getDriveImageUrl } from '../../utils/googleDriveHelper';

export default function SongManager() {
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [modulesList, setModulesList] = useState([]);
  const [lessonsList, setLessonsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAutoDistributeSuccess, setShowAutoDistributeSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    moduleId: '',
    module: '',
    lessonId: '',
    lesson: '',
    duration: '3:20',
    bpm: '108 BPM',
    lyricsEn: '',
    lyricsPt: ''
  });

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [sngRes, modRes, lesRes] = await Promise.all([
          songsService.getSongs(),
          modulesService.getModules(),
          lessonsService.getAllLessons()
        ]);

        if (sngRes?.data) {
          const formatted = sngRes.data.map((s) => ({
            id: s.id,
            title: s.title || 'Música Sem Nome',
            subtitle: s.subtitle || 'Fixação da Aula',
            image: s.cover_url || s.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
            audioUrl: s.audio_url || s.audioUrl || '',
            module: s.module || 'Módulo Geral',
            lesson: s.lesson || 'Aula Geral',
            duration: s.duration || '3:00',
            bpm: s.bpm || '108 BPM',
            lyricsEn: s.lyrics_en || s.lyricsEn || '',
            lyricsPt: s.lyrics_pt || s.lyricsPt || '',
            status: s.status || 'Publicado'
          }));
          setSongs(formatted);
          if (formatted.length > 0) {
            setSelectedSong(formatted[0]);
          }
        }

        if (modRes?.data) {
          setModulesList(modRes.data);
          if (modRes.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              moduleId: modRes.data[0].id,
              module: modRes.data[0].title
            }));
          }
        }

        if (lesRes?.data) {
          setLessonsList(lesRes.data);
          if (lesRes.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              lessonId: lesRes.data[0].id,
              lesson: lesRes.data[0].title
            }));
          }
        }
      } catch (err) {
        console.warn('Error loading song manager data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveSong = async (e) => {
    e.preventDefault();
    if (!formData.title) return;

    const formattedAudio = isGoogleDriveUrl(formData.audioUrl) ? getDriveAudioUrl(formData.audioUrl) : formData.audioUrl;
    const formattedCover = isGoogleDriveUrl(formData.image) ? getDriveImageUrl(formData.image) : formData.image;

    const payload = {
      title: formData.title,
      subtitle: formData.subtitle || 'Fixação da Aula Oficial',
      cover_url: formattedCover,
      audio_url: formattedAudio,
      duration: formData.duration || '3:00',
      bpm: formData.bpm || '108 BPM',
      lyrics_en: formData.lyricsEn || '',
      lyrics_pt: formData.lyricsPt || '',
      lesson_id: formData.lessonId || null,
      module_id: formData.moduleId || null
    };

    const res = await songsService.createSong(payload);
    const newSong = {
      id: res.data?.id || `song-${Date.now()}`,
      title: formData.title,
      subtitle: formData.subtitle || 'Fixação da Aula Oficial',
      image: formattedCover,
      audioUrl: formattedAudio,
      module: formData.module || (modulesList[0]?.title || 'Geral'),
      lesson: formData.lesson || (lessonsList[0]?.title || 'Geral'),
      duration: formData.duration,
      bpm: formData.bpm,
      lyricsEn: formData.lyricsEn,
      lyricsPt: formData.lyricsPt,
      status: 'Publicado'
    };

    setSongs([newSong, ...songs]);
    setSelectedSong(newSong);
    setIsModalOpen(false);
    setShowAutoDistributeSuccess(true);
    setTimeout(() => setShowAutoDistributeSuccess(false), 5000);
  };

  const handleDelete = async (id) => {
    await songsService.deleteSong(id);
    const filtered = songs.filter((s) => s.id !== id);
    setSongs(filtered);
    if (selectedSong?.id === id) {
      setSelectedSong(filtered.length > 0 ? filtered[0] : null);
    }
  };

  // Helper: Extract verses for live distribution preview
  const enLines = (selectedSong?.lyricsEn || '').split('\n').filter((l) => l.trim().length > 0);
  const ptLines = (selectedSong?.lyricsPt || '').split('\n').filter((l) => l.trim().length > 0);

  // Helper: Extract key words for pronunciation
  const extractedWords = Array.from(
    new Set(
      (selectedSong?.lyricsEn || '')
        .replace(/[^a-zA-Z\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3)
    )
  ).slice(0, 6);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f243c]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded border border-amber-500/30">
              SSOT Engine
            </span>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              <span>Google Drive Audio Storage</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-1">
            <Music className="w-6 h-6 text-emerald-400" />
            <span>Gerenciador de Magic Songs</span>
          </h2>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-black shadow-lg shadow-purple-600/30 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Cadastrar Nova Magic Song</span>
        </button>
      </div>

      {/* Auto Distribute Success Notification */}
      {showAutoDistributeSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>🎉 Música cadastrada! Distribuída automaticamente para o Player Karaokê, Voice Lab de Pronúncia, Prática Musical e Materiais!</span>
          </div>
          <button onClick={() => setShowAutoDistributeSuccess(false)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 2-Column Interface: Songs List (4 Cols) & SSOT Distribution Preview (8 Cols) */}
      {songs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Registered Songs (4 Cols) */}
          <div className="lg:col-span-4 p-5 rounded-3xl bg-[#101222] border border-[#1e233b] space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Músicas Cadastradas ({songs.length})
              </h3>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                SSOT Ativo
              </span>
            </div>

            <div className="space-y-2.5">
              {songs.map((song) => {
                const isSelected = selectedSong?.id === song.id;

                return (
                  <div
                    key={song.id}
                    onClick={() => setSelectedSong(song)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-950/60 to-[#191d34] border-purple-500 shadow-md ring-1 ring-purple-500/40'
                        : 'bg-[#141728] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={song.image}
                        alt={song.title}
                        className="w-11 h-11 rounded-xl object-cover ring-1 ring-purple-500/30 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {song.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {song.lesson}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] text-purple-300 font-mono font-bold bg-purple-500/15 px-2 py-0.5 rounded">
                        {song.bpm}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(song.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                        title="Excluir Música"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Live Automatic Distribution Engine Preview (8 Cols) */}
          {selectedSong && (
            <div className="lg:col-span-8 space-y-5">
              
              {/* Distribution Status Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-[#171b32] to-[#101324] border border-purple-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={selectedSong.image}
                    alt={selectedSong.title}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-500/50 shadow-md"
                  />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                      Distribuição Conectada
                    </span>
                    <h3 className="text-lg font-black text-white">
                      {selectedSong.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Vinculada à: <strong className="text-slate-200">{selectedSong.lesson}</strong> ({selectedSong.module})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 4 Abas Alimentadas
                  </span>
                </div>
              </div>

              {/* The 4 Generated Distribution Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Aba Música: Karaokê Sincronizado */}
                <div className="p-4 rounded-2xl bg-[#101322] border border-[#1e243c] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5 uppercase">
                      <Music className="w-4 h-4 text-cyan-400" /> 1. Aba Música (Karaokê)
                    </span>
                    <span className="text-[10px] text-slate-500">{enLines.length} versos</span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                    {enLines.length > 0 ? (
                      enLines.slice(0, 3).map((l, i) => (
                        <div key={i} className="p-2 rounded-lg bg-[#15192c] text-slate-200 border border-slate-800/80">
                          <p className="font-bold text-white">🇺🇸 {l}</p>
                          <p className="text-[11px] text-slate-400">🇧🇷 {ptLines[i] || ''}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">Nenhuma letra configurada.</p>
                    )}
                  </div>
                </div>

                {/* 2. Aba Pronúncia: Extração Vocal */}
                <div className="p-4 rounded-2xl bg-[#101322] border border-[#1e243c] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-purple-300 flex items-center gap-1.5 uppercase">
                      <Mic className="w-4 h-4 text-purple-400" /> 2. Aba Pronúncia (Voice Lab)
                    </span>
                    <span className="text-[10px] text-slate-500">{extractedWords.length} palavras extraídas</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {extractedWords.length > 0 ? (
                      extractedWords.map((word, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-[#181c32] text-xs font-bold text-purple-200 border border-purple-500/30 flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-purple-400" /> {word}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">Palavras fonéticas extraídas da letra.</p>
                    )}
                  </div>
                </div>

                {/* 3. Aba Prática Musical: Tradução Reversa */}
                <div className="p-4 rounded-2xl bg-[#101322] border border-[#1e243c] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5 uppercase">
                      <Brain className="w-4 h-4 text-amber-400" /> 3. Prática Musical (Reversa)
                    </span>
                    <span className="text-[10px] text-slate-500">PT $\rightarrow$ EN</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="p-2 rounded-lg bg-[#15192c] border border-slate-800">
                      <p className="text-[10px] text-slate-400">Pergunta (PT):</p>
                      <p className="font-bold text-white">"{ptLines[0] || 'Letra traduzida em Português...'}"</p>
                      <p className="text-[10px] text-amber-300 mt-1">Resposta esperada: "{enLines[0] || 'Letra em Inglês...'}"</p>
                    </div>
                  </div>
                </div>

                {/* 4. Aba Materiais & PDFs */}
                <div className="p-4 rounded-2xl bg-[#101322] border border-[#1e243c] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5 uppercase">
                      <FileText className="w-4 h-4 text-emerald-400" /> 4. Aba Material (Downloads)
                    </span>
                    <span className="text-[10px] text-slate-500">Auto Vinculado</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="p-2 rounded-lg bg-[#15192c] border border-slate-800 flex items-center justify-between">
                      <span className="font-medium text-slate-200 truncate">Letra_Traducao_{selectedSong.title.replace(/\s+/g, '_')}.pdf</span>
                      <span className="text-[10px] text-emerald-400 font-bold">Gerado</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-[#111425] border border-[#1e233b] shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto">
            <Music className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-white">Nenhuma Magic Song cadastrada</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Utilize o motor SSOT para cadastrar sua primeira música e gerar automaticamente o Karaokê, Voice Lab, Prática Musical e PDFs.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cadastrar Primeira Magic Song</span>
          </button>
        </div>
      )}

      {/* Modal: Cadastrar Música SSOT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#111425] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f243c]">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Music className="w-5 h-5 text-emerald-400" />
                  <span>Cadastrar Magic Song (Cadastro Único)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Preencha uma única vez para distribuir para o Player, Pronúncia, Prática Musical e Materiais.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#191d30] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSong} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Nome da Música:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Travel Song"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3.5 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Subtítulo / Foco:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Airport & Boarding"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3.5 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Módulo Relacionado:
                  </label>
                  <select
                    value={formData.moduleId}
                    onChange={(e) => {
                      const selMod = modulesList.find((m) => m.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        moduleId: e.target.value,
                        module: selMod ? selMod.title : ''
                      });
                    }}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-xs"
                  >
                    {modulesList.length > 0 ? (
                      modulesList.map((m) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))
                    ) : (
                      <option value="">Geral</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Aula Relacionada:
                  </label>
                  <select
                    value={formData.lessonId}
                    onChange={(e) => {
                      const selLes = lessonsList.find((l) => l.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        lessonId: e.target.value,
                        lesson: selLes ? selLes.title : ''
                      });
                    }}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-xs"
                  >
                    {lessonsList.length > 0 ? (
                      lessonsList.map((l) => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))
                    ) : (
                      <option value="">Geral</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Google Drive Audio URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Áudio da Música (Link Google Drive / MP3):
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/file/d/.../view ou URL direta de áudio"
                  value={formData.audioUrl}
                  onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                  className="w-full bg-[#161a2e] border border-[#242b46] focus:border-cyan-400 rounded-xl px-3 py-2 text-white text-xs font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 O sistema converte automaticamente links compartilhados do Google Drive em streaming de áudio.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Letra em Inglês (1 verso por linha):
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.lyricsEn}
                    onChange={(e) => setFormData({ ...formData, lyricsEn: e.target.value })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl p-3 text-white text-xs font-mono resize-none focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Tradução em Português (1 verso por linha):
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.lyricsPt}
                    onChange={(e) => setFormData({ ...formData, lyricsPt: e.target.value })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl p-3 text-white text-xs font-mono resize-none focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    URL da Capa (Google Drive / Imagem):
                  </label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/.../view ou URL da imagem"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    BPM / Ritmo:
                  </label>
                  <input
                    type="text"
                    value={formData.bpm}
                    onChange={(e) => setFormData({ ...formData, bpm: e.target.value })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#161a2e] text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Salvar & Distribuir Automaticamente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
