import React, { useState, useEffect } from 'react';
import TracksListView from './TracksListView';
import TrackDetailView from './TrackDetailView';
import { tracksData } from '../../data/tracksData';
import { modulesService } from '../../services/modulesService';
import { lessonsService } from '../../services/lessonsService';
import { songsService } from '../../services/songsService';

export default function LearningTracksPage({ onOpenLesson }) {
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [enrichedTracks, setEnrichedTracks] = useState(tracksData);

  useEffect(() => {
    let isMounted = true;
    async function loadRealTrackData() {
      try {
        const [modsRes, lessonsRes, songsRes] = await Promise.all([
          modulesService.getModules(),
          lessonsService.getAllLessons(),
          songsService.getSongs()
        ]);

        const dbModules = modsRes.data || [];
        const dbLessons = lessonsRes.data || [];
        const dbSongs = songsRes.data || [];

        if (isMounted && dbModules.length > 0) {
          // Build real module and lesson hierarchy for Track 1 ("Inglês do Zero")
          const realModulesForTrack = dbModules.map((mod, modIdx) => {
            const modLessons = dbLessons.filter((l) => l.module_id === mod.id);
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
              description: mod.description || 'Módulo Oficial Magic English',
              lessons: formattedLessons.length > 0 ? formattedLessons : (tracksData[0].modules[modIdx]?.lessons || [])
            };
          });

          const totalLessons = realModulesForTrack.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
          const totalSongs = dbSongs.length || 1;

          const updatedTrackZero = {
            ...tracksData[0],
            modules: realModulesForTrack,
            lessonsCount: totalLessons || tracksData[0].lessonsCount,
            songsCount: totalSongs || tracksData[0].songsCount
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
  }, []);

  const handleSelectTrack = (track) => {
    // Find enriched version if available
    const enriched = enrichedTracks.find((t) => t.id === track.id) || track;
    setSelectedTrack(enriched);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedTrack(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLessonSelect = (lesson) => {
    if (onOpenLesson) {
      onOpenLesson(lesson);
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
          onSelectTrack={handleSelectTrack}
          onContinueCurrentTrack={() => handleSelectTrack(enrichedTracks[0])}
        />
      )}
    </div>
  );
}
