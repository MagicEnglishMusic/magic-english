import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Settings, 
  ShieldCheck, 
  KeyRound, 
  CreditCard, 
  Crown, 
  Sparkles, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Mail, 
  Target, 
  Clock, 
  Save, 
  Zap, 
  RefreshCw,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDriveImageUrl, uploadAvatarToDrive } from '../../utils/googleDriveHelper';

export default function StudentSettingsView() {
  const { 
    user, 
    role, 
    accessStatus, 
    updateStudentProfile, 
    updateStudentAvatar, 
    updatePassword 
  } = useAuth();

  // 1. Profile Information State
  const [name, setName] = useState(user?.name || '');
  const [objective, setObjective] = useState(user?.objective || '✈️ Viajar');
  const [dailyStudyTime, setDailyStudyTime] = useState(user?.dailyStudyTime || '20 minutos');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // 2. Avatar State (Direct File Upload to Google Drive)
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarError, setAvatarError] = useState('');

  // 3. Security (Password) State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Sync with user state updates
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.objective) setObjective(user.objective);
      if (user.dailyStudyTime) setDailyStudyTime(user.dailyStudyTime);
    }
  }, [user]);

  // Handler: Save Personal Data & Goals
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim()) {
      setProfileError('Por favor, informe seu nome completo.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateStudentProfile({
        name: name.trim(),
        objective,
        dailyStudyTime
      });
      setProfileSuccess('Dados do perfil atualizados com sucesso!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      setProfileError(err.message || 'Erro ao atualizar dados do perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handler: File Selection for Avatar
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('A imagem deve ter no máximo 5MB.');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setAvatarError('Formato inválido. Use imagens JPG, PNG ou WEBP.');
      return;
    }

    setAvatarError('');
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  // Handler: Save Avatar
  const handleSaveAvatar = async (e) => {
    e.preventDefault();
    setAvatarError('');
    setAvatarSuccess('');

    if (!selectedFile) {
      setAvatarError('Por favor, selecione uma foto no seu computador ou celular.');
      return;
    }

    setIsSavingAvatar(true);
    try {
      const finalUrl = await uploadAvatarToDrive({
        userId: user?.id || 'std-current',
        file: selectedFile
      });

      await updateStudentAvatar(finalUrl);
      setAvatarSuccess('Foto de perfil atualizada com sucesso!');
      setSelectedFile(null);
      setFilePreview(null);
      setTimeout(() => setAvatarSuccess(''), 4000);
    } catch (err) {
      setAvatarError(err.message || 'Erro ao atualizar foto de perfil.');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // Handler: Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword) {
      setPasswordError('Digite a nova senha.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas digitadas não coincidem.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(newPassword);
      setPasswordSuccess('Senha atualizada com sucesso! Use a nova senha nos próximos acessos.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Erro ao atualizar senha.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Current Avatar Preview
  const currentAvatar = filePreview 
    ? filePreview 
    : (user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80');

  // Plan Badge Configuration
  const userPlan = user?.plan || 'VIP Pro';
  const getPlanBadgeConfig = (plan) => {
    switch (plan) {
      case 'VIP Premium':
        return {
          label: 'VIP Premium',
          bg: 'bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20',
          border: 'border-amber-500/40',
          text: 'text-amber-300',
          icon: Crown,
          desc: 'Acesso total ilimitado a todas as aulas, Magic Songs, IA de Conversação e materiais VIP.'
        };
      case 'VIP Pro':
        return {
          label: 'VIP Pro',
          bg: 'bg-purple-500/20',
          border: 'border-purple-500/40',
          text: 'text-purple-300',
          icon: Sparkles,
          desc: 'Acesso completo ao curso, trilhas de estudo, aulas em vídeo e prática de Magic Songs.'
        };
      case 'Membro Beta':
      case 'Beta':
        return {
          label: 'Membro Beta',
          bg: 'bg-cyan-500/20',
          border: 'border-cyan-500/40',
          text: 'text-cyan-300',
          icon: Zap,
          desc: 'Acesso antecipado ao ecossistema Magic English para testes e evolução.'
        };
      default:
        return {
          label: 'Free Trial',
          bg: 'bg-slate-700/40',
          border: 'border-slate-600',
          text: 'text-slate-300',
          icon: Award,
          desc: 'Plano inicial de degustação e avaliação das ferramentas essenciais.'
        };
    }
  };

  const planBadge = getPlanBadgeConfig(userPlan);
  const PlanIcon = planBadge.icon;
  const currentStatus = accessStatus || user?.accessStatus || 'active';

  return (
    <div className="flex-1 w-full flex flex-col bg-[#08090e] min-h-screen text-slate-100">
      
      {/* Top Banner / Header */}
      <div className="border-b border-[#1a1e32] bg-[#0c0e17]/80 backdrop-blur-md px-6 sm:px-10 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Área do Aluno
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-medium">Painel de Preferências</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Settings className="w-7 h-7 text-purple-400" />
              Configurações da Conta
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Gerencie seus dados pessoais, foto de perfil, preferências de aprendizagem, segurança e informações da sua assinatura.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="px-4 py-2 rounded-xl bg-[#121526] border border-[#1e2338] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <PlanIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Seu Plano</p>
                <p className="text-xs font-bold text-purple-300">{planBadge.label}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="p-6 sm:p-10 max-w-6xl mx-auto w-full space-y-8 pb-20">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ============================================================ */}
          {/* COLUMN LEFT (5 Cols): Avatar & Assinatura                     */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* CARD 1: Foto de Perfil (Avatar) */}
            <div className="bg-[#0c0e17] rounded-2xl border border-[#1a1e32] p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1a1e32]">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Foto de Perfil</h2>
                  <p className="text-xs text-slate-400">Personalize seu avatar no ranking e comunidade</p>
                </div>
              </div>

              {/* Avatar Preview & Upload Action */}
              <div className="flex flex-col items-center text-center space-y-4 mb-6">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-xl shadow-purple-600/20 bg-[#121526]">
                    <img 
                      src={currentAvatar} 
                      alt={user?.name || "Avatar"} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg border border-purple-400/50 transition-all cursor-pointer"
                    title="Carregar imagem do celular/computador"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <p className="text-xs font-semibold text-white">{user?.name || 'Aluno Magic'}</p>
                  <p className="text-[11px] text-slate-400">{user?.email || ''}</p>
                </div>
              </div>

              {/* Direct File Upload Selection Area */}
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#1e2338] hover:border-purple-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#121526]/50"
                >
                  <Upload className="w-6 h-6 text-purple-400 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-slate-300">
                    {selectedFile ? selectedFile.name : 'Clique para escolher uma imagem'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    JPG, PNG ou WEBP (Máximo 5MB)
                  </p>
                </div>
              </div>

              {/* Feedbacks */}
              {avatarSuccess && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{avatarSuccess}</span>
                </div>
              )}
              {avatarError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{avatarError}</span>
                </div>
              )}

              {/* Save Avatar Button */}
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={isSavingAvatar || !selectedFile}
                className="mt-5 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 cursor-pointer"
              >
                {isSavingAvatar ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando Foto...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Atualizar Foto de Perfil</span>
                  </>
                )}
              </button>
            </div>

            {/* CARD 2: Minha Assinatura & Acesso */}
            <div className="bg-[#0c0e17] rounded-2xl border border-[#1a1e32] p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1a1e32]">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Minha Assinatura</h2>
                  <p className="text-xs text-slate-400">Status do plano e detalhes da matrícula</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${planBadge.border} ${planBadge.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <PlanIcon className={`w-5 h-5 ${planBadge.text}`} />
                      <span className={`text-sm font-extrabold ${planBadge.text}`}>
                        {planBadge.label}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      currentStatus === 'active' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {currentStatus === 'active' ? 'Ativo' : 'Pendente'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {planBadge.desc}
                  </p>
                </div>

                <div className="bg-[#121526] p-3.5 rounded-xl border border-[#1e2338] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Produto Vinculado:</span>
                    <span className="font-semibold text-white">Magic English VIP</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Identificador / Pedido:</span>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {user?.kiwifyData?.orderId || 'KW-ONLINE-ACTIVE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Nível de Acesso:</span>
                    <span className="font-semibold text-purple-300 capitalize">
                      {role === 'admin' ? 'Administrador' : 'Aluno Regular'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-[11px] text-purple-300/80 leading-relaxed">
                  💡 Sua assinatura é gerenciada de forma segura e sincronizada com as suas aulas e progresso. Dúvidas comerciais podem ser tratadas com o suporte.
                </div>
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* COLUMN RIGHT (7 Cols): Perfil & Segurança                     */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* CARD 3: Informações do Perfil & Preferências */}
            <form onSubmit={handleSaveProfile} className="bg-[#0c0e17] rounded-2xl border border-[#1a1e32] p-6 shadow-xl relative">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1a1e32]">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Dados do Perfil</h2>
                  <p className="text-xs text-slate-400">Atualize seu nome e preferências diárias de estudo</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Nome Completo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#121526] border border-[#1e2338] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Email (Read-only) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Email de Acesso
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">Vinculado à matrícula</span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#121526]/50 border border-[#1e2338] text-xs text-slate-400 cursor-not-allowed opacity-80"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Objetivo Principal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-purple-400" />
                    Objetivo Principal de Aprendizado
                  </label>
                  <select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121526] border border-[#1e2338] text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="✈️ Viajar">✈️ Viajar — Comunicar-se com confiança em viagens internacionais</option>
                    <option value="💼 Trabalho">💼 Trabalho — Carreira, reuniões e oportunidades corporativas</option>
                    <option value="🗣 Conversação">🗣 Conversação — Falar com naturalidade e perder a vergonha</option>
                    <option value="🌎 Fluência">🌎 Fluência — Compreensão avançada de músicas, séries e cultura</option>
                    <option value="🎓 Estudos">🎓 Estudos — Artigos científicos, certificações e intercâmbio</option>
                    <option value="🚀 Desenvolvimento Pessoal">🚀 Desenvolvimento Pessoal — Crescimento e aprendizado contínuo</option>
                  </select>
                </div>

                {/* Meta Diária de Estudo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Meta Diária de Dedicação
                  </label>
                  <select
                    value={dailyStudyTime}
                    onChange={(e) => setDailyStudyTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121526] border border-[#1e2338] text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="15 minutos">15 minutos / dia (Ritmo Leve)</option>
                    <option value="20 minutos">20 minutos / dia (Recomendado)</option>
                    <option value="30 minutos">30 minutos / dia (Focado)</option>
                    <option value="45 minutos">45 minutos / dia (Intensivo)</option>
                    <option value="60 minutos">60 minutos / dia (Acelerado VIP)</option>
                  </select>
                </div>

                {/* Feedback Messages */}
                {profileSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-xs animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}
                {profileError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs animate-in fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                {/* Save Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 cursor-pointer"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando Perfil...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Salvar Alterações do Perfil</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* CARD 4: Segurança & Alterar Senha */}
            <form onSubmit={handleUpdatePassword} className="bg-[#0c0e17] rounded-2xl border border-[#1a1e32] p-6 shadow-xl relative">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1a1e32]">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Segurança & Senha</h2>
                  <p className="text-xs text-slate-400">Altere sua senha de acesso à plataforma Magic English</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Nova Senha */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#121526] border border-[#1e2338] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Nova Senha */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#121526] border border-[#1e2338] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Password Feedbacks */}
                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-xs animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}
                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs animate-in fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {/* Submit Password Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                    className="w-full py-2.5 rounded-xl bg-[#1e2338] hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center justify-center gap-2 border border-purple-500/30 shadow-md cursor-pointer"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Atualizando Senha...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Atualizar Minha Senha</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

          </div>

        </div>

      </div>

    </div>
  );
}
