import React, { useState } from 'react';
import TracksListView from './TracksListView';
import TrackDetailView from './TrackDetailView';
import { tracksData } from '../../data/tracksData';

export default function LearningTracksPage({ onOpenLesson }) {
  const [selectedTrack, setSelectedTrack] = useState(null);

  const handleSelectTrack = (track) => {
    setSelectedTrack(track);
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
          onContinueCurrentTrack={() => handleSelectTrack(tracksData[0])}
        />
      )}
    </div>
  );
}
