import React, { useState, useRef } from 'react';
import { 
  Crown, 
  Zap, 
  Flame, 
  Sparkles, 
  Trophy, 
  ShieldCheck, 
  Mail, 
  Calendar, 
  Camera, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Link2, 
  RefreshCw, 
  Upload, 
  Image as ImageIcon,
  Edit3,
  User,
  Target,
  Clock,
  Lock
} from 'lucide-react';
import XPBar from '../gamification/XPBar';
import LevelBadge from '../gamification/LevelBadge';
import { useAuth } from '../../context/AuthContext';
import { getDriveImageUrl, uploadAvatarToDrive } from '../../utils/googleDriveHelper';

export default function ProfileHeader({
  student,
  xp = 0,
  streak = 0,
  currentLevel = { level: 1, title: "First Steps", icon: "🌱", minXp: 0, maxXp: 1000 },
  nextLevel = { level: 2, title: "Music Learner", icon: "🎵", minXp: 1000, maxXp: 3000 },
  levelProgress = 0,
  xpToNextLevel = 1000,
  openEditTrigger = 0
}) {
  const { user, updateStudentAvatar, updateStudentProfile } = useAuth();
  const fileInputRef = useRef(null);
  
  // Avatar Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [avatarInputUrl, setAvatarInputUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeMode, setActiveMode] = useState('upload'); // 'upload' | 'url'

  // Edit Profile Modal States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editObjective, setEditObjective] = useState('✈️ Viajar');
  const [editDailyStudyTime, setEditDailyStudyTime] = useState('20 minutos');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');

  const {
    name = "Aluno",
    email = "",
    role = "Membro Aluno",
    avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    objective = "✈️ Viajar",
    dailyStudyTime = "20 minutos",
    joinDate = "Membro recente",
    motto = "Aprenda inglês com música e ritmo.",
    rankingInfo = { league: "Liga Bronze", tier: "Iniciante", currentRank: 99 }
  } = student || {};

  const handleOpenEditProfile = () => {
    setEditName(user?.name || name || '');
    setEditObjective(user?.objective || objective || '✈️ Viajar');
    setEditDailyStudyTime(user?.dailyStudyTime || dailyStudyTime || '20 minutos');
    setProfileSaveError('');
    setProfileSaveSuccess(false);
    setIsEditProfileOpen(true);
  };

  React.useEffect(() => {
    if (openEditTrigger > 0) {
      handleOpenEditProfile();
    }
  }, [openEditTrigger]);

  const handleSaveProfileData = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileSaveError('Por favor, informe seu nome completo.');
      return;
    }

    setIsSavingProfile(true);
    setProfileSaveError('');

    try {
      await updateStudentProfile({
        name: editName.trim(),
        objective: editObjective,
        dailyStudyTime: editDailyStudyTime
      });
      setProfileSaveSuccess(true);
      setTimeout(() => {
        setIsEditProfileOpen(false);
        setProfileSaveSuccess(false);
      }, 1500);
    } catch (err) {
      setProfileSaveError(err.message || 'Erro ao atualizar dados do perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const previewAvatar = filePreview
    ? filePreview
    : (avatarInputUrl.trim() ? getDriveImageUrl(avatarInputUrl.trim()) : avatar);

  const handleOpenModal = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setAvatarInputUrl('');
    setSaveError('');
    setSaveSuccess(false);
    setStatusMessage('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size <= 5MB
    if (file.size > 5 * 1024 * 1024) {
      setSaveError('A imagem deve ter no máximo 5MB.');
      return;
    }

    // Check format
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setSaveError('Formato inválido. Selecione uma imagem JPG, PNG ou WEBP.');
      return;
    }

    setSaveError('');
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleSaveAvatar = async (e) => {
    e.preventDefault();
    setSaveError('');

    if (activeMode === 'upload' && !selectedFile) {
      setSaveError('Por favor, selecione uma imagem do seu celular ou computador.');
      return;
    }

    if (activeMode === 'url' && !avatarInputUrl.trim()) {
      setSaveError('Por favor, informe a URL da imagem ou link do Google Drive.');
      return;
    }

    setIsSaving(true);

    try {
      let finalAvatarUrl = '';

      if (activeMode === 'upload' && selectedFile) {
        setStatusMessage('Enviando foto...');
        const currentUserId = user?.id || student?.id || 'std-current';
        finalAvatarUrl = await uploadAvatarToDrive({
          userId: currentUserId,
          file: selectedFile
        });
      } else {
        setStatusMessage('Salvando avatar...');
        finalAvatarUrl = avatarInputUrl.trim();
      }

      await updateStudentAvatar(finalAvatarUrl);
      setSaveSuccess(true);
      setStatusMessage('Foto atualizada com sucesso');
      setTimeout(() => {
        setIsModalOpen(false);
        setSaveSuccess(false);
        setStatusMessage('');
        setSelectedFile(null);
        setFilePreview(null);
      }, 1500);
    } catch (err) {
      setSaveError(err.message || 'Não foi possível enviar a imagem');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaultAvatar = async () => {
    setIsSaving(true);
    setSaveError('');
    setStatusMessage('Restaurando avatar...');
    try {
      await updateStudentAvatar('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80');
      setSaveSuccess(true);
      setStatusMessage('Foto restaurada com sucesso');
      setTimeout(() => {
        setIsModalOpen(false);
        setSaveSuccess(false);
        setStatusMessage('');
      }, 1500);
    } catch (err) {
      setSaveError(err.message || 'Erro ao restaurar avatar padrão.');
    } finally {
      setIsSaving(false);
    }
  };

  const safeXp = Number(xp) || 0;
  const safeStreak = Number(streak) || 0;
  const safeLevel = currentLevel?.level ?? 1;
  const safeTitle = currentLevel?.title || "First Steps";
  const safeIcon = currentLevel?.icon || "🌱";
  const safeMinXp = Number(currentLevel?.minXp) || 0;
  const safeMaxXp = Number(currentLevel?.maxXp) || 1000;
  const safeProgress = Number.isFinite(levelProgress) ? Math.min(100, Math.max(0, levelProgress)) : 0;
  const safeXpToNext = Number(xpToNextLevel) || 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#181c30] via-[#121526] to-[#0a0c16] border border-purple-500/35 p-6 sm:p-8 lg:p-10 shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-600/25 via-blue-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        
        {/* Left: Avatar & Identity Details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative group cursor-pointer" onClick={handleOpenModal} title="Clique para alterar sua foto de perfil">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-[2.5px] bg-gradient-to-tr from-purple-500 via-indigo-500 to-amber-400 shadow-2xl shadow-purple-600/30 overflow-hidden relative">
              <img
                src={avatar}
                alt={name}
                className="w-full h-full rounded-[22px] object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Overlay Hover Camera Button */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 rounded-[22px]">
                <Camera className="w-5 h-5 text-purple-300 animate-pulse" />
                <span className="text-[10px] font-bold">Alterar</span>
              </div>
            </div>
            
            {/* VIP Crown Medallion */}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 text-white p-2 rounded-xl shadow-lg border-2 border-[#121526]">
              <Crown className="w-4 h-4 fill-amber-300 text-amber-300" />
            </div>

            {/* Quick Edit Badge Tag */}
            <div className="absolute -top-2 -left-2 bg-purple-600/90 text-white p-1 rounded-lg shadow-md border border-purple-400/30 group-hover:scale-110 transition-transform">
              <Camera className="w-3 h-3 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {name}
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/25 to-blue-500/25 text-purple-200 border border-purple-500/40">
                {role}
              </span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {rankingInfo?.league || 'Liga Bronze'} • #{rankingInfo?.currentRank ?? 99}
              </span>

              {/* Botão Editar Perfil */}
              <button
                onClick={handleOpenEditProfile}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#161a30] hover:bg-[#1f2444] border border-purple-500/30 hover:border-purple-400 text-purple-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Editar dados pessoais"
              >
                <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                <span>Editar Perfil</span>
              </button>
            </div>

            {/* Level & Streak Quick Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <LevelBadge
                level={safeLevel}
                title={safeTitle}
                icon={safeIcon}
                variant="avatar-tag"
              />

              <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                {safeStreak} Dias Seguidos
              </span>
            </div>

            {/* Motto / Phrase */}
            <p className="text-xs sm:text-sm text-slate-300 italic font-medium pt-1">
              "{motto}"
            </p>
          </div>
        </div>

        {/* Right: XP & Next Level Progress Card */}
        <div className="w-full lg:w-96 p-5 rounded-2xl bg-[#101322]/90 border border-[#222842] space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <span className="text-base">{safeIcon}</span>
              <span>Nível {safeLevel} • {safeTitle}</span>
            </div>
            <span className="text-amber-400 font-black flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              {safeXp.toLocaleString('pt-BR')} XP
            </span>
          </div>

          <XPBar
            currentXp={safeXp}
            minXp={safeMinXp}
            maxXp={safeMaxXp}
            progress={safeProgress}
            size="md"
            showLabels={false}
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>{safeProgress}% concluído</span>
            <span className="text-purple-300 font-semibold">
              Faltam +{safeXpToNext} XP para Nível {nextLevel ? nextLevel.level : 'Max'}
            </span>
          </div>
        </div>

      </div>

      {/* Modal: Alterar Foto de Perfil (Upload Google Drive ou Link) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0e1122] border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/80 space-y-5 relative max-h-[92vh] overflow-y-auto">
            
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-bold uppercase tracking-wider">
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                <span>Foto de Perfil</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Alterar Foto de Perfil
              </h3>
              <p className="text-xs text-slate-400">
                Envie uma foto direto do celular/computador para o Google Drive ou cole um link público.
              </p>
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#14172a] border border-[#222744] rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveMode('upload')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeMode === 'upload'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Enviar do Dispositivo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('url')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeMode === 'url'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Colar Link</span>
              </button>
            </div>

            {/* Live Preview */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#14182e] border border-[#222846]">
              <div className="w-16 h-16 rounded-2xl p-[2px] bg-gradient-to-tr from-purple-500 to-amber-400 shadow-md flex-shrink-0 relative overflow-hidden">
                <img
                  src={previewAvatar}
                  alt="Prévia do Avatar"
                  className="w-full h-full rounded-[14px] object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-white">Pré-visualização da Foto</p>
                <p className="text-[11px] text-slate-400">
                  {selectedFile ? (
                    <span className="text-emerald-400 font-semibold">✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                  ) : avatarInputUrl.trim() ? (
                    <span className="text-emerald-400 font-semibold">✓ Link informado</span>
                  ) : (
                    'Exibindo foto atual da conta'
                  )}
                </p>
              </div>
            </div>

            {/* Feedback messages */}
            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{statusMessage || 'Foto atualizada com sucesso'}</span>
              </div>
            )}

            {saveError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveAvatar} className="space-y-4">
              
              {activeMode === 'upload' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Selecione a Imagem (JPG, PNG, WebP até 5MB):
                  </label>

                  {/* Hidden native input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />

                  {/* Visual Dropzone / File Picker Button */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all ${
                      selectedFile
                        ? 'border-purple-500/60 bg-purple-950/20'
                        : 'border-[#272e50] hover:border-purple-500/50 bg-[#14182e]/60 hover:bg-[#181c36]'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md">
                      {selectedFile ? <ImageIcon className="w-6 h-6 text-purple-300" /> : <Upload className="w-6 h-6 text-purple-400 animate-pulse" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {selectedFile ? 'Trocar Imagem Selecionada' : 'Clique para escolher foto do dispositivo'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Compatível com fotos da galeria do celular ou do computador
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Link do Google Drive ou URL de Imagem:
                  </label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      value={avatarInputUrl}
                      onChange={(e) => setAvatarInputUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/SEU_ID/view?usp=sharing"
                      className="w-full bg-[#161a32] border border-[#262c52] text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-600 transition-all"
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                    <p className="text-slate-500">
                      💡 Dica Google Drive: Na foto &rarr; <strong>Compartilhar</strong> &rarr; <strong>Qualquer pessoa com o link</strong> &rarr; Copie o link.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1c223a]">
                <button
                  type="button"
                  onClick={handleResetDefaultAvatar}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                >
                  Restaurar Padrão
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#14172a] hover:bg-[#1c203b] text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || (activeMode === 'upload' && !selectedFile) || (activeMode === 'url' && !avatarInputUrl.trim())}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isSaving ? (statusMessage || 'Enviando foto...') : 'Enviar Foto'}</span>
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal: Editar Dados Pessoais do Aluno (V2) */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#0e1122] border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/80 space-y-6 relative max-h-[92vh] overflow-y-auto">
            
            {/* Close button */}
            <button
              onClick={() => setIsEditProfileOpen(false)}
              disabled={isSavingProfile}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-bold uppercase tracking-wider">
                <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                <span>Perfil do Aluno V2</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Editar Dados Pessoais
              </h3>
              <p className="text-xs text-slate-400">
                Atualize seu nome de exibição e suas preferências diárias de aprendizagem.
              </p>
            </div>

            {/* Feedback messages */}
            {profileSaveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Perfil atualizado com sucesso.</span>
              </div>
            )}

            {profileSaveError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{profileSaveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfileData} className="space-y-5">
              
              {/* 1. Nome de Exibição */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nome Completo / Exibição:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full bg-[#161a32] border border-[#262c52] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-600 transition-all"
                  />
                </div>
              </div>

              {/* 2. Objetivo Principal */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-purple-400" />
                  <span>Objetivo de Estudo:</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '✈️ Viajar', label: '✈️ Viajar', desc: 'Sem medo pelo mundo' },
                    { id: '💼 Trabalho', label: '💼 Trabalho', desc: 'Carreira e mercado' },
                    { id: '🗣 Conversação', label: '🗣 Conversação', desc: 'Falar com ritmo e fluidez' },
                    { id: '🌎 Fluência', label: '🌎 Fluência', desc: 'Domínio de ponta a ponta' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEditObjective(item.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        editObjective === item.id
                          ? 'bg-purple-950/40 border-purple-500 text-white shadow-md shadow-purple-900/30'
                          : 'bg-[#14172a] border-[#222744] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <p className="text-xs font-bold">{item.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Meta de Tempo Diário */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Meta Diária de Prática:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: '10 minutos', label: '10 min', sub: 'Ritmo suave' },
                    { id: '20 minutos', label: '20 min', sub: 'Recomendado' },
                    { id: '30 minutos', label: '30 min', sub: 'Acelerado' },
                    { id: '1 hora', label: '1 hora', sub: 'Imersão total' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEditDailyStudyTime(item.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        editDailyStudyTime === item.id
                          ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md shadow-cyan-900/30'
                          : 'bg-[#14172a] border-[#222744] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <p className="text-xs font-bold">{item.label}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{item.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Dados Somente Leitura (Bloqueados) */}
              <div className="p-3.5 rounded-2xl bg-[#121528] border border-[#202540] space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Informações Acadêmicas & da Conta (Somente Leitura):</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#181c32] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Plano Ativo</span>
                    <span className="font-bold text-purple-300">{role}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#181c32] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Magic XP Total</span>
                    <span className="font-bold text-amber-300">{safeXp.toLocaleString('pt-BR')} XP</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#181c32] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Nível Acadêmico</span>
                    <span className="font-bold text-emerald-300">Nível {safeLevel}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#181c32] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Sequência</span>
                    <span className="font-bold text-amber-400">{safeStreak} Dias</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#181c32] border border-slate-800 col-span-2">
                    <span className="text-[10px] text-slate-500 block">E-mail da Conta</span>
                    <span className="font-medium text-slate-300 truncate block">{email || user?.email || 'aluno@magicenglish.com'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[#1c223a]">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  disabled={isSavingProfile}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#14172a] hover:bg-[#1c203b] text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile || !editName.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{isSavingProfile ? 'Salvando Alterações...' : 'Salvar Alterações'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
