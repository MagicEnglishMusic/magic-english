import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';
import ModuleManager from './ModuleManager';
import LessonManager from './LessonManager';
import SongManager from './SongManager';
import MaterialManager from './MaterialManager';
import PronunciationManager from './PronunciationManager';
import GamificationManager from './GamificationManager';
import StudentManager from './StudentManager';
import { ArrowLeft, Bell, Search, ShieldCheck, Sparkles, User, ExternalLink } from 'lucide-react';

export default function AdminLayout({ onReturnToPlatform }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-[#070810] text-slate-100 flex">
      {/* 1. Admin Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReturnToPlatform={onReturnToPlatform}
      />

      {/* 2. Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        
        {/* Admin Top Header */}
        <header className="sticky top-0 z-30 bg-[#070810]/95 backdrop-blur-xl border-b border-[#1a1e32] px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/25 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Painel Administrativo • Magic English</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Student Platform Button */}
            <button
              onClick={onReturnToPlatform}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm group"
            >
              <span>Ver Plataforma</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Admin Avatar */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-amber-500 p-[1.5px]">
                <div className="w-full h-full bg-[#0d0f1b] rounded-full flex items-center justify-center text-xs font-bold text-amber-300">
                  AD
                </div>
              </div>
              <div className="hidden sm:block text-left text-xs">
                <p className="font-bold text-white">Admin Geral</p>
                <p className="text-[10px] text-purple-300">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Admin View */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto pb-16">
          {activeTab === 'dashboard' ? (
            <AdminDashboard onNavigateTab={setActiveTab} />
          ) : activeTab === 'modules' || activeTab === 'courses' ? (
            <ModuleManager />
          ) : activeTab === 'lessons' ? (
            <LessonManager />
          ) : activeTab === 'songs' || activeTab === 'practice' ? (
            <SongManager />
          ) : activeTab === 'materials' ? (
            <MaterialManager />
          ) : activeTab === 'pronunciation' ? (
            <PronunciationManager />
          ) : activeTab === 'gamification' || activeTab === 'settings' ? (
            <GamificationManager />
          ) : activeTab === 'students' ? (
            <StudentManager />
          ) : (
            <AdminDashboard onNavigateTab={setActiveTab} />
          )}
        </main>
      </div>

    </div>
  );
}
