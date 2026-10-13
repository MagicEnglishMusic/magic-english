import React, { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import RightPanel from './components/layout/RightPanel';
import HeroBanner from './components/dashboard/HeroBanner';
import ContinueLearningCard from './components/dashboard/ContinueLearningCard';
import DashboardFocusCards from './components/dashboard/DashboardFocusCards';
import MyEvolutionCard from './components/dashboard/MyEvolutionCard';
import MagicSongsSection from './components/dashboard/MagicSongsSection';
import LearningTracksSection from './components/dashboard/LearningTracksSection';
import LoginStudent from './components/auth/LoginStudent';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CompletionCelebration from './components/common/CompletionCelebration';
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
const AvatarPracticeView = lazy(() => import('./components/avatar/AvatarPracticeView'));
const GamificationHubView = lazy(() => import('./components/gamification/GamificationHubView'));
const StudentProfileView = lazy(() => import('./components/profile/StudentProfileView'));
const StudentSettingsView = lazy(() => import('./components/settings/StudentSettingsView'));
const MagicRankingView = lazy(() => import('./components/ranking/MagicRankingView'));
const MagicCommunityView = lazy(() => import('./components/community/MagicCommunityView'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const RegisterStudent = lazy(() => import('./components/auth/RegisterStudent'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'));
const Onboarding = lazy(() => import('./components/auth/Onboarding'));
const AdminLogin = lazy(() => import('./components/auth/AdminLogin'));
import { songsService } from './services/songsService';
import { lessonsService } from './services/lessonsService';
import { communityService } from './services/communityService';
import { Sparkles } from 'lucide-react';
import { XP_REWARDS } from './data/gamificationData';

// Determine initial view and parameters from pathname
export function parseRoute(pathname = '') {
  if (typeof window === 'undefined') return { view: 'dashboard', tab: 'home', path: '/dashboard' };
  const rawPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '') || '';
  const path = rawPath.toLowerCase();
  const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
  const search = typeof window !== 'undefined' ? window.location.search || '' : '';
  const href = typeof window !== 'undefined' ? window.location.href || '' : '';

  if (path.startsWith('/admin/login')) {
    return { view: 'admin-login', tab: null, path: '/admin/login' };
  }
  if (path.startsWith('/admin')) {
    return { view: 'admin', tab: null, path: '/admin' };
  }
  if (
    path.startsWith('/reset-password') || 
    hash.includes('type=recovery') || 
    search.includes('type=recovery') ||
    href.includes('type=recovery')
  ) {
    return { view: 'reset-password', tab: null, path: '/reset-password' };
  }
  if (path.startsWith('/register')) {
    return { view: 'register', tab: null, path: '/register' };
  }
  if (path.startsWith('/forgot-password')) {
    return { view: 'forgot-password', tab: null, path: '/forgot-password' };
  }
  if (path.startsWith('/onboarding')) {
    return { view: 'onboarding', tab: null, path: '/onboarding' };
  }
  if (path.startsWith('/login')) {
    return { view: 'login', tab: null, path: '/login' };
  }

  // Student Classroom: /classroom or /classroom/:lessonId
  if (path.startsWith('/classroom')) {
    const parts = rawPath.split('/').filter(Boolean);
    const lessonId = parts[1] || null;
    return { view: 'classroom', tab: 'classes', lessonId, path: rawPath || '/classroom' };
  }

  // Student Musical Practice: /musical-practice or /musical-practice/:songId
  if (path.startsWith('/musical-practice')) {
    const parts = rawPath.split('/').filter(Boolean);
    const songId = parts[1] || null;
    return { view: 'musical-practice', tab: 'classes', songId, path: rawPath || '/musical-practice' };
  }

  // Student Modules / Lessons: /my-lessons or /my-lessons/:moduleId
  if (path.startsWith('/my-lessons')) {
    const parts = rawPath.split('/').filter(Boolean);
    const moduleId = parts[1] || null;
    return { view: 'my-lessons', tab: 'classes', moduleId, path: rawPath || '/my-lessons' };
  }

  // Student Magic Songs: /songs or /songs/:songId
  if (path.startsWith('/songs')) {
    const parts = rawPath.split('/').filter(Boolean);
    const songId = parts[1] || null;
    return { view: 'song-player', tab: 'songs', songId, path: rawPath || '/songs' };
  }

  if (path.startsWith('/tracks')) {
    return { view: 'tracks', tab: 'tracks', path: '/tracks' };
  }
  if (path.startsWith('/materials')) {
    return { view: 'materials', tab: 'materials', path: '/materials' };
  }
  if (path.startsWith('/pronunciation')) {
    return { view: 'pronunciation', tab: 'pronunciation', path: '/pronunciation' };
  }
  if (path.startsWith('/avatar-practice') || path.startsWith('/pratique')) {
    return { view: 'avatar-practice', tab: 'avatar-practice', path: '/avatar-practice' };
  }
  if (path.startsWith('/achievements')) {
    return { view: 'gamification', tab: 'achievements', path: '/achievements' };
  }
  if (path.startsWith('/ranking')) {
    return { view: 'ranking', tab: 'ranking', path: '/ranking' };
  }
  if (path.startsWith('/community')) {
    return { view: 'community', tab: 'community', path: '/community' };
  }
  if (path.startsWith('/settings')) {
    return { view: 'settings', tab: 'settings', path: '/settings' };
  }
  if (path.startsWith('/profile')) {
    return { view: 'profile', tab: 'profile', path: '/profile' };
  }

  return { view: 'dashboard', tab: 'home', path: '/dashboard' };
}

function MainApp() {
  const { isAuthenticated, role, isOnboarded, isPasswordRecovery, loading, logout } = useAuth();

  const initialRoute = parseRoute(typeof window !== 'undefined' ? window.location.pathname : '');

  // Navigation State
  const [currentView, setCurrentView] = useState(initialRoute.view);
  const [activeTab, setActiveTab] = useState(initialRoute.tab || 'home');
  const [selectedModuleId, setSelectedModuleId] = useState(initialRoute.moduleId || null);
  const [activeSong, setActiveSong] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalItem, setModalItem] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalBanner, setGlobalBanner] = useState({ enabled: false, text: '' });
  const [featureFlags, setFeatureFlags] = useState({
    enableMagicSongs: true,
    enablePronunciationAI: true,
    enableMagicConversation: true,
    enableCommunity: true,
    enableRanking: true,
    enableGamification: true,
    enablePdfMaterials: true
  });

  // Load General Settings & Feature Flags from app_settings
  useEffect(() => {
    communityService.getAppSettings('general_settings').then((res) => {
      if (res?.data && typeof res.data === 'object') {
        setGlobalBanner({
          enabled: Boolean(res.data.globalBannerEnabled),
          text: res.data.globalBannerText || ''
        });
      }
    });

    communityService.getAppSettings('feature_flags').then((res) => {
      if (res?.data && typeof res.data === 'object') {
        setFeatureFlags((prev) => ({
          ...prev,
          ...res.data
        }));
      }
    });
  }, []);

  const { rewardModal, closeRewardModal, addXp } = useGamification();

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
      timestamps: song.timestamps || lyrics,
      lyrics: lyrics,
      vocabulary: Array.isArray(song.pronunciation_guide) && song.pronunciation_guide.length > 0 
        ? song.pronunciation_guide 
        : (song.vocabulary || []),
      challenge: challenge,
      xpReward: song.xpReward || 50
    };
  };

  // Helper: Format Lesson for MagicClassroomView
  const formatLessonForClassroom = (lessonData) => {
    if (!lessonData) return null;
    const songPayload = lessonData.songs || lessonData.relatedSong || (lessonData.song_id || lessonData.songId ? { id: lessonData.song_id || lessonData.songId, title: lessonData.title } : null);

    return {
      id: lessonData.id || 'lesson-active',
      moduleId: lessonData.module_id || lessonData.moduleId || null,
      lessonNumber: lessonData.lessonNumber || lessonData.lesson_number || `Aula ${String(lessonData.order_index || lessonData.number || 1).padStart(2, '0')}`,
      title: lessonData.title || 'Aula Oficial',
      duration: lessonData.totalDuration || lessonData.duration || '15 min',
      module: lessonData.modules?.title || lessonData.module || 'Módulo do Curso',
      level: lessonData.level || 'Iniciante',
      videoThumbnail: lessonData.thumbnail_url || lessonData.videoThumbnail || lessonData.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
      videoUrl: lessonData.video_url || lessonData.videoUrl || '',
      description: lessonData.description || 'Nesta aula prática, você vai dominar as estruturas essenciais do inglês cantando e fixando com o método Magic English.',
      learningGoals: lessonData.learning_goals || lessonData.learningGoals || [
        'Dominar as estruturas e vocabulário essencial',
        'Compreender o significado de cada verso',
        'Treinar a pronúncia vocal no Voice Lab',
        'Fixar o inglês com a Prática Musical'
      ],
      videoChapters: lessonData.video_chapters || lessonData.videoChapters || [],
      relatedSong: songPayload,
      exercises: lessonData.exercises || [],
      pronunciationList: lessonData.pronunciationList || [],
      downloadableFiles: lessonData.materials || lessonData.downloadableFiles || []
    };
  };

  // Handle URL changes & browser history
  const navigateTo = (view, path, replace = false) => {
    setCurrentView(view);
    if (path && window.location.pathname !== path) {
      if (replace) {
        window.history.replaceState({ view, path }, '', path);
      } else {
        window.history.pushState({ view, path }, '', path);
      }
    }
  };

  // Sync with browser back/forward buttons and hash changes
  useEffect(() => {
    const handlePopState = async () => {
      const route = parseRoute(window.location.pathname);
      setCurrentView(route.view);
      if (route.tab) setActiveTab(route.tab);

      if (route.view === 'my-lessons') {
        setSelectedModuleId(route.moduleId || null);
      } else if (route.view === 'classroom' && route.lessonId) {
        if (!activeLesson || activeLesson.id !== route.lessonId) {
          const { data } = await lessonsService.getLessonDetails(route.lessonId);
          if (data) {
            setActiveLesson(formatLessonForClassroom(data));
            if (data.module_id) setSelectedModuleId(data.module_id);
          }
        }
      } else if ((route.view === 'song-player' || route.view === 'musical-practice') && route.songId) {
        if (!activeSong || activeSong.id !== route.songId) {
          const { data } = await songsService.getSongById(route.songId);
          if (data) {
            setActiveSong(normalizeSongForPlayer(data));
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [activeLesson, activeSong]);

  // Initial load deep link resolution (F5 or direct link)
  useEffect(() => {
    const route = parseRoute(window.location.pathname);
    if (route.view === 'classroom' && route.lessonId && !activeLesson) {
      lessonsService.getLessonDetails(route.lessonId).then(({ data }) => {
        if (data) {
          setActiveLesson(formatLessonForClassroom(data));
          if (data.module_id) setSelectedModuleId(data.module_id);
        }
      });
    } else if ((route.view === 'song-player' || route.view === 'musical-practice') && route.songId && !activeSong) {
      songsService.getSongById(route.songId).then(({ data }) => {
        if (data) {
          setActiveSong(normalizeSongForPlayer(data));
        }
      });
    }
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
          navigateTo('dashboard', '/dashboard');
        } else if (normalizedRole === 'admin' && currentView === 'admin-login') {
          navigateTo('admin', '/admin');
        }
      } else if (currentView === 'admin') {
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
        navigateTo('admin', '/admin');
      }
      return;
    }

    if (!isPublicAuthRoute) {
      if (!isAuthenticated) {
        const currentPath = window.location.pathname + window.location.search + window.location.hash;
        if (currentPath && currentPath !== '/login' && !currentPath.startsWith('/admin')) {
          sessionStorage.setItem('magic_redirect_after_login', currentPath);
        }
        navigateTo('login', '/login');
      } else if (!isOnboarded && currentView !== 'onboarding') {
        navigateTo('onboarding', '/onboarding');
      } else if (isOnboarded && currentView === 'onboarding') {
        navigateTo('dashboard', '/dashboard');
      }
    } else if (isAuthenticated) {
      if (normalizedRole === 'student' && isOnboarded && ['login', 'register'].includes(currentView)) {
        const savedRedirect = sessionStorage.getItem('magic_redirect_after_login');
        if (savedRedirect && savedRedirect !== '/login' && savedRedirect !== '/register') {
          sessionStorage.removeItem('magic_redirect_after_login');
          const targetRoute = parseRoute(savedRedirect);
          setCurrentView(targetRoute.view);
          if (targetRoute.tab) setActiveTab(targetRoute.tab);
          if (targetRoute.moduleId) setSelectedModuleId(targetRoute.moduleId);
          if (targetRoute.lessonId) {
            lessonsService.getLessonDetails(targetRoute.lessonId).then(({ data }) => {
              if (data) setActiveLesson(formatLessonForClassroom(data));
            });
          }
          if (targetRoute.songId) {
            songsService.getSongById(targetRoute.songId).then(({ data }) => {
              if (data) setActiveSong(normalizeSongForPlayer(data));
            });
          }
          if (window.location.pathname !== savedRedirect) {
            window.history.pushState({ view: targetRoute.view }, '', savedRedirect);
          }
        } else {
          navigateTo('dashboard', '/dashboard');
        }
      }
    }
  }, [currentView, isAuthenticated, isOnboarded, isPasswordRecovery, loading, role]);

  // Open Classroom Video Lesson View
  const handleOpenClassroom = (lessonData) => {
    if (!lessonData) {
      setActiveLesson(null);
      navigateTo('classroom', '/classroom');
    } else {
      const formatted = formatLessonForClassroom(lessonData);
      setActiveLesson(formatted);
      if (formatted.moduleId) {
        setSelectedModuleId(formatted.moduleId);
      }
      setActiveTab('classes');
      const targetPath = formatted.id ? `/classroom/${formatted.id}` : '/classroom';
      navigateTo('classroom', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Magic Song Lesson View
  const handleOpenSongPlayer = async (song) => {
    if (typeof song === 'string') {
      try {
        const { data } = await songsService.getSongById(song);
        if (data) {
          const lessonData = normalizeSongForPlayer(data);
          setActiveSong(lessonData);
          setActiveTab('songs');
          navigateTo('song-player', `/songs/${lessonData.id}`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      } catch (err) {
        console.warn('Erro ao carregar música por ID:', err);
      }
    }
    const lessonData = normalizeSongForPlayer(song);
    setActiveSong(lessonData);
    setActiveTab('songs');
    const targetPath = lessonData?.id ? `/songs/${lessonData.id}` : '/songs';
    navigateTo('song-player', targetPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open 4-Step Musical Practice Lab
  const handleOpenMusicalPractice = async (song = null) => {
    if (typeof song === 'string') {
      try {
        const { data } = await songsService.getSongById(song);
        if (data) {
          const normalized = normalizeSongForPlayer(data);
          setActiveSong(normalized);
          navigateTo('musical-practice', `/musical-practice/${normalized.id}`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      } catch (err) {
        console.warn('Erro ao carregar música por ID para prática:', err);
      }
    }

    if (song && typeof song === 'object') {
      const normalized = normalizeSongForPlayer(song);
      setActiveSong(normalized);
      const targetPath = normalized?.id ? `/musical-practice/${normalized.id}` : '/musical-practice';
      navigateTo('musical-practice', targetPath);
    } else if (activeLesson?.relatedSong) {
      const normalized = normalizeSongForPlayer(activeLesson.relatedSong);
      setActiveSong(normalized);
      const targetPath = normalized?.id ? `/musical-practice/${normalized.id}` : '/musical-practice';
      navigateTo('musical-practice', targetPath);
    } else {
      songsService.getSongs().then(({ data }) => {
        if (data && data.length > 0) {
          const normalized = normalizeSongForPlayer(data[0]);
          setActiveSong(normalized);
          navigateTo('musical-practice', `/musical-practice/${normalized.id}`);
        } else {
          navigateTo('musical-practice', '/musical-practice');
        }
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back Button Handlers (Hierarchy Preservation)
  const handleBackFromClassroom = () => {
    if (activeLesson?.moduleId) {
      setSelectedModuleId(activeLesson.moduleId);
      navigateTo('my-lessons', `/my-lessons/${activeLesson.moduleId}`);
    } else if (selectedModuleId) {
      navigateTo('my-lessons', `/my-lessons/${selectedModuleId}`);
    } else {
      setSelectedModuleId(null);
      navigateTo('my-lessons', '/my-lessons');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromMusicalPractice = () => {
    if (activeLesson?.id) {
      navigateTo('classroom', `/classroom/${activeLesson.id}`);
    } else if (selectedModuleId) {
      navigateTo('my-lessons', `/my-lessons/${selectedModuleId}`);
    } else {
      setSelectedModuleId(null);
      navigateTo('my-lessons', '/my-lessons');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromSongPlayer = () => {
    navigateTo('dashboard', '/dashboard');
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnToDashboard = () => {
    navigateTo('dashboard', '/dashboard');
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTracksPage = () => {
    setActiveTab('tracks');
    navigateTo('tracks', '/tracks');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSidebarTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'home') {
      setSelectedModuleId(null);
      navigateTo('dashboard', '/dashboard');
    } else if (tabId === 'classes') {
      setSelectedModuleId(null);
      navigateTo('my-lessons', '/my-lessons');
    } else if (tabId === 'tracks') {
      navigateTo('tracks', '/tracks');
    } else if (tabId === 'songs') {
      if (activeSong?.id) {
        navigateTo('song-player', `/songs/${activeSong.id}`);
      } else {
        songsService.getSongs().then(({ data }) => {
          if (data && data.length > 0) {
            handleOpenSongPlayer(data[0]);
          } else {
            handleOpenSongPlayer(null);
          }
        });
      }
    } else if (tabId === 'materials') {
      navigateTo('materials', '/materials');
    } else if (tabId === 'pronunciation') {
      navigateTo('pronunciation', '/pronunciation');
    } else if (tabId === 'avatar-practice') {
      navigateTo('avatar-practice', '/avatar-practice');
    } else if (tabId === 'achievements') {
      navigateTo('gamification', '/achievements');
    } else if (tabId === 'ranking') {
      navigateTo('ranking', '/ranking');
    } else if (tabId === 'community') {
      navigateTo('community', '/community');
    } else if (tabId === 'profile') {
      navigateTo('profile', '/profile');
    } else if (tabId === 'settings') {
      navigateTo('settings', '/settings');
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
          const savedRedirect = sessionStorage.getItem('magic_redirect_after_login');
          if (savedRedirect && savedRedirect !== '/login' && savedRedirect !== '/register') {
            sessionStorage.removeItem('magic_redirect_after_login');
            const targetRoute = parseRoute(savedRedirect);
            setCurrentView(targetRoute.view);
            if (targetRoute.tab) setActiveTab(targetRoute.tab);
            if (targetRoute.moduleId) setSelectedModuleId(targetRoute.moduleId);
            if (targetRoute.lessonId) {
              lessonsService.getLessonDetails(targetRoute.lessonId).then(({ data }) => {
                if (data) setActiveLesson(formatLessonForClassroom(data));
              });
            }
            if (targetRoute.songId) {
              songsService.getSongById(targetRoute.songId).then(({ data }) => {
                if (data) setActiveSong(normalizeSongForPlayer(data));
              });
            }
            if (window.location.pathname !== savedRedirect) {
              window.history.pushState({ view: targetRoute.view }, '', savedRedirect);
            }
          } else {
            navigateTo('dashboard', '/dashboard');
            setActiveTab('home');
          }
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
        {/* 1. Dark Student Sidebar (Desktop Fixed + Mobile Lateral Drawer) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tabId) => {
            handleSidebarTabChange(tabId);
            setIsMobileMenuOpen(false);
          }}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onLogout={handleLogout}
        />

        {/* 2. Main Content Center Column */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          {/* Top Sticky Header with Dynamic User Info & Mobile Hamburger */}
          <Header 
            searchQuery={searchQuery} 
            onSearch={setSearchQuery}
            onOpenGamification={() => handleSidebarTabChange('ranking')}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />

          {/* Global Announcement Banner (Configured via SettingsManager) */}
          {globalBanner.enabled && globalBanner.text && (
            <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-900/90 border-b border-purple-500/40 px-6 py-2.5 text-center text-xs font-bold text-purple-100 flex items-center justify-center gap-2 shadow-lg animate-in fade-in duration-300">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
              <span>{globalBanner.text}</span>
            </div>
          )}

          {/* Dynamic Views Router with Lazy Loading Suspense & Global Error Boundary */}
          <ErrorBoundary>
            <Suspense fallback={<MagicLoadingScreen />}>
              {currentView === 'classroom' ? (
                <MagicClassroomView
                  lesson={activeLesson}
                  onBack={handleBackFromClassroom}
                  onOpenMusicPlayer={(song) => handleOpenMusicalPractice(song)}
                  onNextLesson={() => {
                    handleOpenClassroom({
                      lessonNumber: "Aula 02",
                      title: "Numbers — Aprenda os números em inglês",
                      duration: "18 minutos"
                    });
                  }}
                  onGainXp={(amount) => {
                    // Celebration modal & XP are handled safely within MagicClassroomView via addXp('lesson_complete')
                  }}
                />
              ) : currentView === 'musical-practice' ? (
                !featureFlags.enableMagicSongs ? (
                  <div className="flex-1 p-8 max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-4 my-auto animate-in fade-in duration-200">
                    <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-xl">
                      <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white">Magic Songs em Atualização</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        A prática musical interativa está passando por uma atualização de repertório pelo professor.
                      </p>
                    </div>
                    <button
                      onClick={() => handleSidebarTabChange('home')}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                ) : (
                  <MusicalPracticeView
                    song={activeSong}
                    onBack={handleBackFromMusicalPractice}
                    onGainXp={(amount) => {
                      // Celebration modal & XP are handled safely within MusicalPracticeView via addXp('practice_complete')
                    }}
                  />
                )
              ) : currentView === 'my-lessons' ? (
                <MyModulesView
                  selectedModuleId={selectedModuleId}
                  onModuleChange={(modId) => {
                    setSelectedModuleId(modId);
                    if (modId) {
                      navigateTo('my-lessons', `/my-lessons/${modId}`);
                    } else {
                      navigateTo('my-lessons', '/my-lessons');
                    }
                  }}
                  onOpenClassroomLesson={(lesson) => handleOpenClassroom(lesson)}
                  onOpenMusicalPractice={(song) => handleOpenMusicalPractice(song)}
                />
              ) : currentView === 'materials' ? (
                !featureFlags.enablePdfMaterials ? (
                  <div className="flex-1 p-8 max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-4 my-auto animate-in fade-in duration-200">
                    <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-xl">
                      <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white">Materiais em Revisão</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        A biblioteca de apostilas e PDFs está passando por uma revisão pedagógica temporária.
                      </p>
                    </div>
                    <button
                      onClick={() => handleSidebarTabChange('home')}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                ) : (
                  <MaterialsView />
                )
              ) : currentView === 'pronunciation' ? (
                !featureFlags.enablePronunciationAI ? (
                  <div className="flex-1 p-8 max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-4 my-auto animate-in fade-in duration-200">
                    <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xl">
                      <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white">Laboratório de Pronúncia em Atualização</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        O módulo de avaliação de voz com inteligência artificial está passando por melhorias técnicas.
                      </p>
                    </div>
                    <button
                      onClick={() => handleSidebarTabChange('home')}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                ) : (
                  <PronunciationLabView />
                )
              ) : currentView === 'avatar-practice' ? (
                <AvatarPracticeView
                  onGainXp={(amount) => {
                    // XP já é somado e celebrado no contexto
                  }}
                />
              ) : currentView === 'ranking' ? (
                !featureFlags.enableRanking ? (
                  <div className="flex-1 p-8 max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-4 my-auto animate-in fade-in duration-200">
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
                      <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white">Ranking em Manutenção</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        A classificação semanal está temporariamente em rotação de temporada pelo administrador.
                      </p>
                    </div>
                    <button
                      onClick={() => handleSidebarTabChange('home')}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                ) : (
                  <MagicRankingView
                    onContinueStudy={() => handleSidebarTabChange('classes')}
                  />
                )
              ) : currentView === 'community' ? (
                !featureFlags.enableCommunity ? (
                  <div className="flex-1 p-8 max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-4 my-auto animate-in fade-in duration-200">
                    <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-xl">
                      <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white">Comunidade Temporariamente Indisponível</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        O mural e os grupos estão passando por manutenção programada pelo administrador.
                      </p>
                    </div>
                    <button
                      onClick={() => handleSidebarTabChange('home')}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                ) : (
                  <MagicCommunityView
                    onOpenClassroom={(lesson) => handleOpenClassroom(lesson)}
                    onOpenMusicalPractice={(song) => handleOpenMusicalPractice(song)}
                  />
                )
              ) : currentView === 'settings' ? (
                <StudentSettingsView />
              ) : currentView === 'profile' ? (
                <StudentProfileView
                  onOpenSong={(song) => handleOpenSongPlayer(song)}
                  onOpenModule={() => handleSidebarTabChange('classes')}
                  onOpenClassroom={(lesson) => handleOpenClassroom(lesson)}
                />
              ) : currentView === 'gamification' ? (
                !featureFlags.enableGamification ? (
                  <div className="flex-1 p-8 max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-4 my-auto animate-in fade-in duration-200">
                    <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-xl">
                      <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white">Conquistas em Atualização</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        O painel de medalhas e recompensas está temporariamente em manutenção pelo administrador.
                      </p>
                    </div>
                    <button
                      onClick={() => handleSidebarTabChange('home')}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                ) : (
                  <GamificationHubView 
                    onOpenLesson={(lesson) => handleOpenClassroom(lesson)}
                    onOpenSong={(song) => handleOpenSongPlayer(song)}
                  />
                )
              ) : currentView === 'song-player' ? (
                !featureFlags.enableMagicSongs ? (
                  <div className="flex-1 p-8 max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-4 my-auto animate-in fade-in duration-200">
                    <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-xl">
                      <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white">Magic Songs em Atualização</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        O catálogo musical está passando por uma atualização de faixas e letras.
                      </p>
                    </div>
                    <button
                      onClick={() => handleSidebarTabChange('home')}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                ) : (
                  <MagicSongView
                    song={activeSong}
                    onBack={handleBackFromSongPlayer}
                    onGainXp={(amount) => {
                      // Celebration modal & XP are handled safely within PracticeCards via addXp('song_claim')
                    }}
                  />
                )
              ) : currentView === 'tracks' ? (
                <LearningTracksPage
                  onOpenLesson={(lesson) => {
                    handleOpenClassroom({
                      ...lesson,
                      id: lesson.id,
                      moduleId: lesson.moduleId,
                      number: lesson.number,
                      lessonNumber: `Aula ${lesson.number}`,
                      title: lesson.title,
                      duration: lesson.duration,
                      module: lesson.module || "Inglês do Zero",
                      songId: lesson.songId,
                      videoUrl: lesson.videoUrl || lesson.video_url || '',
                      relatedSong: lesson.relatedSong || null,
                      videoThumbnail: lesson.videoThumbnail || lesson.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80'
                    });
                  }}
                />
              ) : (
                <main className="flex-1 w-full flex flex-col">
                  {/* 1. Full Width Edge-to-Edge Hero Banner (Kiwify / Streaming Style) */}
                  <HeroBanner
                    onContinue={() => handleSidebarTabChange('classes')}
                    onExplore={() => handleSidebarTabChange('classes')}
                    onSelectSong={(song) => handleOpenSongPlayer(song)}
                  />

                  {/* 2. Dashboard Body Sections with Standard Layout Container */}
                  <div className="p-6 sm:p-8 lg:p-10 space-y-8 sm:space-y-10 max-w-7xl w-full mx-auto pb-16">
                    {/* Card "Continuar de Onde Parou" (Próxima Aula do Aluno) */}
                    <ContinueLearningCard
                      onOpenLesson={(lesson) => handleOpenClassroom(lesson)}
                      onOpenModule={(modId) => {
                        setSelectedModuleId(modId);
                        navigateTo('my-lessons', `/my-lessons/${modId}`);
                      }}
                    />

                    {/* Cards "Meu Foco" (profiles.objective) & "Minha Meta Diária" (profiles.daily_study_time) */}
                    <DashboardFocusCards
                      onOpenProfile={() => handleSidebarTabChange('profile')}
                    />

                    {/* Minha Evolução Card (Level, XP Bar, Streak & Next Goal) */}
                    <MyEvolutionCard
                      onOpenEvolutionHub={() => handleSidebarTabChange('ranking')}
                    />

                    {/* "Reforce seu aprendizado com músicas" Section (Magic Songs Fixation) */}
                    <MagicSongsSection onSelectSong={(song) => handleOpenSongPlayer(song)} />

                    {/* "Trilhas & Módulos de Aprendizado" Section (Módulos Reais do Supabase) */}
                    <LearningTracksSection 
                      onSelectTrack={() => handleOpenTracksPage()}
                      onSelectModule={(modId) => {
                        setSelectedModuleId(modId);
                        navigateTo('my-lessons', `/my-lessons/${modId}`);
                      }}
                      onViewAll={() => handleOpenTracksPage()}
                    />
                  </div>
                </main>
              )}
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* 3. Fixed Right Panel */}
        <RightPanel onOpenGamification={() => handleSidebarTabChange('ranking')} />

        {/* Global Celebratory Premium Reward Modal */}
        <CompletionCelebration
          isOpen={rewardModal.isOpen}
          onClose={closeRewardModal}
          type={rewardModal.type}
          title={rewardModal.title}
          subtitle={rewardModal.subtitle}
          description={rewardModal.subtitle}
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
