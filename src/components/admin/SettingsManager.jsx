import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  Database, 
  Globe, 
  User, 
  Lock, 
  Key, 
  ToggleLeft, 
  ToggleRight, 
  BookOpen, 
  Mic, 
  MessageSquare, 
  Trophy, 
  Award, 
  Server, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Music,
  Tv,
  Layers,
  FileText,
  Volume2,
  RefreshCw,
  Eye,
  EyeOff,
  Image,
  Folder,
  FolderOpen,
  ExternalLink,
  Link,
  Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { communityService } from '../../services/communityService';
import { permissionService, DEFAULT_PLAN_RULES } from '../../services/permissionService';
import { DEFAULT_UPGRADE_SETTINGS } from '../common/UpgradeModal';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

export default function SettingsManager() {
  const { user, role, updatePassword, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [saveToast, setSaveToast] = useState(null);

  // 1. General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'Magic English',
    platformSlogan: 'Aprenda Inglês com Música e Metodologia Ativa',
    platformStatus: 'active', // 'active' | 'maintenance'
    globalBannerEnabled: false,
    globalBannerText: 'Bem-vindo ao Magic English V4.1! Novas músicas disponíveis esta semana.',
    registrationOpen: true
  });

  // 2. Admin Account Visual Form State
  const [adminAccount, setAdminAccount] = useState({
    name: user?.name || user?.user_metadata?.full_name || 'Administrador Geral',
    email: user?.email || 'magicenglishmusic@gmail.com',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Sync admin user profile data
  useEffect(() => {
    if (user) {
      setAdminAccount((prev) => ({
        ...prev,
        name: user.name || user.user_metadata?.full_name || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  // 3. Feature Flags / Toggles State
  const [features, setFeatures] = useState({
    enableMagicSongs: true,
    enablePronunciationAI: true,
    enableMagicConversation: true,
    enableCommunity: true,
    enableRanking: true,
    enableGamification: true,
    enablePdfMaterials: true
  });

  // 4. Pedagogy Settings State
  const [pedagogy, setPedagogy] = useState({
    moduleUnlockMode: 'sequential', // 'sequential' | 'free'
    requireVideoCompletion: true,
    strictConversationWhitelist: true,
    autoAdvanceLessons: false
  });

  // 5. AI & Voice Lab Settings State
  const [voiceSettings, setVoiceSettings] = useState({
    minAccuracyScore: 80,
    ttsSpeed: '0.9',
    toleranceMode: 'balanced', // 'gentle' | 'balanced' | 'strict'
    autoPlayReferenceAudio: true
  });

  // 6. Community Settings State
  const [communitySettings, setCommunitySettings] = useState({
    isFeedActive: true,
    isPostingEnabled: true,
    status: 'active', // 'active' | 'maintenance'
    maxPostLength: 500
  });

  // 7. Gamification Settings State
  const [gamificationDisplay, setGamificationDisplay] = useState({
    showUserXpHeader: true,
    showRankings: true,
    showBadges: true,
    showLevelCelebrations: true
  });

  // 8. Ranking Settings State
  const [rankingSettings, setRankingSettings] = useState({
    isRankingActive: true,
    displayLimit: 50,
    weeklyResetDay: 'Sunday',
    excludeAdminFromRanking: true
  });

  // 9. Media Settings State (Google Drive Public URLs)
  const [mediaSettings, setMediaSettings] = useState({
    globalBannerUrl: '',
    communityBannerUrl: '',
    logoUrl: '',
    faviconUrl: '',
    defaultSongCoverUrl: '',
    publicMaterialsFolderUrl: ''
  });

  // 10. Material Settings State
  const [materialSettings, setMaterialSettings] = useState({
    isMaterialsActive: true,
    publicDriveFolderUrl: ''
  });

  // 11. Plan Rules & Permissions State
  const [planRulesSettings, setPlanRulesSettings] = useState(DEFAULT_PLAN_RULES);

  // 12. Upgrade & Checkout Settings State
  const [upgradeSettings, setUpgradeSettings] = useState(DEFAULT_UPGRADE_SETTINGS);

  // Load existing settings from app_settings on mount
  useEffect(() => {
    // 1. General Settings
    communityService.getAppSettings('general_settings').then((res) => {
      if (res?.data && typeof res.data === 'object') {
        setGeneralSettings((prev) => ({ ...prev, ...res.data }));
      }
    });

    // 2. Ranking Settings
    communityService.getAppSettings('ranking_settings').then((res) => {
      if (res?.data && typeof res.data === 'object') {
        setRankingSettings((prev) => ({ ...prev, ...res.data }));
      }
    });

    // 3. Community Settings
    communityService.fetchCommunitySettings().then((remote) => {
      if (remote) {
        setCommunitySettings((prev) => ({
          ...prev,
          ...remote
        }));
      }
    });

    // 4. Media Settings
    communityService.getAppSettings('media_settings').then((res) => {
      if (res?.data && typeof res.data === 'object') {
        setMediaSettings((prev) => ({ ...prev, ...res.data }));
      }
    });

    // 5. Material Settings
    communityService.getAppSettings('material_settings').then((res) => {
      if (res?.data && typeof res.data === 'object') {
        setMaterialSettings((prev) => ({ ...prev, ...res.data }));
      }
    });

    // 6. Plan Rules & Permissions Settings
    permissionService.loadPlanRules().then((rules) => {
      if (rules) {
        setPlanRulesSettings(rules);
      }
    });

    // 7. Upgrade & Checkout Settings
    communityService.getAppSettings('upgrade_settings').then((res) => {
      if (res?.data && typeof res.data === 'object') {
        setUpgradeSettings((prev) => ({ ...prev, ...res.data }));
      }
    });

    // 8. Feature Flags
    communityService.getAppSettings('feature_flags').then((res) => {
      if (res?.data && typeof res.data === 'object') {
        setFeatures((prev) => ({ ...prev, ...res.data }));
      }
    });

    // 9. Gamification Display Settings
    communityService.getAppSettings('gamification_display').then((res) => {
      if (res?.data && typeof res.data === 'object') {
        setGamificationDisplay((prev) => ({ ...prev, ...res.data }));
      }
    });

    // 10. Pedagogy Settings
    communityService.getAppSettings('pedagogy_settings').then((res) => {
      if (res?.data && typeof res.data === 'object') {
        setPedagogy((prev) => ({ ...prev, ...res.data }));
      }
    });

    // 11. Voice & AI Settings
    communityService.getAppSettings('voice_settings').then((res) => {
      if (res?.data && typeof res.data === 'object') {
        setVoiceSettings((prev) => ({ ...prev, ...res.data }));
      }
    });
  }, []);

  const triggerToast = (message, type = 'success') => {
    setSaveToast({ message, type });
    setTimeout(() => setSaveToast(null), 3500);
  };

  // 1. Save Admin Name in profiles & Supabase Auth metadata
  const handleSaveAdminName = async () => {
    if (!adminAccount.name.trim()) {
      triggerToast('O nome do administrador não pode ficar em branco.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      if (isSupabaseConfigured && user?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            name: adminAccount.name.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (profileError) throw profileError;

        await supabase.auth.updateUser({
          data: {
            name: adminAccount.name.trim(),
            full_name: adminAccount.name.trim()
          }
        });

        if (refreshSession) await refreshSession();
      }
      triggerToast('Nome do administrador atualizado com sucesso no perfil!');
    } catch (err) {
      console.error('Erro ao atualizar nome do admin:', err);
      triggerToast(err.message || 'Erro ao atualizar nome.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Change Admin Password via Supabase Auth
  const handleUpdateAdminPassword = async (e) => {
    if (e) e.preventDefault();
    if (!adminAccount.newPassword) {
      triggerToast('Digite a nova senha.', 'error');
      return;
    }
    if (adminAccount.newPassword.length < 6) {
      triggerToast('A nova senha deve possuir no mínimo 6 caracteres.', 'error');
      return;
    }
    if (adminAccount.newPassword !== adminAccount.confirmPassword) {
      triggerToast('A confirmação de senha não coincide com a nova senha.', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (updatePassword) {
        await updatePassword(adminAccount.newPassword);
      } else if (isSupabaseConfigured) {
        const { error } = await supabase.auth.updateUser({
          password: adminAccount.newPassword
        });
        if (error) throw error;
      }
      setAdminAccount((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
      triggerToast('Senha de administrador atualizada com sucesso no Supabase Auth!');
    } catch (err) {
      console.error('Erro ao alterar senha de admin:', err);
      triggerToast(err.message || 'Erro ao atualizar senha no Supabase Auth.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveActiveTabSettings = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'general') {
        await communityService.updateAppSettings('general_settings', generalSettings);
        triggerToast('Configurações Gerais salvas com sucesso em app_settings!');
      } else if (activeTab === 'ranking') {
        await communityService.updateAppSettings('ranking_settings', rankingSettings);
        triggerToast('Configurações de Ranking salvas com sucesso em app_settings!');
      } else if (activeTab === 'community') {
        await communityService.updateCommunitySettings(communitySettings);
        triggerToast('Configurações da Comunidade salvas com sucesso em app_settings!');
      } else if (activeTab === 'media') {
        await communityService.updateAppSettings('media_settings', mediaSettings);
        if (mediaSettings.publicMaterialsFolderUrl) {
          await communityService.updateAppSettings('material_settings', {
            ...materialSettings,
            publicDriveFolderUrl: mediaSettings.publicMaterialsFolderUrl
          });
        }
        triggerToast('Configurações de Mídias (Google Drive) salvas com sucesso!');
      } else if (activeTab === 'features') {
        await communityService.updateAppSettings('feature_flags', features);
        triggerToast('Status de Funcionalidades salvo com sucesso em app_settings!');
      } else if (activeTab === 'plans') {
        await permissionService.savePlanRules(planRulesSettings);
        await communityService.updateAppSettings('upgrade_settings', upgradeSettings);
        triggerToast('Regras de Planos e Checkout Kiwify salvas com sucesso em app_settings!');
      } else if (activeTab === 'gamification') {
        await communityService.updateAppSettings('gamification_display', gamificationDisplay);
        triggerToast('Configurações visuais de Gamificação salvas com sucesso em app_settings!');
      } else if (activeTab === 'pedagogy') {
        await communityService.updateAppSettings('pedagogy_settings', pedagogy);
        triggerToast('Configurações Pedagógicas salvas com sucesso em app_settings!');
      } else if (activeTab === 'voice') {
        await communityService.updateAppSettings('voice_settings', voiceSettings);
        triggerToast('Configurações de Reconhecimento de Voz & IA salvas com sucesso em app_settings!');
      } else if (activeTab === 'account') {
        await handleSaveAdminName();
      } else {
        triggerToast(`Configurações de "${tabs.find((t) => t.id === activeTab)?.label || activeTab}" salvas!`);
      }
    } catch (err) {
      console.warn('Aviso ao salvar configurações:', err);
      triggerToast('Configurações atualizadas localmente.', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: '1. Geral & Plataforma', icon: Globe },
    { id: 'account', label: '2. Minha Conta Admin', icon: User },
    { id: 'plans', label: '3. Planos & Permissões', icon: Crown },
    { id: 'features', label: '4. Funcionalidades', icon: Sliders },
    { id: 'media', label: '5. Mídias (Google Drive)', icon: Image },
    { id: 'pedagogy', label: '6. Pedagógico', icon: BookOpen },
    { id: 'voice', label: '7. IA & Pronúncia', icon: Mic },
    { id: 'community', label: '8. Comunidade', icon: MessageSquare },
    { id: 'gamification', label: '9. Gamificação', icon: Trophy },
    { id: 'ranking', label: '10. Ranking', icon: Award },
    { id: 'system', label: '11. Sistema & Status', icon: Server }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Toast Feedback */}
      {saveToast && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#161a32] border shadow-2xl text-white text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 max-w-md ${
          saveToast.type === 'error' ? 'border-rose-500/60' : 'border-purple-500/60'
        }`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
            saveToast.type === 'error' ? 'bg-rose-600/30 text-rose-400' : 'bg-purple-600/30 text-emerald-400'
          }`}>
            {saveToast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
          <span>{saveToast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f243c]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[10px] font-extrabold uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Central Administrativa V4.1</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-400" />
            <span>Configurações da Plataforma</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie parâmetros globais, controles visuais, recursos pedagógicos e permissões do sistema.
          </p>
        </div>

        <button
          onClick={handleSaveActiveTabSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 cursor-pointer transition-all self-start sm:self-auto disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Salvar Alterações</span>
        </button>
      </div>

      {/* Tab Navigation Grid */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#181c30]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-md shadow-purple-900/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#121526] border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content Panel */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#111425] border border-[#1e233b] shadow-2xl space-y-6">

        {/* 1. Geral & Plataforma */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-400" />
                <span>Identidade & Status da Plataforma</span>
              </h3>
              <p className="text-xs text-slate-400">Personalize o nome, slogan institucional e controle o banner de avisos globais.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Nome da Plataforma</label>
                <input
                  type="text"
                  value={generalSettings.platformName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, platformName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0c0e1a] border border-[#222842] text-white text-xs font-semibold focus:border-purple-500 focus:outline-none"
                  placeholder="Magic English"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Slogan Institucional</label>
                <input
                  type="text"
                  value={generalSettings.platformSlogan}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, platformSlogan: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0c0e1a] border border-[#222842] text-white text-xs font-semibold focus:border-purple-500 focus:outline-none"
                  placeholder="Aprenda Inglês com Música"
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Banner Global de Avisos</h4>
                  <p className="text-xs text-slate-400">Exibe uma faixa de anúncio para todos os alunos no topo do aplicativo.</p>
                </div>
                <button
                  onClick={() => setGeneralSettings({ ...generalSettings, globalBannerEnabled: !generalSettings.globalBannerEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    generalSettings.globalBannerEnabled ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    generalSettings.globalBannerEnabled ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              {generalSettings.globalBannerEnabled && (
                <div className="space-y-2 pt-2 border-t border-[#1c223c]">
                  <label className="text-xs font-bold text-slate-300">Texto do Anúncio</label>
                  <input
                    type="text"
                    value={generalSettings.globalBannerText}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, globalBannerText: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080a14] border border-[#222842] text-white text-xs focus:border-purple-500 focus:outline-none"
                    placeholder="Digite a mensagem que aparecerá no topo para os alunos..."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Minha Conta Admin */}
        {activeTab === 'account' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                <span>Credenciais do Administrador Geral</span>
              </h3>
              <p className="text-xs text-slate-400">Visualize e gerencie os dados institucionais da sua conta administrativa.</p>
            </div>

            {/* Session Info Card */}
            <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 p-[2px]">
                    <div className="w-full h-full bg-[#0a0c16] rounded-[10px] flex items-center justify-center font-black text-xs text-amber-300">
                      AD
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{user?.name || adminAccount.name}</span>
                      <span className="text-[10px] font-black text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                        Super Admin
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">{user?.email || adminAccount.email}</p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sessão Ativa Supabase</span>
                </div>
              </div>
            </div>

            {/* Edit Display Name */}
            <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <User className="w-4 h-4 text-purple-400" />
                <span>Nome de Exibição Institucional</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-8 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Nome Completo</label>
                  <input
                    type="text"
                    value={adminAccount.name}
                    onChange={(e) => setAdminAccount({ ...adminAccount, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080a14] border border-[#222842] text-white text-xs font-semibold focus:border-purple-500 focus:outline-none"
                    placeholder="Seu nome de administrador"
                  />
                </div>

                <div className="sm:col-span-4">
                  <button
                    onClick={handleSaveAdminName}
                    disabled={isSaving}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Salvar Nome</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handleUpdateAdminPassword} className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Segurança & Redefinição de Senha (Supabase Auth)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Digite uma nova senha segura com no mínimo 6 caracteres para atualizar suas credenciais.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Nova Senha Administrativa</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminAccount.newPassword}
                      onChange={(e) => setAdminAccount({ ...adminAccount, newPassword: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#080a14] border border-[#222842] text-white text-xs focus:border-amber-500 focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Confirmar Nova Senha</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminAccount.confirmPassword}
                    onChange={(e) => setAdminAccount({ ...adminAccount, confirmPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080a14] border border-[#222842] text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !adminAccount.newPassword}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdatingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                  <span>Atualizar Senha no Supabase Auth</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. Planos & Permissões */}
        {activeTab === 'plans' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span>Controle de Planos & Permissões Comerciais</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Configure limites e permissões por plano (Free Trial, Membro Beta, VIP Pro, VIP Premium).
                </p>
              </div>

              <div
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  planRulesSettings.enabled
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    planRulesSettings.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>
                  {planRulesSettings.enabled
                    ? 'Motor Ativo (Bloqueio Habilitado)'
                    : 'Modo Simulação (Sem Bloqueios Reais)'}
                </span>
              </div>
            </div>

            {/* Master Toggle */}
            <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Ativar Restrições Comerciais por Plano</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  {planRulesSettings.enabled
                    ? 'Quando ATIVO, alunos com plano Free Trial sofrerão as limitações configuradas abaixo.'
                    : 'Quando DESATIVADO (Modo Simulação), todos os alunos acessam normalmente os recursos da plataforma.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlanRulesSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
                className={`w-14 h-8 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${
                  planRulesSettings.enabled ? 'bg-purple-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-transform shadow-md ${
                    planRulesSettings.enabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Free Trial Config Card */}
            <div className="p-6 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-5">
              <div className="flex items-center justify-between border-b border-[#1f243c] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-300">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Magic Free Trial (Degustação / Gratuito)</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                        Plano Grátis
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Regras e limites aplicados aos alunos que ainda não possuem assinatura VIP.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Músicas Liberadas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-purple-400" />
                    <span>Músicas Liberadas (Magic Songs)</span>
                  </label>
                  <select
                    value={planRulesSettings.rules?.free?.maxSongs ?? 2}
                    onChange={(e) =>
                      setPlanRulesSettings((prev) => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          free: { ...prev.rules.free, maxSongs: Number(e.target.value) }
                        }
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0e1a] border border-[#222842] text-white text-xs font-semibold focus:border-purple-500 focus:outline-none"
                  >
                    <option value={1}>1 Música Liberada</option>
                    <option value={2}>2 Músicas Liberadas (Padrão)</option>
                    <option value={3}>3 Músicas Liberadas</option>
                    <option value={5}>5 Músicas Liberadas</option>
                    <option value={999}>Todas as Músicas (Ilimitado)</option>
                  </select>
                </div>

                {/* Pronúncia IA Diária */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Avaliações de Pronúncia IA / Dia</span>
                  </label>
                  <select
                    value={planRulesSettings.rules?.free?.maxPronunciationDaily ?? 5}
                    onChange={(e) =>
                      setPlanRulesSettings((prev) => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          free: { ...prev.rules.free, maxPronunciationDaily: Number(e.target.value) }
                        }
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0e1a] border border-[#222842] text-white text-xs font-semibold focus:border-purple-500 focus:outline-none"
                  >
                    <option value={3}>3 tentativas / dia</option>
                    <option value={5}>5 tentativas / dia (Padrão)</option>
                    <option value={10}>10 tentativas / dia</option>
                    <option value={999}>Ilimitado</option>
                  </select>
                </div>

                {/* Magic Conversation Diária */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Mensagens Magic Conversation / Dia</span>
                  </label>
                  <select
                    value={planRulesSettings.rules?.free?.maxConversationDaily ?? 5}
                    onChange={(e) =>
                      setPlanRulesSettings((prev) => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          free: { ...prev.rules.free, maxConversationDaily: Number(e.target.value) }
                        }
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0e1a] border border-[#222842] text-white text-xs font-semibold focus:border-purple-500 focus:outline-none"
                  >
                    <option value={0}>Bloqueado para Free</option>
                    <option value={3}>3 mensagens / dia</option>
                    <option value={5}>5 mensagens / dia (Padrão)</option>
                    <option value={10}>10 mensagens / dia</option>
                  </select>
                </div>

                {/* Modo de Conversação */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Modo do Magic Conversation</span>
                  </label>
                  <select
                    value={planRulesSettings.rules?.free?.conversationMode || 'guided'}
                    onChange={(e) =>
                      setPlanRulesSettings((prev) => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          free: { ...prev.rules.free, conversationMode: e.target.value }
                        }
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0e1a] border border-[#222842] text-white text-xs font-semibold focus:border-purple-500 focus:outline-none"
                  >
                    <option value="guided">Apenas Diálogos Guiados (Padrão Free)</option>
                    <option value="full">Chat Livre + Cenários</option>
                  </select>
                </div>

                {/* Download de Materiais / PDFs */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download de Materiais / PDFs</span>
                  </label>
                  <div className="p-2.5 rounded-xl bg-[#0c0e1a] border border-[#222842] flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      {planRulesSettings.rules?.free?.allowPdfDownload ? 'Liberado para Free' : 'Bloqueado (Apenas VIP)'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPlanRulesSettings((prev) => ({
                          ...prev,
                          rules: {
                            ...prev.rules,
                            free: { ...prev.rules.free, allowPdfDownload: !prev.rules.free?.allowPdfDownload }
                          }
                        }))
                      }
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                        planRulesSettings.rules?.free?.allowPdfDownload ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          planRulesSettings.rules?.free?.allowPdfDownload ? 'left-5' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Acesso a Módulos */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>Módulos de Curso Liberados</span>
                  </label>
                  <select
                    value={planRulesSettings.rules?.free?.maxModules ?? 1}
                    onChange={(e) =>
                      setPlanRulesSettings((prev) => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          free: { ...prev.rules.free, maxModules: Number(e.target.value) }
                        }
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0e1a] border border-[#222842] text-white text-xs font-semibold focus:border-purple-500 focus:outline-none"
                  >
                    <option value={1}>Apenas Módulo 1 (Fundamentos)</option>
                    <option value={2}>Módulos 1 e 2</option>
                    <option value={999}>Todos os Módulos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Paid / VIP Plans Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Membro Beta */}
              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-cyan-500/20 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-[10px] font-black text-cyan-300 uppercase tracking-wide">
                    Membro Beta
                  </span>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Acesso Total Promocional</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Alunos pioneiros do lançamento.</p>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-[#1f243c]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>Todos os Módulos & Aulas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>Todas as Músicas Liberadas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>Pronúncia IA Ilimitada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>Download de Todos os PDFs</span>
                  </li>
                </ul>
              </div>

              {/* VIP Pro */}
              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-purple-500/20 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-[10px] font-black text-purple-300 uppercase tracking-wide">
                    VIP Pro
                  </span>
                  <Crown className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Assinatura Anual Completa</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Plano padrão dos alunos Kiwify.</p>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-[#1f243c]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span>Acesso completo a todos os módulos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span>Magic Songs & Pronúncia ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span>50 mensagens/dia no Conversation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span>Download de PDFs & Materiais</span>
                  </li>
                </ul>
              </div>

              {/* VIP Premium */}
              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-amber-500/20 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-[10px] font-black text-amber-300 uppercase tracking-wide">
                    VIP Premium
                  </span>
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Acesso Vitalício & Ilimitado</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Plano de nível máximo sem qualquer cota.</p>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-[#1f243c]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>100% dos recursos sem limite diário</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Magic Conversation Ilimitado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Acesso antecipado a novas músicas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Suporte VIP e selo exclusivo</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Upgrade & Kiwify Checkout Settings Card */}
            <div className="p-6 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f243c] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Experiência de Upgrade & Checkout Kiwify</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                        UpgradeModal V4.1
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Configure os textos da janela de upgrade exibida aos alunos Free e o link de pagamento Kiwify.
                    </p>
                  </div>
                </div>

                {upgradeSettings.checkoutUrl && (
                  <a
                    href={upgradeSettings.checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14182b] hover:bg-[#1c223d] border border-purple-500/30 text-purple-300 text-xs font-bold transition-all shadow-md self-start sm:self-auto"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Testar Link Kiwify</span>
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Título do Modal de Upgrade</label>
                  <input
                    type="text"
                    value={upgradeSettings.title || ''}
                    onChange={(e) => setUpgradeSettings({ ...upgradeSettings, title: e.target.value })}
                    placeholder="Desbloqueie todo o potencial do Magic English"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0e1a] border border-[#222842] text-white text-xs font-semibold focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Texto do Botão de Ação (CTA)</label>
                  <input
                    type="text"
                    value={upgradeSettings.buttonText || ''}
                    onChange={(e) => setUpgradeSettings({ ...upgradeSettings, buttonText: e.target.value })}
                    placeholder="Quero ser VIP Pro"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0e1a] border border-[#222842] text-white text-xs font-semibold focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-300">Subtítulo / Descrição de Benefícios</label>
                  <input
                    type="text"
                    value={upgradeSettings.subtitle || ''}
                    onChange={(e) => setUpgradeSettings({ ...upgradeSettings, subtitle: e.target.value })}
                    placeholder="Tenha acesso irrestrito a todos os módulos, músicas, pronúncia com IA e apostilas em PDF."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0e1a] border border-[#222842] text-white text-xs font-semibold focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5 text-amber-400" />
                      <span>URL do Checkout Kiwify (Link de Pagamento)</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Ex: https://pay.kiwify.com.br/...</span>
                  </label>
                  <input
                    type="url"
                    value={upgradeSettings.checkoutUrl || ''}
                    onChange={(e) => setUpgradeSettings({ ...upgradeSettings, checkoutUrl: e.target.value })}
                    placeholder="https://pay.kiwify.com.br/magic-english-vip-pro"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0e1a] border border-[#222842] text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Funcionalidades (Feature Switches) */}
        {activeTab === 'features' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <span>Módulos & Recursos Ativos da Plataforma</span>
              </h3>
              <p className="text-xs text-slate-400">Ative ou pause módulos inteiros do sistema para a visualização dos alunos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {[
                { key: 'enableMagicSongs', title: 'Magic Songs (Player & Karaokê)', desc: 'Player interativo de músicas com letras e sincronia.', icon: Music },
                { key: 'enablePronunciationAI', title: 'Pronúncia IA (Voice Lab)', desc: 'Avaliação em tempo real de reconhecimento de voz.', icon: Mic },
                { key: 'enableMagicConversation', title: 'Magic Conversation Room', desc: 'Prática diária de conversação contextual e áudio TTS.', icon: MessageSquare },
                { key: 'enableCommunity', title: 'Mural da Comunidade & Feed', desc: 'Feed de evolução, grupos e interações sociais.', icon: Globe },
                { key: 'enableRanking', title: 'Ranking Semanal & Geral', desc: 'Classificação global dos alunos mais dedicados.', icon: Award },
                { key: 'enableGamification', title: 'Gamificação & Recompensas Magic XP', desc: 'Concessão atômica de XP e desbloqueio de níveis.', icon: Trophy },
                { key: 'enablePdfMaterials', title: 'Materiais & Apostilas PDF', desc: 'Download e leitura de materiais complementares.', icon: FileText },
              ].map((feat) => {
                const Icon = feat.icon;
                const isEnabled = features[feat.key];
                return (
                  <div
                    key={feat.key}
                    className="p-4 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{feat.title}</h4>
                        <p className="text-[11px] text-slate-400">{feat.desc}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setFeatures({ ...features, [feat.key]: !isEnabled })}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                        isEnabled ? 'bg-purple-600' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        isEnabled ? 'left-6' : 'left-1'
                      }`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Mídias (Google Drive) */}
        {activeTab === 'media' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Image className="w-5 h-5 text-blue-400" />
                <span>Mídias & Banners da Plataforma (Google Drive)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure os links públicos do Google Drive para banners, logos e capas. Todo o processamento é feito via streaming direto sem uploads locais.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* 1. Banner Global / Hero */}
              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Image className="w-4 h-4 text-purple-400" />
                    <span>Banner Global / Hero (Dashboard)</span>
                  </span>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    1920x480 (4:1)
                  </span>
                </div>
                <input
                  type="text"
                  value={mediaSettings.globalBannerUrl}
                  onChange={(e) => setMediaSettings({ ...mediaSettings, globalBannerUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080a14] border border-[#222842] text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
                />
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <p>• <strong>Dimensão recomendada:</strong> 1920x480 px (ou 1920x540 px)</p>
                  <p>• <strong>Proporção:</strong> ~4:1 ou 16:9 • <strong>Formato:</strong> PNG/JPG/WebP (até 2MB)</p>
                </div>
              </div>

              {/* 2. Banner da Comunidade */}
              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Image className="w-4 h-4 text-indigo-400" />
                    <span>Banner da Comunidade</span>
                  </span>
                  <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    1200x400 (3:1)
                  </span>
                </div>
                <input
                  type="text"
                  value={mediaSettings.communityBannerUrl}
                  onChange={(e) => setMediaSettings({ ...mediaSettings, communityBannerUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080a14] border border-[#222842] text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                />
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <p>• <strong>Dimensão recomendada:</strong> 1200x400 px</p>
                  <p>• <strong>Proporção:</strong> 3:1 • <strong>Formato:</strong> PNG/JPG (até 1.5MB)</p>
                </div>
              </div>

              {/* 3. Logo da Plataforma */}
              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span>Logo Institucional da Plataforma</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    512x512 ou 400x120
                  </span>
                </div>
                <input
                  type="text"
                  value={mediaSettings.logoUrl}
                  onChange={(e) => setMediaSettings({ ...mediaSettings, logoUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080a14] border border-[#222842] text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <p>• <strong>Dimensão:</strong> 512x512 px (Quadrado) ou 400x120 px (Horizontal)</p>
                  <p>• <strong>Formato:</strong> PNG com fundo transparente ou SVG (até 500KB)</p>
                </div>
              </div>

              {/* 4. Favicon */}
              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Favicon (Ícone de Aba do Navegador)</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    64x64 (1:1)
                  </span>
                </div>
                <input
                  type="text"
                  value={mediaSettings.faviconUrl}
                  onChange={(e) => setMediaSettings({ ...mediaSettings, faviconUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080a14] border border-[#222842] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                />
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <p>• <strong>Dimensão:</strong> 64x64 px ou 32x32 px</p>
                  <p>• <strong>Formato:</strong> PNG / ICO quadrado</p>
                </div>
              </div>

              {/* 5. Capa Padrão de Músicas */}
              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Music className="w-4 h-4 text-emerald-400" />
                    <span>Capa Padrão de Músicas (Fallback)</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    800x800 (1:1)
                  </span>
                </div>
                <input
                  type="text"
                  value={mediaSettings.defaultSongCoverUrl}
                  onChange={(e) => setMediaSettings({ ...mediaSettings, defaultSongCoverUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080a14] border border-[#222842] text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <p>• <strong>Dimensão:</strong> 800x800 px (Quadrada)</p>
                  <p>• <strong>Formato:</strong> PNG/JPG (até 1MB)</p>
                </div>
              </div>

              {/* 6. Pasta Pública de Materiais */}
              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Folder className="w-4 h-4 text-blue-400" />
                    <span>Pasta Pública no Google Drive (Materiais)</span>
                  </span>
                  <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    Google Drive Folder
                  </span>
                </div>
                <input
                  type="text"
                  value={mediaSettings.publicMaterialsFolderUrl}
                  onChange={(e) => setMediaSettings({ ...mediaSettings, publicMaterialsFolderUrl: e.target.value })}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080a14] border border-[#222842] text-white text-xs font-mono focus:border-blue-500 focus:outline-none"
                />
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <p>• <strong>Tipo:</strong> Link de compartilhamento público de pasta</p>
                  <p>• <strong>Configuração no Drive:</strong> "Qualquer pessoa com o link pode ver"</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 4. Pedagógico */}
        {activeTab === 'pedagogy' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>Diretrizes Pedagógicas & Liberação de Conteúdo</span>
              </h3>
              <p className="text-xs text-slate-400">Configure como o aluno progride pelos módulos, aulas e conversações.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Modo de Acesso aos Módulos</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[#080a14] border border-[#222842] cursor-pointer">
                    <input
                      type="radio"
                      name="unlockMode"
                      checked={pedagogy.moduleUnlockMode === 'sequential'}
                      onChange={() => setPedagogy({ ...pedagogy, moduleUnlockMode: 'sequential' })}
                      className="text-purple-600"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">Sequencial Obrigatório (Recomendado)</p>
                      <p className="text-[10px] text-slate-400">Módulo seguinte só é liberado após concluir o anterior.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[#080a14] border border-[#222842] cursor-pointer">
                    <input
                      type="radio"
                      name="unlockMode"
                      checked={pedagogy.moduleUnlockMode === 'free'}
                      onChange={() => setPedagogy({ ...pedagogy, moduleUnlockMode: 'free' })}
                      className="text-purple-600"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">Navegação Livre</p>
                      <p className="text-[10px] text-slate-400">Todos os módulos ficam desbloqueados para o aluno explorar.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Regras de Validação Pedagógica</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Whitelist Estrita no Conversation Room</p>
                    <p className="text-[10px] text-slate-400">Bloqueia palavras fora das letras de músicas/aulas estudadas.</p>
                  </div>
                  <button
                    onClick={() => setPedagogy({ ...pedagogy, strictConversationWhitelist: !pedagogy.strictConversationWhitelist })}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      pedagogy.strictConversationWhitelist ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      pedagogy.strictConversationWhitelist ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1c223c]">
                  <div>
                    <p className="text-xs font-bold text-white">Exigir Conclusão de Vídeo Aula</p>
                    <p className="text-[10px] text-slate-400">Verifica reprodução antes de liberar o XP da aula.</p>
                  </div>
                  <button
                    onClick={() => setPedagogy({ ...pedagogy, requireVideoCompletion: !pedagogy.requireVideoCompletion })}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      pedagogy.requireVideoCompletion ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      pedagogy.requireVideoCompletion ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. IA & Pronúncia */}
        {activeTab === 'voice' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-rose-400" />
                <span>Calibração do Voice Lab & Síntese de Voz (TTS)</span>
              </h3>
              <p className="text-xs text-slate-400">Ajuste a sensibilidade do avaliador de fala e parâmetros do sintetizador de voz nativo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-2">
                <label className="text-xs font-bold text-slate-300">Nota Mínima de Aprovação (Voice Lab)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={voiceSettings.minAccuracyScore}
                    onChange={(e) => setVoiceSettings({ ...voiceSettings, minAccuracyScore: Number(e.target.value) })}
                    className="flex-1 accent-rose-500"
                  />
                  <span className="text-sm font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                    {voiceSettings.minAccuracyScore}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Pontuação de similaridade fonética exigida para aceitar o verso.</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-2">
                <label className="text-xs font-bold text-slate-300">Velocidade Padrão TTS (SpeechSynthesis)</label>
                <select
                  value={voiceSettings.ttsSpeed}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, ttsSpeed: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#080a14] border border-[#222842] text-white text-xs font-semibold focus:border-rose-500 focus:outline-none"
                >
                  <option value="0.75">0.75x — Lenta (Iniciantes)</option>
                  <option value="0.9">0.9x — Natural / Didática (Padrão)</option>
                  <option value="1.0">1.0x — Velocidade Normal Nativa</option>
                  <option value="1.15">1.15x — Rápida / Desafiadora</option>
                </select>
                <p className="text-[10px] text-slate-400">Velocidade da voz ao clicar no ícone de pronúncia.</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-2">
                <label className="text-xs font-bold text-slate-300">Modo de Tolerância Fonética</label>
                <select
                  value={voiceSettings.toleranceMode}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, toleranceMode: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#080a14] border border-[#222842] text-white text-xs font-semibold focus:border-rose-500 focus:outline-none"
                >
                  <option value="gentle">Suave (Aceita sotaque pronunciado)</option>
                  <option value="balanced">Equilibrado (Recomendado)</option>
                  <option value="strict">Rigoroso (Exige precisão nativa)</option>
                </select>
                <p className="text-[10px] text-slate-400">Nível de rigor na comparação de fonemas e pontuações.</p>
              </div>
            </div>
          </div>
        )}

        {/* 6. Comunidade */}
        {activeTab === 'community' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <span>Configurações do Mural da Comunidade</span>
              </h3>
              <p className="text-xs text-slate-400">Controle as publicações dos alunos, modo de manutenção e limites de texto.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Publicações Liberadas</h4>
                  <p className="text-[11px] text-slate-400">Permite que alunos publiquem novas mensagens no feed.</p>
                </div>
                <button
                  onClick={() => setCommunitySettings({ ...communitySettings, isPostingEnabled: !communitySettings.isPostingEnabled })}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    communitySettings.isPostingEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    communitySettings.isPostingEnabled ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Modo Manutenção do Mural</h4>
                  <p className="text-[11px] text-slate-400">Pausa temporariamente interações no feed da comunidade.</p>
                </div>
                <button
                  onClick={() => setCommunitySettings({ ...communitySettings, status: communitySettings.status === 'maintenance' ? 'active' : 'maintenance' })}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    communitySettings.status === 'maintenance' ? 'bg-amber-600' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    communitySettings.status === 'maintenance' ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. Gamificação */}
        {activeTab === 'gamification' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Exibição de Gamificação & Elementos Visuais</span>
              </h3>
              <p className="text-xs text-slate-400">Controle a exibição visual de elementos de gamificação no portal do aluno.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {[
                { key: 'showUserXpHeader', label: 'Exibir Saldo de XP no Header do Aluno', desc: 'Mostra o contador de XP e streak no cabeçalho.' },
                { key: 'showRankings', label: 'Exibir Posição de Ranking', desc: 'Mostra o card de classificação e ranking semanal.' },
                { key: 'showBadges', label: 'Exibir Conquistas & Medalhas', desc: 'Permite visualização do quadro de badges conquistadas.' },
                { key: 'showLevelCelebrations', label: 'Animações de Celebração de Nível', desc: 'Exibe modal comemorativo e confetes ao subir de nível.' },
              ].map((item) => (
                <div key={item.key} className="p-4 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.label}</h4>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setGamificationDisplay({ ...gamificationDisplay, [item.key]: !gamificationDisplay[item.key] })}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      gamificationDisplay[item.key] ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      gamificationDisplay[item.key] ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-semibold flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Para editar a tabela de pontuações de XP (aulas, músicas, pronúncia), utilize o menu dedicado "Gamificação & XP".</span>
            </div>
          </div>
        )}

        {/* 8. Ranking */}
        {activeTab === 'ranking' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                <span>Parâmetros de Classificação & Leaderboard</span>
              </h3>
              <p className="text-xs text-slate-400">Configure a exibição pública da tabela de líderes e regras de rotação semanal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Quantidade de Alunos Exibidos</label>
                <select
                  value={rankingSettings.displayLimit}
                  onChange={(e) => setRankingSettings({ ...rankingSettings, displayLimit: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0c0e1a] border border-[#222842] text-white text-xs font-semibold focus:border-purple-500 focus:outline-none"
                >
                  <option value={10}>Top 10 Alunos</option>
                  <option value={25}>Top 25 Alunos</option>
                  <option value={50}>Top 50 Alunos (Padrão)</option>
                  <option value={100}>Top 100 Alunos</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Dia de Fechamento do Ranking Semanal</label>
                <select
                  value={rankingSettings.weeklyResetDay}
                  onChange={(e) => setRankingSettings({ ...rankingSettings, weeklyResetDay: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0c0e1a] border border-[#222842] text-white text-xs font-semibold focus:border-purple-500 focus:outline-none"
                >
                  <option value="Sunday">Domingo às 23:59 (Padrão)</option>
                  <option value="Monday">Segunda-feira às 00:00</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 9. Sistema & Status */}
        {activeTab === 'system' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-400" />
                <span>Diagnóstico & Arquitetura do Sistema</span>
              </h3>
              <p className="text-xs text-slate-400">Informações técnicas de execução e integridade da infraestrutura.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Versão da Plataforma</span>
                </div>
                <p className="text-lg font-black text-white">Magic English V4.1</p>
                <p className="text-[10px] text-slate-400">Baseline de Produção Estável</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Conexão Supabase</span>
                </div>
                <p className="text-lg font-black text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isSupabaseConfigured ? 'Conectado (PostgreSQL)' : 'Modo Demonstração'}</span>
                </p>
                <p className="text-[10px] text-slate-400">RPC grant_xp & auth ativos</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0d0f1c] border border-[#1a1e34] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>Arquitetura SSOT</span>
                </div>
                <p className="text-lg font-black text-white">Ativa & Sincronizada</p>
                <p className="text-[10px] text-slate-400">Admin ➔ Distribuição Aluno</p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
