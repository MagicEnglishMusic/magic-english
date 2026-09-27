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
const Onboarding = lazy(() => import('./components/auth/Onboarding'));
const AdminLogin = lazy(() => import('./components/auth/AdminLogin'));
import { defaultSongLesson } from './data/songLessonData';
import { magicSongsList, continueLessonsList } from './data/mockData';
import { classroomLessonData } from './data/classroomData';
import { travelSongMethodData } from './data/songMethodData';
import { XP_REWARDS } from './data/gamificationData';

// Determine initial view from window.location.pathname
function getInitialView() {
  if (typeof window === 'undefined') return 'dashboard';
  const path = window.location.pathname.toLowerCase();
  
  if (path.startsWith('/admin/login')) {
    return 'admin-login';
  }
  if (path.startsWith('/admin')) {
    return 'admin';
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
  const { isAuthenticated, role, isOnboarded, loading, logout } = useAuth();

  // Navigation State
  // 'dashboard' | 'classroom' | 'my-lessons' | 'song-player' | 'tracks' | 'materials' | 'pronunciation' | 'musical-practice' | 'gamification' | 'profile' | 'ranking' | 'community' | 'login' | 'register' | 'forgot-password' | 'onboarding' | 'admin-login' | 'admin'
  const [currentView, setCurrentView] = useState(getInitialView);
  const [activeTab, setActiveTab] = useState(getInitialView() === 'community' ? 'community' : 'home');
  const [activeSong, setActiveSong] = useState(defaultSongLesson);
  const [activeLesson, setActiveLesson] = useState(classroomLessonData);
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

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const view = getInitialView();
      setCurrentView(view);
      if (view === 'community') setActiveTab('community');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Administrative Guard: /admin and /admin/login role enforcement
  useEffect(() => {
    if (loading) return;

    if (currentView === 'admin' || currentView === 'admin-login') {
      if (isAuthenticated) {
        if (role === 'student') {
          // Student attempting to access admin route is immediately redirected to /dashboard
          navigateTo('dashboard', '/dashboard');
        } else if (role === 'admin' && currentView === 'admin-login') {
          // Authenticated admin on /admin/login is redirected to /admin
          navigateTo('admin', '/admin');
        }
      } else if (currentView === 'admin') {
        // Unauthenticated visitor attempting /admin goes to /admin/login
        navigateTo('admin-login', '/admin/login');
      }
    }
  }, [currentView, isAuthenticated, role, loading]);

  // Student Authentication Guard for student-protected and onboarding pages
  useEffect(() => {
    if (loading) return;

    const isPublicAuthRoute = ['login', 'register', 'forgot-password', 'admin-login'].includes(currentView);
    
    if (currentView === 'admin' || currentView === 'admin-login') {
      return;
    }

    if (!isPublicAuthRoute) {
      if (!isAuthenticated) {
        navigateTo('login', '/login');
      } else if (!isOnboarded && currentView !== 'onboarding') {
        navigateTo('onboarding', '/onboarding');
      } else if (isOnboarded && currentView === 'onboarding') {
        navigateTo('dashboard', '/dashboard');
      }
    } else if (isAuthenticated) {
      if (role === 'student' && isOnboarded && ['login', 'register'].includes(currentView)) {
        navigateTo('dashboard', '/dashboard');
      } else if (role === 'admin' && ['login', 'register'].includes(currentView)) {
        navigateTo('admin', '/admin');
      }
    }
  }, [currentView, isAuthenticated, isOnboarded, loading, role]);

  // Open Classroom Video Lesson View
  const handleOpenClassroom = (lessonData) => {
    setActiveLesson({
      ...classroomLessonData,
      ...(lessonData || {}),
      lessonNumber: lessonData?.lessonNumber || classroomLessonData.lessonNumber,
      title: lessonData?.title || classroomLessonData.title,
      duration: lessonData?.totalDuration || lessonData?.duration || classroomLessonData.duration
    });
    setCurrentView('classroom');
    setActiveTab('classes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Magic Song Lesson View
  const handleOpenSongPlayer = (song) => {
    const lessonData = {
      ...defaultSongLesson,
      title: song?.title || defaultSongLesson.title,
      subtitle: song?.subtitle || song?.category || defaultSongLesson.subtitle,
      image: song?.image || defaultSongLesson.image,
      level: song?.level || 'Iniciante',
      duration: song?.duration || '3:24',
      bpm: song?.bpm || '108 BPM'
    };
    setActiveSong(lessonData);
    setCurrentView('song-player');
    setActiveTab('songs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open 4-Step Musical Practice Lab
  const handleOpenMusicalPractice = () => {
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
      handleOpenSongPlayer(magicSongsList[0]);
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

  // ROUTE 4: Protected Student Onboarding (/onboarding)
  if (currentView === 'onboarding') {
    return (
      <ProtectedRoute requiredRole="student" onRedirect={(view) => navigateTo(view, '/login')}>
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
        <Suspense fallback={<MagicLoadingScreen message="Carregando Painel Administrativo..." />}>
          <AdminLayout
            onReturnToPlatform={() => {
              navigateTo('dashboard', '/dashboard');
              setActiveTab('home');
            }}
          />
        </Suspense>
      </ProtectedRoute>
    );
  }

  // ==========================================
  // 3. PROTECTED STUDENT PLATFORM (/dashboard & tabs)
  // ==========================================
  return (
    <ProtectedRoute requiredRole="student" onRedirect={(view) => navigateTo(view, '/login')}>
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

          {/* Dynamic Views Router with Lazy Loading Suspense */}
          <Suspense fallback={<MagicLoadingScreen />}>
            {currentView === 'classroom' ? (
              <MagicClassroomView
                lesson={activeLesson}
                onBack={() => handleSidebarTabChange('classes')}
                onOpenMusicPlayer={() => handleOpenMusicalPractice()}
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
                data={travelSongMethodData}
                onBack={() => handleSidebarTabChange('classes')}
                onGainXp={(amount) => {
                  addXp(amount, 'Prática Musical Completa', { showModal: true });
                }}
              />
            ) : currentView === 'my-lessons' ? (
              <MyModulesView
                onOpenClassroomLesson={(lesson) => handleOpenClassroom(lesson)}
                onOpenMusicalPractice={() => handleOpenMusicalPractice()}
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
                    lessonNumber: `Aula ${lesson.number}`,
                    title: lesson.title,
                    duration: lesson.duration
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

                  {/* "Continue sua aula" Section (Video Lessons in progress) */}
                  <ContinueSection onSelectLesson={(lesson) => handleOpenClassroom(lesson)} />

                  {/* "Próximos passos" Section (Next recommended video lessons) */}
                  <NextStepsSection onSelectLesson={(lesson) => handleOpenClassroom(lesson)} />

                  {/* "Reforce seu aprendizado com músicas" Section (Magic Songs Fixation) */}
                  <MagicSongsSection onSelectSong={(song) => handleOpenSongPlayer(song)} />

                  {/* "Trilhas de Aprendizado" Section */}
                  <LearningTracksSection onSelectTrack={() => handleOpenTracksPage()} />
                </div>
              </main>
            )}
          </Suspense>
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
