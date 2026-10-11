import React, { useState, useEffect, useRef } from 'react';
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
  HardDrive,
  Edit2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Timer,
  FastForward,
  Sliders,
  HelpCircle,
  Bot,
  RefreshCw,
  Check
} from 'lucide-react';
import { songsService } from '../../services/songsService';
import { modulesService } from '../../services/modulesService';
import { lessonsService } from '../../services/lessonsService';
import { avatarPracticeService, requestAzureTTS, DEFAULT_AVATAR_SETTINGS } from '../../services/avatarPracticeService';
import { isGoogleDriveUrl, getDriveAudioUrl, getDriveImageUrl, extractGoogleDriveId, uploadAudioToDrive } from '../../utils/googleDriveHelper';

export default function SongManager() {
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [modulesList, setModulesList] = useState([]);
  const [lessonsList, setLessonsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAutoDistributeSuccess, setShowAutoDistributeSuccess] = useState(false);

  // Sync Karaoke (Tap to Sync) States
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncingSong, setSyncingSong] = useState(null);
  const [syncVerses, setSyncVerses] = useState([]);
  const [currentSyncVerseIdx, setCurrentSyncVerseIdx] = useState(0);
  const [reactionOffsetMs, setReactionOffsetMs] = useState(200);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [syncCurrentTime, setSyncCurrentTime] = useState(0);
  const [syncDuration, setSyncDuration] = useState(0);
  const [isSyncPlaying, setIsSyncPlaying] = useState(false);
  const [isSavingSync, setIsSavingSync] = useState(false);
  const syncAudioRef = useRef(null);

  // Estados da Geração de Áudios da Avatar (Google Drive)
  const [isGeneratingAudios, setIsGeneratingAudios] = useState(false);
  const [audioGenProgress, setAudioGenProgress] = useState({ current: 0, total: 0, text: '' });
  const [audioGenToast, setAudioGenToast] = useState(null); // { type: 'success' | 'error', text: '' }

  const [editingSongId, setEditingSongId] = useState(null);
  const [lyricsError, setLyricsError] = useState(null);

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
            timestamps: Array.isArray(s.timestamps) ? s.timestamps : [],
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

  // Format seconds to mm:ss.ms
  const formatTime = (secs) => {
    if (secs === null || secs === undefined || isNaN(secs)) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  // Open Karaoke Sync (Tap to Sync) Modal
  const handleOpenSyncModal = (song) => {
    const targetSong = song || selectedSong;
    if (!targetSong) return;

    setSyncingSong(targetSong);
    setReactionOffsetMs(200);
    setPlaybackRate(1.0);
    setCurrentSyncVerseIdx(0);
    setIsSyncPlaying(false);
    setSyncCurrentTime(0);

    // If song already has timestamps in DB, parse and load them
    if (Array.isArray(targetSong.timestamps) && targetSong.timestamps.length > 0) {
      setSyncVerses(targetSong.timestamps.map((t, idx) => ({
        id: t.id || idx + 1,
        en: t.en || t.english || '',
        pt: t.pt || t.portuguese || t.translation || '',
        startTime: typeof t.startTime === 'number' ? t.startTime : null,
        endTime: typeof t.endTime === 'number' ? t.endTime : null
      })));
    } else {
      // Parse from lyrics_en & lyrics_pt
      const enLines = (targetSong.lyricsEn || targetSong.lyrics_en || '').split('\n').map((l) => l.trim()).filter(Boolean);
      const ptLines = (targetSong.lyricsPt || targetSong.lyrics_pt || '').split('\n').map((l) => l.trim()).filter(Boolean);
      const verses = enLines.map((en, idx) => ({
        id: idx + 1,
        en,
        pt: ptLines[idx] || '',
        startTime: null,
        endTime: null
      }));
      setSyncVerses(verses);
    }

    setIsSyncModalOpen(true);
  };

  // Tap-to-Sync Mark Verse Handler
  const handleMarkVerse = () => {
    if (!syncAudioRef.current) return;
    const rawTime = syncAudioRef.current.currentTime;
    const offsetSec = (Number(reactionOffsetMs) || 0) / 1000;
    const adjustedTime = Math.max(0, Number((rawTime - offsetSec).toFixed(2)));

    setSyncVerses((prev) => {
      const updated = [...prev];
      if (currentSyncVerseIdx < updated.length) {
        updated[currentSyncVerseIdx] = {
          ...updated[currentSyncVerseIdx],
          startTime: adjustedTime
        };

        // Automatically close previous verse's endTime
        if (currentSyncVerseIdx > 0 && updated[currentSyncVerseIdx - 1]) {
          updated[currentSyncVerseIdx - 1] = {
            ...updated[currentSyncVerseIdx - 1],
            endTime: adjustedTime
          };
        }
      }
      return updated;
    });

    if (currentSyncVerseIdx < syncVerses.length - 1) {
      setCurrentSyncVerseIdx((prev) => prev + 1);
    }
  };

  // Redo specific verse mark
  const handleRedoVerse = (idx) => {
    setCurrentSyncVerseIdx(idx);
    const target = syncVerses[idx];
    if (syncAudioRef.current) {
      const seekTime = target?.startTime !== null ? Math.max(0, target.startTime - 2) : syncAudioRef.current.currentTime;
      syncAudioRef.current.currentTime = seekTime;
      if (!isSyncPlaying) {
        syncAudioRef.current.play().then(() => setIsSyncPlaying(true)).catch(() => {});
      }
    }
  };

  // Reset all sync marks
  const handleResetAllSync = () => {
    if (window.confirm('Deseja reiniciar todas as marcações de tempo deste karaokê?')) {
      setSyncVerses((prev) => prev.map((v) => ({ ...v, startTime: null, endTime: null })));
      setCurrentSyncVerseIdx(0);
      if (syncAudioRef.current) {
        syncAudioRef.current.currentTime = 0;
      }
    }
  };

  // Save Synchronized Timestamps to Supabase
  const handleSaveSyncTimestamps = async () => {
    if (!syncingSong?.id) return;
    setIsSavingSync(true);

    try {
      const finalTimestamps = syncVerses.map((v, idx) => {
        const next = syncVerses[idx + 1];
        const defaultEnd = next?.startTime !== null && next?.startTime !== undefined
          ? next.startTime
          : v.startTime !== null ? Number((v.startTime + 3.5).toFixed(2)) : null;

        return {
          id: v.id || idx + 1,
          startTime: v.startTime,
          endTime: v.endTime || defaultEnd,
          en: v.en,
          pt: v.pt
        };
      });

      const res = await songsService.updateSong(syncingSong.id, {
        timestamps: finalTimestamps
      });

      if (res?.error || !res?.data) {
        const errorMsg = res?.error || 'Nenhuma linha foi atualizada no banco de dados (0 linhas afetadas). Verifique as permissões ou se o registro existe.';
        alert(`Erro ao salvar sincronização: ${errorMsg}`);
        return;
      }

      // Update local state
      const updatedSongs = songs.map((s) => (s.id === syncingSong.id ? { ...s, timestamps: finalTimestamps } : s));
      setSongs(updatedSongs);
      if (selectedSong?.id === syncingSong.id) {
        setSelectedSong((prev) => ({ ...prev, timestamps: finalTimestamps }));
      }

      setIsSyncModalOpen(false);
      setShowAutoDistributeSuccess(true);
      setTimeout(() => setShowAutoDistributeSuccess(false), 5000);
    } catch (err) {
      console.error('Error saving sync timestamps:', err);
      alert('Erro ao salvar sincronização.');
    } finally {
      setIsSavingSync(false);
    }
  };

  // Keyboard shortcut listener: Space to Mark Verse
  useEffect(() => {
    if (!isSyncModalOpen) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleMarkVerse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSyncModalOpen, currentSyncVerseIdx, syncVerses, reactionOffsetMs]);

  const handleOpenCreateModal = () => {
    setEditingSongId(null);
    setLyricsError(null);
    setFormData({
      title: '',
      subtitle: 'Fixação da Aula Oficial',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      audioUrl: '',
      moduleId: modulesList[0]?.id || '',
      module: modulesList[0]?.title || '',
      lessonId: lessonsList[0]?.id || '',
      lesson: lessonsList[0]?.title || '',
      duration: '3:20',
      bpm: '108 BPM',
      lyricsEn: '',
      lyricsPt: ''
    });
    setIsModalOpen(true);
  };

  const handleEditSong = (song) => {
    setEditingSongId(song.id);
    setLyricsError(null);
    setFormData({
      title: song.title || '',
      subtitle: song.subtitle || 'Fixação da Aula Oficial',
      image: song.image || '',
      audioUrl: song.audioUrl || '',
      moduleId: song.moduleId || '',
      module: song.module || '',
      lessonId: song.lessonId || '',
      lesson: song.lesson || '',
      duration: song.duration || '3:20',
      bpm: song.bpm || '108 BPM',
      lyricsEn: song.lyricsEn || '',
      lyricsPt: song.lyricsPt || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveSong = async (e) => {
    e.preventDefault();
    if (!formData.title) return;

    // Strict Validation: Verse-by-verse line count alignment
    const enLines = (formData.lyricsEn || '').split('\n').map((l) => l.trim()).filter(Boolean);
    const ptLines = (formData.lyricsPt || '').split('\n').map((l) => l.trim()).filter(Boolean);

    if (enLines.length !== ptLines.length) {
      const minCount = Math.min(enLines.length, ptLines.length);
      const diffLine = minCount + 1;
      const isEnglishLonger = enLines.length > ptLines.length;
      const missingSide = isEnglishLonger ? 'Tradução em Português' : 'Letra em Inglês';
      const referenceVerse = isEnglishLonger ? enLines[minCount] : ptLines[minCount];

      setLyricsError({
        enCount: enLines.length,
        ptCount: ptLines.length,
        diffLine,
        missingSide,
        referenceVerse
      });
      return;
    }
    setLyricsError(null);

    // Clean canonical Google Drive URL or direct link (never store environment-dependent paths in DB)
    const driveAudioId = extractGoogleDriveId(formData.audioUrl);
    const canonicalAudio = driveAudioId ? `https://drive.google.com/file/d/${driveAudioId}/view` : (formData.audioUrl || '').trim();

    const driveCoverId = extractGoogleDriveId(formData.image);
    const canonicalCover = driveCoverId ? `https://drive.google.com/thumbnail?id=${driveCoverId}&sz=w1200` : (formData.image || '').trim();

    // Automatic extraction of phonetic keywords directly from lyricsEn
    const words = Array.from(
      new Set(
        (formData.lyricsEn || '')
          .replace(/[^a-zA-Z\s]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 3)
      )
    );

    const pronunciationGuide = words.slice(0, 8).map((word) => ({
      word: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      phonetic: `/${word.toLowerCase()}/`,
      translation: '',
      tip: `Palavra-chave da Magic Song "${formData.title}". Articulação natural.`,
      score: 95
    }));

    const payload = {
      title: formData.title,
      subtitle: formData.subtitle || 'Fixação da Aula Oficial',
      cover_url: canonicalCover,
      audio_url: canonicalAudio,
      duration: formData.duration || '3:00',
      bpm: formData.bpm || '108 BPM',
      lyrics_en: formData.lyricsEn || '',
      lyrics_pt: formData.lyricsPt || '',
      pronunciation_guide: pronunciationGuide,
      lesson_id: formData.lessonId || null,
      module_id: formData.moduleId || null
    };

    let savedSongObj = {
      id: editingSongId || `song-${Date.now()}`,
      title: formData.title,
      subtitle: formData.subtitle || 'Fixação da Aula Oficial',
      image: canonicalCover,
      audioUrl: canonicalAudio,
      module: formData.module || (modulesList[0]?.title || 'Geral'),
      lesson: formData.lesson || (lessonsList[0]?.title || 'Geral'),
      duration: formData.duration,
      bpm: formData.bpm,
      lyricsEn: formData.lyricsEn,
      lyricsPt: formData.lyricsPt,
      status: 'Publicado'
    };

    if (editingSongId) {
      await songsService.updateSong(editingSongId, payload);
      const updatedSongs = songs.map((s) => (s.id === editingSongId ? savedSongObj : s));
      setSongs(updatedSongs);
      setSelectedSong(savedSongObj);
    } else {
      const res = await songsService.createSong(payload);
      if (res.data?.id) savedSongObj.id = res.data.id;
      setSongs([savedSongObj, ...songs]);
      setSelectedSong(savedSongObj);
    }

    setIsModalOpen(false);
    setShowAutoDistributeSuccess(true);
    setTimeout(() => setShowAutoDistributeSuccess(false), 5000);
  };

  // Automação: Gerar Áudios da Professora Avatar e Salvar no Google Drive
  const handleGenerateAvatarAudios = async (song) => {
    if (!song) return;

    // Obter os versos da música
    let verses = [];
    if (Array.isArray(song.timestamps) && song.timestamps.length > 0) {
      verses = [...song.timestamps];
    } else {
      const enLines = (song.lyricsEn || song.lyrics_en || '').split('\n').filter((l) => l.trim().length > 0);
      const ptLines = (song.lyricsPt || song.lyrics_pt || '').split('\n').filter((l) => l.trim().length > 0);
      verses = enLines.map((en, idx) => ({
        id: idx + 1,
        startTime: 0,
        endTime: 0,
        en: en.trim(),
        pt: (ptLines[idx] || '').trim()
      }));
    }

    if (verses.length === 0) {
      alert('Esta música não possui versos em inglês cadastrados para gerar áudios.');
      return;
    }

    if (!window.confirm(`Deseja gerar os áudios da Professora Avatar para os ${verses.length} versos de "${song.title}" e fazer o upload automático para o Google Drive?`)) {
      return;
    }

    setIsGeneratingAudios(true);
    setAudioGenToast(null);

    try {
      let successCount = 0;
      const failedVerses = [];
      const updatedVerses = [...verses];
      const folderName = song.title ? `${song.title.trim()}` : `Música ${song.id}`;
      const officialParentFolderId = '1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh';

      for (let i = 0; i < updatedVerses.length; i++) {
        const verse = updatedVerses[i];
        const verseText = (verse.en || verse.english || verse.text || '').trim();
        if (!verseText) continue;

        setAudioGenProgress({
          current: i + 1,
          total: updatedVerses.length,
          text: verseText
        });

        // Se já tiver áudio no Google Drive válido, contabiliza e pula para economizar tokens
        const existingUrl = verse.audioUrl || verse.audio_url || verse.driveUrl || verse.drive_audio_url;
        if (existingUrl && (existingUrl.includes('googleusercontent.com') || existingUrl.includes('drive.google.com'))) {
          successCount++;
          continue;
        }

        let uploadedUrl = null;
        let lastError = null;

        // Tentativa com retry (até 2 tentativas por verso)
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            // 2. Gerar áudio neural de alta fidelidade via Microsoft Azure Speech (JennyNeural)
            const audioResult = await requestAzureTTS(verseText, 'en');
            const { base64Audio } = audioResult;

            // 3. Fazer upload para a pasta no Google Drive (pasta oficial 1qOvkhY0dGx6BH3T9R4Om2SSAc17qLnmh)
            const fileName = `verse_${String(i + 1).padStart(2, '0')}.wav`;
            const driveDirectUrl = await uploadAudioToDrive({
              songId: song.id,
              fileName,
              base64: base64Audio,
              mimeType: 'audio/wav',
              parentFolderId: officialParentFolderId,
              folderName: folderName
            });

            if (driveDirectUrl && (driveDirectUrl.includes('googleusercontent.com') || driveDirectUrl.includes('drive.google.com') || driveDirectUrl.startsWith('http'))) {
              uploadedUrl = driveDirectUrl;
              break;
            } else {
              throw new Error('Link retornado do Drive inválido.');
            }
          } catch (itemErr) {
            lastError = itemErr;
            console.error(`[Erro no verso #${i + 1}] Tentativa ${attempt}/2 ("${verseText}"):`, itemErr);

            if (attempt === 1) {
              const isRateLimit = itemErr.status === 429 || (itemErr.message && itemErr.message.includes('429'));
              const retryWaitMs = isRateLimit ? 5000 : 1500;
              console.warn(`Aguardando ${retryWaitMs / 1000}s para retry no verso #${i + 1}...`);
              await new Promise((r) => setTimeout(r, retryWaitMs));
            }
          }
        }

        if (uploadedUrl) {
          // 4. Salvar URL do Google Drive no verso
          updatedVerses[i] = {
            ...verse,
            audioUrl: uploadedUrl,
            driveUrl: uploadedUrl,
            drive_audio_url: uploadedUrl
          };
          successCount++;

          // Salvar incrementalmente no Supabase a cada 5 versos para não perder progresso
          if (successCount % 5 === 0 || i === updatedVerses.length - 1) {
            try {
              await songsService.updateSong(song.id, { timestamps: updatedVerses });
            } catch (_) {}
          }
        } else {
          console.error(`Falha definitiva no verso #${i + 1}:`, lastError);
          failedVerses.push({ index: i + 1, text: verseText, error: lastError?.message || 'Falha no upload' });
        }

        // Intervalo de segurança suave de 1200ms entre uploads
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      // 5. Salvar versos finais atualizados no Supabase
      const updatePayload = {
        timestamps: updatedVerses
      };
      await songsService.updateSong(song.id, updatePayload);

      // Atualizar estado local
      const updatedSongs = songs.map((s) => (s.id === song.id ? { ...s, timestamps: updatedVerses } : s));
      setSongs(updatedSongs);
      if (selectedSong?.id === song.id) {
        setSelectedSong({ ...selectedSong, timestamps: updatedVerses });
      }

      if (failedVerses.length === 0) {
        setAudioGenToast({
          type: 'success',
          text: `🎉 Sucesso total! Todos os ${successCount}/${updatedVerses.length} versos foram salvos na pasta "${folderName}" no Google Drive! Custo ZERO garantido.`
        });
      } else {
        const failedIndices = failedVerses.map(f => `#${f.index}`).join(', ');
        setAudioGenToast({
          type: 'error',
          text: `Atenção: ${successCount} de ${updatedVerses.length} versos salvos. Falha nos versos: ${failedIndices}. Você pode clicar no botão novamente para reenviar apenas os que faltaram!`
        });
      }
      setTimeout(() => setAudioGenToast(null), 8000);

    } catch (err) {
      console.error('Erro no processamento dos áudios no Google Drive:', err);
      setAudioGenToast({
        type: 'error',
        text: `Erro ao gerar áudios no Google Drive: ${err.message || err}`
      });
    } finally {
      setIsGeneratingAudios(false);
      setAudioGenProgress({ current: 0, total: 0, text: '' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta Magic Song? Esta ação não pode ser desfeita.')) {
      return;
    }
    const res = await songsService.deleteSong(id);
    if (res?.error) {
      alert(`Erro ao excluir música: ${res.error}`);
      return;
    }
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

  // Helper: Live line counting for modal validation
  const curEnLines = (formData.lyricsEn || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const curPtLines = (formData.lyricsPt || '').split('\n').map((l) => l.trim()).filter(Boolean);

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
          onClick={handleOpenCreateModal}
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
            <span>🎉 Música salva! Distribuída automaticamente para o Player Karaokê, Voice Lab de Pronúncia, Prática Musical e Materiais!</span>
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
                          handleOpenSyncModal(song);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
                        title="Sincronizar Karaokê (Tap to Sync)"
                      >
                        <Timer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSong(song);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/20 transition-all cursor-pointer"
                        title="Editar Música"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
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

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleOpenSyncModal(selectedSong)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Timer className="w-4 h-4 text-cyan-300" />
                    <span>⏱️ Sincronizar Karaokê</span>
                  </button>

                  {/* NOVO: Gerar Áudios da Avatar no Google Drive */}
                  <button
                    type="button"
                    disabled={isGeneratingAudios}
                    onClick={() => handleGenerateAvatarAudios(selectedSong)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                    title="Gera os áudios neurais da avatar e envia para o Google Drive para custo ZERO de tokens"
                  >
                    {isGeneratingAudios ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Gerando... ({audioGenProgress.current}/{audioGenProgress.total})</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4 text-emerald-200" />
                        <span>🎙️ Gerar Áudios da Avatar (Google Drive)</span>
                      </>
                    )}
                  </button>

                  <span className="text-xs font-bold text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 4 Abas Alimentadas
                  </span>
                </div>
              </div>

              {/* Toast / Alerta de Progresso da Geração de Áudio */}
              {isGeneratingAudios && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-teal-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 flex-shrink-0" />
                    <span className="truncate">
                      Enviando para o Google Drive: <strong>{audioGenProgress.current} de {audioGenProgress.total}</strong> — <em>"{audioGenProgress.text}"</em>
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    {Math.round((audioGenProgress.current / (audioGenProgress.total || 1)) * 100)}%
                  </span>
                </div>
              )}

              {audioGenToast && (
                <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 shadow-lg animate-in fade-in ${
                  audioGenToast.type === 'error'
                    ? 'bg-red-500/15 border-red-500/30 text-red-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                }`}>
                  {audioGenToast.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                  <span>{audioGenToast.text}</span>
                </div>
              )}

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
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cadastrar Primeira Magic Song</span>
          </button>
        </div>
      )}

      {/* Modal: Cadastrar / Editar Música SSOT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#111425] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f243c]">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Music className="w-5 h-5 text-emerald-400" />
                  <span>{editingSongId ? 'Editar Magic Song (Fonte Única SSOT)' : 'Cadastrar Magic Song (Cadastro Único)'}</span>
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

              {/* Lyrics Validation Alert Banner */}
              {lyricsError && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span>Desalinhamento de Versos Bloqueado</span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-300">
                    <p>
                      A <strong>Letra em Inglês</strong> tem <span className="font-mono font-bold text-amber-300">{lyricsError.enCount} linha(s)</span> e a <strong>Tradução em Português</strong> tem <span className="font-mono font-bold text-amber-300">{lyricsError.ptCount} linha(s)</span>.
                    </p>
                    <p>
                      ⚠️ A diferença começa na <strong>Linha {lyricsError.diffLine}</strong>, onde o lado <strong>"{lyricsError.missingSide}"</strong> está sem verso correspondente para:
                    </p>
                    <div className="p-2.5 rounded-xl bg-[#0b0d18] border border-rose-500/30 text-[11px] font-mono text-rose-200 italic">
                      "{lyricsError.referenceVerse}"
                    </div>
                    <p className="text-[10px] text-slate-400 pt-0.5">
                      Para manter a sincronização perfeita verso a verso no Player Karaokê e na Prática Musical, cada linha em inglês precisa de exatamente 1 linha correspondente em português.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300 uppercase">
                      Letra em Inglês:
                    </label>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      curEnLines.length === curPtLines.length && curEnLines.length > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : curEnLines.length !== curPtLines.length && (curEnLines.length > 0 || curPtLines.length > 0)
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {curEnLines.length} {curEnLines.length === 1 ? 'linha' : 'linhas'}
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    required
                    placeholder="1 verso por linha em inglês..."
                    value={formData.lyricsEn}
                    onChange={(e) => {
                      setFormData({ ...formData, lyricsEn: e.target.value });
                      if (lyricsError) setLyricsError(null);
                    }}
                    className={`w-full bg-[#161a2e] border rounded-xl p-3 text-white text-xs font-mono resize-none focus:outline-none transition-colors ${
                      lyricsError && curEnLines.length !== curPtLines.length
                        ? 'border-rose-500/80 focus:border-rose-400'
                        : 'border-[#242b46] focus:border-purple-500'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300 uppercase">
                      Tradução em Português:
                    </label>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      curEnLines.length === curPtLines.length && curPtLines.length > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : curEnLines.length !== curPtLines.length && (curEnLines.length > 0 || curPtLines.length > 0)
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {curPtLines.length} {curPtLines.length === 1 ? 'linha' : 'linhas'}
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    required
                    placeholder="1 verso por linha em português..."
                    value={formData.lyricsPt}
                    onChange={(e) => {
                      setFormData({ ...formData, lyricsPt: e.target.value });
                      if (lyricsError) setLyricsError(null);
                    }}
                    className={`w-full bg-[#161a2e] border rounded-xl p-3 text-white text-xs font-mono resize-none focus:outline-none transition-colors ${
                      lyricsError && curEnLines.length !== curPtLines.length
                        ? 'border-rose-500/80 focus:border-rose-400'
                        : 'border-[#242b46] focus:border-purple-500'
                    }`}
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

      {/* Modal: Tap to Sync (Sincronização Manual do Karaokê) */}
      {isSyncModalOpen && syncingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-[#101323] border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[95vh] flex flex-col overflow-hidden">
            
            {/* Sync Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1f253e] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30">
                      Tap to Sync Pro
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {syncVerses.filter((v) => v.startTime !== null).length} de {syncVerses.length} versos marcados
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white truncate">
                    Sincronizar: {syncingSong.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Latency reaction offset control */}
                <div className="hidden sm:flex items-center gap-1.5 bg-[#15192c] border border-slate-800 px-2.5 py-1 rounded-xl text-xs" title="Tempo subtraído para compensar o atraso do reflexo humano ao clicar">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-400 text-[11px]">Compensação:</span>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="50"
                    value={reactionOffsetMs}
                    onChange={(e) => setReactionOffsetMs(Number(e.target.value))}
                    className="w-14 bg-[#0d0f1c] text-cyan-300 font-mono font-bold text-xs rounded px-1.5 py-0.5 border border-slate-700 text-center"
                  />
                  <span className="text-slate-500 text-[10px]">ms</span>
                </div>

                <button
                  onClick={() => setIsSyncModalOpen(false)}
                  className="p-2 rounded-xl bg-[#171b30] text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Audio Stream & Control Bar */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#15192e] to-[#0e1122] border border-[#232a48] space-y-3 flex-shrink-0">
              {syncingSong.audioUrl && (
                <audio
                  ref={syncAudioRef}
                  src={isGoogleDriveUrl(syncingSong.audioUrl) ? getDriveAudioUrl(syncingSong.audioUrl) : syncingSong.audioUrl}
                  preload="auto"
                  onTimeUpdate={(e) => setSyncCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setSyncDuration(e.currentTarget.duration)}
                  onPlay={() => setIsSyncPlaying(true)}
                  onPause={() => setIsSyncPlaying(false)}
                  onEnded={() => setIsSyncPlaying(false)}
                />
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Play / Pause & Time Indicator */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (!syncAudioRef.current) return;
                      if (isSyncPlaying) {
                        syncAudioRef.current.pause();
                      } else {
                        syncAudioRef.current.play().catch(console.warn);
                      }
                    }}
                    className="w-11 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 cursor-pointer transition-all flex-shrink-0"
                  >
                    {isSyncPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                  </button>

                  <div className="font-mono text-xs">
                    <span className="text-cyan-300 font-bold text-sm">{formatTime(syncCurrentTime)}</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-slate-400">{formatTime(syncDuration)}</span>
                  </div>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-1.5 bg-[#0e1120] p-1 rounded-xl border border-slate-800/90 self-start sm:self-auto">
                  <span className="text-[10px] font-bold text-slate-500 px-2 flex items-center gap-1">
                    <FastForward className="w-3 h-3" /> Velocidade:
                  </span>
                  {[0.5, 0.75, 1.0, 1.25].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        setPlaybackRate(rate);
                        if (syncAudioRef.current) {
                          syncAudioRef.current.playbackRate = rate;
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition-all ${
                        playbackRate === rate
                          ? 'bg-cyan-500 text-black shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-[#1a1f38]'
                      }`}
                    >
                      {rate === 1.0 ? '1.0x (Normal)' : `${rate}x`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrubber Timeline */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min="0"
                  max={syncDuration || 100}
                  step="0.05"
                  value={syncCurrentTime}
                  onChange={(e) => {
                    const newTime = Number(e.target.value);
                    setSyncCurrentTime(newTime);
                    if (syncAudioRef.current) {
                      syncAudioRef.current.currentTime = newTime;
                    }
                  }}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* Big Action Tap Area: Active Verse Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-[#181d38] to-[#101426] border-2 border-purple-500/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    Verso Atual #{currentSyncVerseIdx + 1} de {syncVerses.length}
                  </span>
                  {syncVerses[currentSyncVerseIdx]?.startTime !== null && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded">
                      Já marcado: {formatTime(syncVerses[currentSyncVerseIdx]?.startTime)}
                    </span>
                  )}
                </div>

                <p className="text-base sm:text-lg font-black text-white leading-tight">
                  🇺🇸 "{syncVerses[currentSyncVerseIdx]?.en || 'Fim de todos os versos'}"
                </p>
                <p className="text-xs text-purple-200 font-medium">
                  🇧🇷 "{syncVerses[currentSyncVerseIdx]?.pt || ''}"
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    if (!isSyncPlaying && syncAudioRef.current) {
                      syncAudioRef.current.play().catch(console.warn);
                    }
                    handleMarkVerse();
                  }}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 ring-2 ring-emerald-400/50"
                >
                  <Clock className="w-5 h-5 fill-slate-950" />
                  <span>MARCAR INÍCIO (ESPAÇO)</span>
                </button>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="px-3 py-1.5 rounded-xl bg-[#12162a] border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between flex-shrink-0">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span><strong>Como funciona:</strong> Dê Play e aperte a <strong>Barra de Espaço</strong> no momento exato em que cada verso começar a ser cantado.</span>
              </span>
              <span className="text-slate-500 hidden sm:inline font-mono">Dica: 0.75x dá precisão cirúrgica</span>
            </div>

            {/* Scrollable Verses Timeline List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
              {syncVerses.map((verse, idx) => {
                const isCurrent = currentSyncVerseIdx === idx;
                const isMarked = verse.startTime !== null;

                return (
                  <div
                    key={verse.id || idx}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-gradient-to-r from-purple-950/80 via-[#212648] to-[#15192c] border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                        : isMarked
                        ? 'bg-[#12162a] border-emerald-500/30 text-slate-300'
                        : 'bg-[#0d101e] border-slate-800/80 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs font-mono font-bold w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCurrent
                          ? 'bg-cyan-500 text-black'
                          : isMarked
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>

                      <div className="min-w-0 space-y-0.5">
                        <p className={`text-xs sm:text-sm font-bold truncate ${isCurrent ? 'text-white' : isMarked ? 'text-slate-200' : 'text-slate-400'}`}>
                          {verse.en}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {verse.pt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Timestamp Badges */}
                      <div className="font-mono text-xs text-right">
                        {isMarked ? (
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            {formatTime(verse.startTime)}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-medium px-2 py-0.5 rounded bg-slate-800/50">
                            --:--
                          </span>
                        )}
                      </div>

                      {/* Redo / Adjust button */}
                      <button
                        onClick={() => handleRedoVerse(idx)}
                        className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-cyan-500 text-black font-bold'
                            : 'bg-[#1a1f36] text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                        title="Voltar o cursor para gravar ou ajustar este verso"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span className="text-[10px] hidden sm:inline">Refazer</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-[#1f253e] flex items-center justify-between gap-3 flex-shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleResetAllSync}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resetar Todas as Marcações</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#171b30] hover:bg-[#202540] text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSavingSync}
                  onClick={handleSaveSyncTimestamps}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white text-xs font-black shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingSync ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Salvar Sincronização no Banco</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

