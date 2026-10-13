import React, { useState, useEffect } from 'react';
import TracksListView from './TracksListView';
import TrackDetailView from './TrackDetailView';
import { tracksData } from '../../data/tracksData';
import { modulesService } from '../../services/modulesService';
import { lessonsService } from '../../services/lessonsService';
import { songsService } from '../../services/songsService';
import { progressService } from '../../services/progressService';
import { useAuth } from '../../context/AuthContext';

export default function LearningTracksPage({ onOpenLesson }) {
  const { user } = useAuth();
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [enrichedTracks, setEnrichedTracks] = useState(tracksData);

  useEffect(() => {
    let isMounted = true;
    async function loadRealTrackData() {
      try {
        const [modsRes, lessonsRes, songsRes, progRes] = await Promise.all([
          modulesService.getModules(),
          lessonsService.getAllLessons(),
          songsService.getSongs(),
          user?.id ? progressService.getUserProgress(user.id) : Promise.resolve({ data: [] })
        ]);

        const dbModules = modsRes.data || [];
        const dbLessons = lessonsRes.data || [];
        const dbSongs = songsRes.data || [];
        const dbProgress = progRes?.data || [];

        if (isMounted && dbModules.length > 0) {
          // Filtragem de Visibilidade Dupla:
          // 1. Chave DESLIGADA (is_visible === false): oculto de forma absoluta
          // 2. Status 'draft' (Rascunho): oculto de forma absoluta
          const visibleModules = dbModules.filter((m) => m.is_visible !== false && m.status !== 'draft');

          // Build real module and lesson hierarchy for Track 1 ("Inglês do Zero")
          const realModulesForTrack = visibleModules.map((mod) => {
            const isComingSoon = mod.status === 'coming_soon';
            const modLessons = isComingSoon ? [] : dbLessons.filter((l) => l.module_id === mod.id);
            const formattedLessons = modLessons.map((l, lIdx) => {
              // Match SSOT song for this lesson
              const matchedSong = dbSongs.find((s) => s.lesson_id === l.id || s.module_id === mod.id) || dbSongs[0] || null;

              return {
                id: l.id,
                number: String(lIdx + 1).padStart(2, '0'),
                title: l.title,
                type: 'Música & Vocabulário',
                duration: l.duration || '12:45',
                status: lIdx === 0 ? 'in_progress' : 'locked',
                xp: 50,
                songId: matchedSong?.id || null,
                relatedSong: matchedSong,
                module: mod.title,
                moduleId: mod.id,
                videoUrl: l.video_url,
                description: l.description,
                downloadableFiles: l.materials || [],
                extractedPronunciation: Array.isArray(matchedSong?.pronunciation_guide) ? matchedSong.pronunciation_guide : []
              };
            });

            return {
              id: mod.id,
              title: mod.title,
              description: isComingSoon ? 'Conteúdo em preparação. Em breve disponível!' : (mod.description || 'Módulo Oficial Magic English'),
              isComingSoon,
              status: isComingSoon ? 'locked' : (mod.status || 'published'),
              lessons: formattedLessons
            };
          });

          const totalLessons = realModulesForTrack.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
          
          // Cálculo do percentual real baseado em user_progress (completed === true ou progress_percent === 100)
          const allTrackLessonIds = new Set(dbLessons.filter((l) => dbModules.some((m) => m.id === l.module_id)).map((l) => l.id));
          const totalCompletedLessons = (dbProgress || []).filter((p) => 
            allTrackLessonIds.has(p.lesson_id) && (p.completed === true || p.progress_percent === 100)
          ).length;

          const totalSongs = dbSongs.length || 0;
          const realProgressPercent = totalLessons > 0 ? Math.round((totalCompletedLessons / totalLessons) * 100) : 0;

          const updatedTrackZero = {
            ...tracksData[0],
            modules: realModulesForTrack,
            lessonsCount: totalLessons,
            songsCount: totalSongs,
            progress: realProgressPercent
          };

          const newTracks = [updatedTrackZero, ...tracksData.slice(1)];
          setEnrichedTracks(newTracks);
        }
      } catch (err) {
        console.warn('Error loading real track data from Supabase:', err);
      }
    }

    loadRealTrackData();
    return () => { isMounted = false; };
  }, [user?.id]);

  const handleSelectTrack = (track) => {
    const enriched = enrichedTracks.find((t) => t.id === track.id) || track;
    setSelectedTrack(enriched);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedTrack(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLessonSelect = (lesson) => {
    if (onOpenLesson && lesson?.id) {
      onOpenLesson(lesson);
    }
  };

  // Find first real lesson of the current track
  const handleContinueTrack = (track) => {
    const targetTrack = enrichedTracks.find((t) => t.id === track.id) || track || enrichedTracks[0];
    let firstRealLesson = null;
    if (targetTrack?.modules && Array.isArray(targetTrack.modules)) {
      for (const m of targetTrack.modules) {
        if (Array.isArray(m.lessons) && m.lessons.length > 0) {
          firstRealLesson = m.lessons[0];
          break;
        }
      }
    }

    if (firstRealLesson) {
      handleLessonSelect(firstRealLesson);
    } else {
      handleSelectTrack(targetTrack);
    }
  };

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
      {selectedTrack ? (
        <TrackDetailView
          track={selectedTrack}
          onBack={handleBackToList}
          onSelectLesson={handleLessonSelect}
        />
      ) : (
        <TracksListView
          tracks={enrichedTracks}
          onSelectTrack={handleSelectTrack}
          onContinueCurrentTrack={handleContinueTrack}
        />
      )}
    </div>
  );
}
