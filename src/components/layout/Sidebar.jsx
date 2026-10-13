import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Tv, 
  Compass, 
  Music, 
  BookOpen, 
  Mic, 
  Award, 
  Trophy, 
  Users, 
  User, 
  Settings, 
  Sparkles, 
  LogOut,
  X,
  Bot
} from 'lucide-react';
import { communityService } from '../../services/communityService';
import { getDriveImageUrl } from '../../utils/googleDriveHelper';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onLogout,
  isMobileOpen = false,
  onCloseMobile = () => {}
}) {
  const [branding, setBranding] = useState({
    platformName: 'Magic English',
    platformSlogan: 'Aulas em Vídeo & Fixação',
    logoUrl: ''
  });

  const [features, setFeatures] = useState({
    enableMagicSongs: true,
    enablePronunciationAI: true,
    enableMagicConversation: true,
    enableCommunity: true,
    enableRanking: true,
    enableGamification: true,
    enablePdfMaterials: true
  });

  useEffect(() => {
    // 1. General settings for name and slogan
    communityService.getAppSettings('general_settings').then((res) => {
      if (res?.data && typeof res.data === 'object') {
        setBranding((prev) => ({
          ...prev,
          platformName: res.data.platformName || prev.platformName,
          platformSlogan: res.data.platformSlogan || prev.platformSlogan
        }));
      }
    });

    // 2. Media settings for custom logo
    communityService.getAppSettings('media_settings').then((res) => {
      if (res?.data?.logoUrl) {
        setBranding((prev) => ({
          ...prev,
          logoUrl: res.data.logoUrl
        }));
      }
    });

    // 3. Feature flags
    communityService.getAppSettings('feature_flags').then((res) => {
      if (res?.data && typeof res.data === 'object') {
        setFeatures((prev) => ({
          ...prev,
          ...res.data
        }));
      }
    });
  }, []);

  const mainMenuItems = [
    { id: 'home', label: 'Início', icon: Home, badge: null, enabled: true },
    { id: 'classes', label: 'Minhas Aulas', icon: Tv, badge: 'Principal', enabled: true },
    { id: 'tracks', label: 'Trilhas', icon: Compass, badge: null, enabled: true },
    { id: 'songs', label: 'Magic Songs', icon: Music, badge: 'Fixação', enabled: features.enableMagicSongs },
    { id: 'materials', label: 'Materiais', icon: BookOpen, badge: null, enabled: features.enablePdfMaterials },
    { id: 'pronunciation', label: 'Pronúncia', icon: Mic, badge: 'IA', enabled: features.enablePronunciationAI },
    { id: 'avatar-practice', label: 'Pratique seu Inglês', icon: Bot, badge: 'IA', enabled: true },
    { id: 'achievements', label: 'Conquistas', icon: Award, badge: null, enabled: features.enableGamification },
    { id: 'ranking', label: 'Ranking', icon: Trophy, badge: null, enabled: features.enableRanking },
    { id: 'community', label: 'Comunidade', icon: Users, badge: null, enabled: features.enableCommunity },
  ];

  const bottomMenuItems = [
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const resolvedLogo = branding.logoUrl ? getDriveImageUrl(branding.logoUrl) : null;

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  // Reusable Navigation Content
  const renderSidebarContent = (isMobileView = false) => (
    <div className="flex flex-col justify-between h-full">
      {/* Top Section: Brand Logo & Navigation */}
      <div className="space-y-6">
        
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between px-1 py-1">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => handleSelectTab('home')}
          >
            {resolvedLogo ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-500/40 shadow-lg shadow-purple-600/30 flex-shrink-0 bg-[#0c0e17]">
                <img 
                  src={resolvedLogo} 
                  alt={branding.platformName} 
                  className="w-full h-full object-cover" 
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-purple-600/30 flex-shrink-0">
                <div className="w-full h-full bg-[#0c0e17] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent truncate">
                  {branding.platformName}
                </span>
              </div>
              <div className="mt-0.5 leading-tight select-none">
                <p className="text-[9px] font-bold uppercase tracking-wider text-purple-300/80">
                  APRENDA INGLÊS COM MÚSICA
                </p>
                <p className="text-[8px] font-extrabold uppercase tracking-widest text-purple-400/90">
                  CANTAR, REPETIR E DOMINAR
                </p>
              </div>
            </div>
          </div>

          {/* Close button inside mobile drawer */}
          {isMobileView && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-2 rounded-xl bg-[#141728] hover:bg-[#1f243d] text-slate-400 hover:text-white border border-[#232948] transition-colors cursor-pointer"
              title="Fechar Menu"
              aria-label="Fechar Menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Menu Principal
          </p>

          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 group relative cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/25 to-blue-600/10 text-white border border-purple-500/50 shadow-lg shadow-purple-500/15'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                } ${!item.enabled ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-purple-500 to-blue-500 rounded-r-full shadow-md shadow-purple-500/80" />
                  )}
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.badge === 'Principal'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : item.badge === 'IA'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Profile, Settings & Logout */}
      <div className="space-y-4 pt-4 border-t border-[#1a1e32]">
        
        {/* Bottom Menu Items */}
        <div className="space-y-1">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/25 to-blue-600/10 text-white border border-purple-500/50'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4 text-slate-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        )}

      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar (visible only on large screens lg+) */}
      <aside className="hidden lg:flex w-64 bg-[#0a0c16] border-r border-[#1a1e32] h-screen sticky top-0 flex-col justify-between p-5 select-none z-30 transition-all duration-300">
        {renderSidebarContent(false)}
      </aside>

      {/* 2. Mobile Lateral Drawer (visible on screens < lg when isMobileOpen is true) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          
          {/* Drawer Container */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0a0c16] border-r border-[#1a1e32] p-5 shadow-2xl animate-in slide-in-from-left duration-200 overflow-y-auto">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
