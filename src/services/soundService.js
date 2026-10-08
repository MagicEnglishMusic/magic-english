/**
 * soundService.js - Centralized Audio & Reward Sound Effects Manager
 * 
 * Manages celebration audio playback (e.g. XP rewards, level up, badge claims)
 * with debounce, audio caching, and graceful failure handling for browser autoplay policies.
 */

class SoundService {
  constructor() {
    this.rewardAudio = null;
    this.isPlaying = false;
    this.lastPlayTime = 0;
  }

  /**
   * Initializes or gets the reward applause Audio element
   */
  getRewardAudio() {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      return null;
    }

    if (!this.rewardAudio) {
      this.rewardAudio = new Audio('/sounds/reward-applause.mp3');
      this.rewardAudio.preload = 'auto';
      this.rewardAudio.volume = 0.75;
      
      this.rewardAudio.addEventListener('ended', () => {
        this.isPlaying = false;
      });

      this.rewardAudio.addEventListener('error', (e) => {
        console.warn('[soundService] Aviso ao carregar áudio de recompensa:', e);
        this.isPlaying = false;
      });
    }

    return this.rewardAudio;
  }

  /**
   * Plays the celebratory reward applause sound effect.
   * Debounces calls within 1.5 seconds to prevent overlapping audio chaos.
   */
  playRewardSound() {
    try {
      const now = Date.now();
      // Debounce: don't restart if played in the last 1500ms
      if (now - this.lastPlayTime < 1500) {
        return;
      }

      const audio = this.getRewardAudio();
      if (!audio) return;

      this.lastPlayTime = now;
      this.isPlaying = true;

      audio.currentTime = 0;
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Browser prevented autoplay or user hasn't interacted yet
          console.warn('[soundService] Reprodução de áudio prevenida pelo navegador:', err.message);
          this.isPlaying = false;
        });
      }
    } catch (err) {
      console.warn('[soundService] Erro ao reproduzir som de recompensa:', err);
      this.isPlaying = false;
    }
  }

  /**
   * Stops any currently playing reward sound
   */
  stopRewardSound() {
    try {
      if (this.rewardAudio) {
        this.rewardAudio.pause();
        this.rewardAudio.currentTime = 0;
        this.isPlaying = false;
      }
    } catch (_) {}
  }
}

export const soundService = new SoundService();
export const playRewardSound = () => soundService.playRewardSound();
export default soundService;
