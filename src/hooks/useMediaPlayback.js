import { useState, useEffect } from 'react';
import { isGoogleDriveUrl, getDriveVideoUrl, getDriveAudioUrl } from '../utils/googleDriveHelper';

/**
 * Custom hook to handle video and audio playback state
 */
export function useMediaPlayback({ mediaUrl, mediaType = 'video', initialDuration = 0 }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  const isDrive = isGoogleDriveUrl(mediaUrl);
  const formattedUrl = isDrive
    ? mediaType === 'video'
      ? getDriveVideoUrl(mediaUrl)
      : getDriveAudioUrl(mediaUrl)
    : mediaUrl;

  const togglePlay = () => setIsPlaying((prev) => !prev);

  const seekTo = (percent) => {
    setProgress(percent);
    setCurrentTime(Math.floor((percent / 100) * duration));
  };

  const skipSeconds = (secs) => {
    setCurrentTime((prev) => {
      const next = Math.min(Math.max(prev + secs, 0), duration);
      if (duration > 0) {
        setProgress((next / duration) * 100);
      }
      return next;
    });
  };

  return {
    isPlaying,
    setIsPlaying,
    togglePlay,
    currentTime,
    duration,
    setDuration,
    progress,
    seekTo,
    skipSeconds,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    isDrive,
    formattedUrl
  };
}
