import React, { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import RightPanel from './components/layout/RightPanel';
import HeroBanner from './components/dashboard/HeroBanner';
import MyEvolutionCard from './components/dashboard/MyEvolutionCard';
import ProgressStats from './components/dashboard/ProgressStats';
import ContinueSection from './components/dashboard/ContinueSection';
import NextStepsSection from './components/dashboard/NextStepsSection';
import MagicSongsSection from './components/dashboard/MagicSongsSection';
import LearningTracksSection from './components/dashboard/LearningTracksSection';
import LoginStudent from './components/auth/LoginStudent';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RewardModal from './components/gamification/RewardModal';
import ItemModal from './components/ui/ItemModal';
import MagicLoadingScreen from './components/ui/MagicLoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GamificationProvider, useGamification } from './context/GamificationContext';

// Code Splitting / Lazy Loading for heavy views
const MagicSongView = lazy(() => import('./components/player/MagicSongView'));
const LearningTracksPage = lazy(() => import('./components/tracks/LearningTracksPage'));
const MagicClassroomView = lazy(() => import('./components/classroom/MagicClassroomView'));
const MyModulesView = lazy(() => import('./components/modules/MyModulesView'));
const MusicalPracticeView = lazy(() => import('./components/practice/MusicalPracticeView'));
const MaterialsView = lazy(() => import('./components/materials/MaterialsView'));
const PronunciationLabView = lazy(() => import('./components/pronunciation/PronunciationLabView'));
const GamificationHubView = lazy(() => import('./components/gamification/GamificationHubView'));
const StudentProfileView = lazy(() => import('./components/profile/StudentProfileView'));
const MagicRankingView = lazy(() => import('./components/ranking/MagicRankingView'));
const MagicCommunityView = lazy(() => import('./components/community/MagicCommunityView'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const RegisterStudent = lazy(() => import('./components/auth/RegisterStudent'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'));
const Onboarding = lazy(() => import('./components/auth/Onboarding'));
const AdminLogin = lazy(() => import('./components/auth/AdminLogin'));
import { songsService } from './services/songsService';
import { XP_REWARDS } from './data/gamificationData';

// Determine initial view from window.location.pathname
function getInitialView() {
  if (typeof window === 'undefined') return 'dashboard';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const href = window.location.href || '';
  
  if (path.startsWith('/admin/login')) {
    return 'admin-login';
  }
  if (path.startsWith('/admin')) {
    return 'admin';
  }
  if (
    path.startsWith('/reset-password') || 
    hash.includes('type=recovery') || 
    search.includes('type=recovery') ||
    href.includes('type=recovery')
  ) {
    return 'reset-password';
  }
  if (path.startsWith('/register')) {
    return 'register';
  }
  if (path.startsWith('/forgot-password')) {
    return 'forgot-password';
  }
  if (path.startsWith('/onboarding')) {
    return 'onboarding';
  }
  if (path.startsWith('/login')) {
    return 'login';
  }
  if (path.startsWith('/community')) {
    return 'community';
  }
  return 'dashboard';
}

function MainApp() {
  const { isAuthenticated, role, isOnboarded, isPasswordRecovery, loading, logout } = useAuth();

  // Navigation State
  // 'dashboard' | 'classroom' | 'my-lessons' | 'song-player' | 'tracks' | 'materials' | 'pronunciation' | 'musical-practice' | 'gamification' | 'profile' | 'ranking' | 'community' | 'login' | 'register' | 'forgot-password' | 'reset-password' | 'onboarding' | 'admin-login' | 'admin'
  const [currentView, setCurrentView] = useState(getInitialView);
  const [activeTab, setActiveTab] = useState(getInitialView() === 'community' ? 'community' : 'home');
  const [activeSong, setActiveSong] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalItem, setModalItem] = useState(null);

  const { rewardModal, closeRewardModal, addXp } = useGamification();

  // Handle URL changes & browser history
  const navigateTo = (view, path) => {
    setCurrentView(view);
    if (path && window.location.pathname !== path) {
      window.history.pushState({ view }, '', path);
    }
  };

  // Sync with browser back/forward buttons and hash changes
  useEffect(() => {
    const handlePopState = () => {
      const view = getInitialView();
      setCurrentView(view);
      if (view === 'community') setActiveTab('community');
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Password Recovery Session Listener
  useEffect(() => {
    if (isPasswordRecovery && currentView !== 'reset-password') {
      navigateTo('reset-password', '/reset-password');
    }
  }, [isPasswordRecovery, currentView]);

  // Administrative Guard: /admin and /admin/login role enforcement
  useEffect(() => {
    if (loading || (isAuthenticated && !role)) return;

    const normalizedRole = role ? String(role).trim().toLowerCase() : null;

    if (currentView === 'admin' || currentView === 'admin-login') {
      if (isAuthenticated) {
        if (normalizedRole === 'student') {
          console.log('[DEBUG APP] Admin Guard redirecting student to /dashboard:', { currentView, role, isAuthenticated, isOnboarded, loading });
          navigateTo('dashboard', '/dashboard');
        } else if (normalizedRole === 'admin' && currentView === 'admin-login') {
          console.log('[DEBUG APP] Admin Guard redirecting admin to /admin:', { currentView, role, isAuthenticated, isOnboarded, loading });
          navigateTo('admin', '/admin');
        }
      } else if (currentView === 'admin') {
        console.log('[DEBUG APP] Admin Guard redirecting unauthenticated to /admin/login:', { currentView, role, isAuthenticated, isOnboarded, loading });
        navigateTo('admin-login', '/admin/login');
      }
    }
  }, [currentView, isAuthenticated, role, loading]);

  // Student Authentication Guard for student-protected and onboarding pages
  useEffect(() => {
    if (loading || (isAuthenticated && !role)) return;

    // Do NOT redirect away from reset-password while resetting password
    if (isPasswordRecovery || currentView === 'reset-password') {
      return;
    }

    const isPublicAuthRoute = ['login', 'register', 'forgot-password', 'reset-password', 'admin-login'].includes(currentView);
    
    if (currentView === 'admin' || currentView === 'admin-login') {
      return;
    }

    const normalizedRole = role ? String(role).trim().toLowerCase() : null;

    // ADMIN ISOLATION: Admin never executes student onboarding or student platform redirects
    if (normalizedRole === 'admin') {
      if (currentView !== 'admin' && currentView !== 'admin-login') {
        console.log('[DEBUG APP] Admin Isolation redirecting admin to /admin:', { currentView, role, isAuthenticated, isOnboarded, loading });
        navigateTo('admin', '/admin');
      }
      return;
    }

    if (!isPublicAuthRoute) {
      if (!isAuthenticated) {
        console.log('[DEBUG APP] Student Guard redirecting unauthenticated to /login:', { currentView, role, isAuthenticated, isOnboarded, loading });
        navigateTo('login', '/login');
      } else if (!isOnboarded && currentView !== 'onboarding') {
        console.log('[DEBUG APP] Student Guard redirecting non-onboarded to /onboarding:', { currentView, role, isAuthenticated, isOnboarded, loading });
        navigateTo('onboarding', '/onboarding');
      } else if (isOnboarded && currentView === 'onboarding') {
        console.log('[DEBUG APP] Student Guard redirecting onboarded to /dashboard:', { currentView, role, isAuthenticated, isOnboarded, loading });
        navigateTo('dashboard', '/dashboard');
      }
    } else if (isAuthenticated) {
      if (normalizedRole === 'student' && isOnboarded && ['login', 'register'].includes(currentView)) {
        console.log('[DEBUG APP] Student Guard redirecting authenticated student to /dashboard:', { currentView, role, isAuthenticated, isOnboarded, loading });
        navigateTo('dashboard', '/dashboard');
      }
    }
  }, [currentView, isAuthenticated, isOnboarded, isPasswordRecovery, loading, role]);

  // Helper: Normalize Supabase Song for Player
  const normalizeSongForPlayer = (song) => {
    if (!song) return null;

    let lyrics = [];
    if (Array.isArray(song.timestamps) && song.timestamps.length > 0) {
      lyrics = song.timestamps.map((t, idx) => {
        const sec = typeof t.startTime === 'number' ? t.startTime : 0;
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return {
          id: t.id || idx + 1,
          startTime: t.startTime,
          endTime: t.endTime,
          en: t.en || t.english || '',
          english: t.english || t.en || '',
          pt: t.pt || t.portuguese || '',
          portuguese: t.portuguese || t.pt || '',
          time: t.time || timeStr,
          notes: t.notes || t.tip || t.structure || ''
        };
      });
    } else if (Array.isArray(song.lyricsTimestamps) && song.lyricsTimestamps.length > 0) {
      lyrics = song.lyricsTimestamps;
    } else if (Array.isArray(song.lyrics) && song.lyrics.length > 0) {
      lyrics = song.lyrics;
    } else if (song.lyrics_en) {
      const enLines = String(song.lyrics_en).split('\n').map((l) => l.trim()).filter(Boolean);
      const ptLines = String(song.lyrics_pt || '').split('\n').map((l) => l.trim()).filter(Boolean);
      lyrics = enLines.map((en, idx) => ({
        id: idx + 1,
        time: `0:${String((idx * 4) % 60).padStart(2, '0')}`,
        english: en,
        portuguese: ptLines[idx] || '',
        phonetic: '',
        structure: ''
      }));
    }

    // Generate dynamic challenge from lyrics if not present
    let challenge = song.challenge || null;
    if (!challenge && lyrics.length > 0) {
      const targetVerse = lyrics[0];
      const otherOptions = lyrics.slice(1, 4).map((l) => l.english || l.text);
      const options = [targetVerse.english || targetVerse.text, ...otherOptions].filter(Boolean).sort(() => 0.5 - Math.random());
      
      challenge = {
        question: "Como se canta em inglês o verso:",
        prompt: targetVerse.portuguese || targetVerse.translation || targetVerse.english,
        options: options.length >= 2 ? options : [targetVerse.english, "Goodbye", "Thank you", "Please"],
        correctAnswer: targetVerse.english || targetVerse.text,
        explanation: `"${targetVerse.english || targetVerse.text}" significa "${targetVerse.portuguese || 'este verso'}" na música.`
      };
    }

    return {
      id: song.id,
      title: song.title || 'Música Sem Nome',
      subtitle: song.subtitle || song.category || 'Música de Fixação',
      image: song.cover_url || song.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      audioUrl: song.audio_url || song.audioUrl,
      level: song.level || 'Iniciante',
      duration: song.duration || '3:20',
      bpm: song.bpm || '108 BPM',
      lyrics: lyrics,
      vocabulary: Array.isArray(song.pronunciation_guide) && song.pronunciation_guide.length > 0 
        ? song.pronunciation_guide 
        : (song.vocabulary || []),
      challenge: challenge,
      xpReward: song.xpReward || 50
    };
  };

  // Open Classroom Video Lesson View
  const handleOpenClassroom = (lessonData) => {
    if (!lessonData) {
      setActiveLesson(null);
    } else {
      const songPayload = lessonData.relatedSong || (lessonData.songId ? { id: lessonData.songId, title: lessonData.title } : null);

      setActiveLesson({
        id: lessonData.id || 'lesson-active',
        lessonNumber: lessonData.lessonNumber || `Aula ${lessonData.number || '01'}`,
        title: lessonData.title || 'Aula Oficial',
        duration: lessonData.totalDuration || lessonData.duration || '15 min',
        module: lessonData.module || 'Módulo 1: Primeiros Passos',
        level: lessonData.level || 'Iniciante',
        videoThumbnail: lessonData.videoThumbnail || lessonData.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
        videoUrl: lessonData.videoUrl || '',
        description: lessonData.description || 'Nesta aula prática, você vai dominar as estruturas essenciais do inglês cantando e fixando com o método Magic English.',
        learningGoals: lessonData.learningGoals || [
          'Dominar as estruturas e vocabulário essencial',
          'Compreender o significado de cada verso',
          'Treinar a pronúncia vocal no Voice Lab',
          'Fixar o inglês com a Prática Musical'
        ],
        videoChapters: lessonData.videoChapters || [
          { time: '0:00', title: 'Introdução & Contexto' },
          { time: '0:45', title: 'Vocabulário & Pronúncia' },
          { time: '1:30', title: 'Fixação Musical & Tradução Reversa' }
        ],
        relatedSong: songPayload,
        exercises: lessonData.exercises || [],
        pronunciationList: lessonData.pronunciationList || [],
        downloadableFiles: lessonData.downloadableFiles || []
      });
    }
    setCurrentView('classroom');
    setActiveTab('classes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Magic Song Lesson View
  const handleOpenSongPlayer = (song) => {
    const lessonData = normalizeSongForPlayer(song);
    setActiveSong(lessonData);
    setCurrentView('song-player');
    setActiveTab('songs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open 4-Step Musical Practice Lab
  const handleOpenMusicalPractice = (song = null) => {
    if (song) {
      setActiveSong(normalizeSongForPlayer(song));
    } else if (activeLesson?.relatedSong) {
      setActiveSong(normalizeSongForPlayer(activeLesson.relatedSong));
    } else {
      songsService.getSongs().then(({ data }) => {
        if (data && data.length > 0) {
          setActiveSong(normalizeSongForPlayer(data[0]));
        }
      });
    }
    setCurrentView('musical-practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnToDashboard = () => {
    navigateTo('dashboard', '/dashboard');
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTracksPage = () => {
    setActiveTab('tracks');
    setCurrentView('tracks');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSidebarTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'home') {
      navigateTo('dashboard', '/dashboard');
    } else if (tabId === 'classes') {
      setCurrentView('my-lessons');
    } else if (tabId === 'tracks') {
      setCurrentView('tracks');
    } else if (tabId === 'songs') {
      songsService.getSongs().then(({ data }) => {
        if (data && data.length > 0) {
          handleOpenSongPlayer(data[0]);
        } else {
          handleOpenSongPlayer(null);
        }
      });
    } else if (tabId === 'materials') {
      setCurrentView('materials');
    } else if (tabId === 'pronunciation') {
      setCurrentView('pronunciation');
    } else if (tabId === 'achievements') {
      setCurrentView('gamification');
    } else if (tabId === 'ranking') {
      setCurrentView('ranking');
    } else if (tabId === 'community') {
      navigateTo('community', '/community');
    } else if (tabId === 'profile') {
      setCurrentView('profile');
    } else {
      navigateTo('dashboard', '/dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    navigateTo('login', '/login');
  };

  if (loading) {
    return <MagicLoadingScreen message="Conectando à sua conta Magic English..." />;
  }

  // ==========================================
  // 1. PUBLIC AUTHENTICATION ROUTES
  // ==========================================

  // ROUTE 1: Public Admin Login (/admin/login)
  if (currentView === 'admin-login') {
    return (
      <Suspense fallback={<MagicLoadingScreen message="Carregando portal administrativo..." />}>
        <AdminLogin
          onLoginSuccess={() => navigateTo('admin', '/admin')}
          onGoToStudentLogin={() => navigateTo('login', '/login')}
        />
      </Suspense>
    );
  }

  // ROUTE 2: Public Student Registration (/register)
  if (currentView === 'register') {
    return (
      <Suspense fallback={<MagicLoadingScreen message="Preparando sua matrícula..." />}>
        <RegisterStudent
          onRegisterSuccess={() => navigateTo('onboarding', '/onboarding')}
          onGoToLogin={() => navigateTo('login', '/login')}
        />
      </Suspense>
    );
  }

  // ROUTE 3: Public Forgot Password (/forgot-password)
  if (currentView === 'forgot-password') {
    return (
      <Suspense fallback={<MagicLoadingScreen message="Carregando recuperação..." />}>
        <ForgotPassword
          onGoToLogin={() => navigateTo('login', '/login')}
        />
      </Suspense>
    );
  }

  // ROUTE 3.1: Password Reset & First Access (/reset-password)
  if (currentView === 'reset-password') {
    return (
      <Suspense fallback={<MagicLoadingScreen message="Preparando redefinição de senha..." />}>
        <ResetPassword
          onSuccess={(hasOnboarded) => {
            if (hasOnboarded) {
              navigateTo('dashboard', '/dashboard');
              setActiveTab('home');
            } else {
              navigateTo('onboarding', '/onboarding');
            }
          }}
          onGoToLogin={() => navigateTo('login', '/login')}
        />
      </Suspense>
    );
  }

  // ROUTE 4: Protected Student Onboarding (/onboarding)
  if (currentView === 'onboarding') {
    return (
      <ProtectedRoute requiredRole="student" onRedirect={(view) => navigateTo(view, view === 'admin' ? '/admin' : '/login')}>
        <Suspense fallback={<MagicLoadingScreen message="Personalizando sua jornada..." />}>
          <Onboarding
            onComplete={() => {
              navigateTo('dashboard', '/dashboard');
              setActiveTab('home');
            }}
          />
        </Suspense>
      </ProtectedRoute>
    );
  }

  // ROUTE 5: Public Student Login (/login)
  if (currentView === 'login' || (!isAuthenticated && currentView !== 'admin-login' && currentView !== 'admin')) {
    return (
      <LoginStudent
        onLoginSuccess={() => {
          navigateTo('dashboard', '/dashboard');
          setActiveTab('home');
        }}
        onGoToRegister={() => navigateTo('register', '/register')}
        onGoToForgotPassword={() => navigateTo('forgot-password', '/forgot-password')}
        onGoToAdminLogin={() => navigateTo('admin-login', '/admin/login')}
      />
    );
  }

  // ==========================================
  // 2. PROTECTED ADMIN ENVIRONMENT (/admin)
  // ==========================================
  if (currentView === 'admin') {
    return (
      <ProtectedRoute 
        requiredRole="admin" 
        onRedirect={(view) => {
          if (view === 'dashboard') {
            navigateTo('dashboard', '/dashboard');
          } else {
            navigateTo('admin-login', '/admin/login');
          }
        }}
      >
        <ErrorBoundary>
          <Suspense fallback={<MagicLoadingScreen message="Carregando Painel Administrativo..." />}>
            <AdminLayout
              onLogout={() => {
                logout();
                navigateTo('admin-login', '/admin/login');
              }}
            />
          </Suspense>
        </ErrorBoundary>
      </ProtectedRoute>
    );
  }

  // ==========================================
  // 3. PROTECTED STUDENT PLATFORM (/dashboard & tabs)
  // ==========================================
  return (
    <ProtectedRoute 
      requiredRole="student" 
      onRedirect={(view) => {
        if (view === 'admin') {
          navigateTo('admin', '/admin');
        } else {
          navigateTo(view, view === 'admin-login' ? '/admin/login' : '/login');
        }
      }}
    >
      <ErrorBoundary>
        <div className="min-h-screen bg-[#08090e] text-slate-100 flex">
        {/* 1. Fixed Dark Student Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleSidebarTabChange}
          onLogout={handleLogout}
        />

        {/* 2. Main Content Center Column */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          {/* Top Sticky Header with Dynamic User Info */}
          <Header 
            searchQuery={searchQuery} 
            onSearch={setSearchQuery}
            onOpenGamification={() => handleSidebarTabChange('ranking')}
          />

          {/* Dynamic Views Router with Lazy Loading Suspense & Global Error Boundary */}
          <ErrorBoundary>
            <Suspense fallback={<MagicLoadingScreen />}>
              {currentView === 'classroom' ? (
                <MagicClassroomView
                  lesson={activeLesson}
                  onBack={() => handleSidebarTabChange('classes')}
                  onOpenMusicPlayer={(song) => handleOpenMusicalPractice(song)}
                  onNextLesson={() => {
                    handleOpenClassroom({
                      lessonNumber: "Aula 02",
                      title: "Numbers — Aprenda os números em inglês",
                      duration: "18 minutos"
                    });
                  }}
                  onGainXp={(amount) => {
                    addXp(amount, 'Aula em Vídeo', { showModal: true });
                  }}
                />
              ) : currentView === 'musical-practice' ? (
                <MusicalPracticeView
                  song={activeSong}
                  onBack={() => handleSidebarTabChange('classes')}
                  onGainXp={(amount) => {
                    addXp(amount, 'Prática Musical Completa', { showModal: true });
                  }}
                />
              ) : currentView === 'my-lessons' ? (
                <MyModulesView
                  onOpenClassroomLesson={(lesson) => handleOpenClassroom(lesson)}
                  onOpenMusicalPractice={(song) => handleOpenMusicalPractice(song)}
                />
              ) : currentView === 'materials' ? (
                <MaterialsView />
              ) : currentView === 'pronunciation' ? (
                <PronunciationLabView />
              ) : currentView === 'ranking' ? (
                <MagicRankingView
                  onContinueStudy={() => handleSidebarTabChange('classes')}
                />
              ) : currentView === 'community' ? (
                <MagicCommunityView
                  onOpenClassroom={(lesson) => handleOpenClassroom(lesson)}
                  onOpenMusicalPractice={() => handleOpenMusicalPractice()}
                />
              ) : currentView === 'profile' ? (
                <StudentProfileView
                  onOpenSong={(song) => handleOpenSongPlayer(song)}
                  onOpenModule={() => handleSidebarTabChange('classes')}
                  onOpenClassroom={(lesson) => handleOpenClassroom(lesson)}
                />
              ) : currentView === 'gamification' ? (
                <GamificationHubView 
                  onOpenLesson={(lesson) => handleOpenClassroom(lesson)}
                  onOpenSong={(song) => handleOpenSongPlayer(song)}
                />
              ) : currentView === 'song-player' ? (
                <MagicSongView
                  song={activeSong}
                  onBack={handleReturnToDashboard}
                  onGainXp={(amount) => {
                    addXp(amount, 'Magic Song Tocada', { showModal: true });
                  }}
                />
              ) : currentView === 'tracks' ? (
                <LearningTracksPage
                  onOpenLesson={(lesson) => {
                    handleOpenClassroom({
                      id: lesson.id,
                      number: lesson.number,
                      lessonNumber: `Aula ${lesson.number}`,
                      title: lesson.title,
                      duration: lesson.duration,
                      module: "Inglês do Zero",
                      songId: lesson.songId,
                      videoThumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80'
                    });
                  }}
                />
              ) : (
                <main className="flex-1 w-full flex flex-col">
                  {/* 1. Full Width Edge-to-Edge Hero Banner (Kiwify / Streaming Style) */}
                  <HeroBanner
                    onContinue={() => handleOpenClassroom(continueLessonsList[0])}
                    onExplore={() => handleSidebarTabChange('classes')}
                  />

                  {/* 2. Dashboard Body Sections with Standard Layout Container */}
                  <div className="p-6 sm:p-8 lg:p-10 space-y-10 max-w-7xl w-full mx-auto pb-16">
                    {/* Minha Evolução Card (Level, XP Bar, Streak & Next Goal) */}
                    <MyEvolutionCard
                      onOpenEvolutionHub={() => handleSidebarTabChange('ranking')}
                    />

                    {/* Progress Overview Stats */}
                    <ProgressStats />

                    {/* [TEMPORARIAMENTE OCULTO] ContinueSection e NextStepsSection (aguardando persistência de progresso real do aluno) */}
                    {/* <ContinueSection onSelectLesson={(lesson) => handleOpenClassroom(lesson)} /> */}
                    {/* <NextStepsSection onSelectLesson={(lesson) => handleOpenClassroom(lesson)} /> */}

                    {/* "Reforce seu aprendizado com músicas" Section (Magic Songs Fixation) */}
                    <MagicSongsSection onSelectSong={(song) => handleOpenSongPlayer(song)} />

                    {/* "Trilhas de Aprendizado" Section */}
                    <LearningTracksSection onSelectTrack={() => handleOpenTracksPage()} />
                  </div>
                </main>
              )}
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* 3. Fixed Right Panel */}
        <RightPanel onOpenGamification={() => handleSidebarTabChange('ranking')} />

        {/* Global Celebratory Reward Modal */}
        <RewardModal
          isOpen={rewardModal.isOpen}
          onClose={closeRewardModal}
          type={rewardModal.type}
          title={rewardModal.title}
          subtitle={rewardModal.subtitle}
          xp={rewardModal.xp}
          icon={rewardModal.icon}
          bonusText={rewardModal.bonusText}
          badge={rewardModal.badge}
        />

        {/* Modal for Track Details if opened */}
        {modalItem && (
          <ItemModal
            item={modalItem}
            onClose={() => setModalItem(null)}
          />
        )}
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GamificationProvider>
        <MainApp />
      </GamificationProvider>
    </AuthProvider>
  );
}
