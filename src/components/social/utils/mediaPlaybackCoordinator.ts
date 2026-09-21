/**
 * Media Playback Coordinator
 * 
 * Coordinates audio/video playback with Scene Radio across the app.
 * Scene Radio is designed to pause ONLY when another actual sound/music track or unmuted video
 * is deliberately played by the user (e.g. previewing a song, cassette deck, story with audio).
 *
 * It is carefully scoped so that:
 * - HTMLMediaElement.prototype is NOT monkey-patched (preventing phantom pauses).
 * - Background videos, muted previews, and iframes cannot accidentally suppress the radio.
 * - Scene Radio user actions (Play, Skip, Channel change) are immune to immediate pausing.
 */

export const SCENE_RADIO_PAUSE_EVENT = 'nexus-pause-scene-radio';
export const LEGACY_RADIO_PAUSE_EVENT = 'pause-scene-radio';

let lastDispatchedPauseTime = 0;
let sceneRadioImmunityUntil = 0;

/**
 * Grants Scene Radio immunity from auto-pause for a grace period (e.g. 2500ms).
 * Call this whenever the user explicitly presses Play or interacts with the Scene Radio.
 */
export function markSceneRadioUserActive(gracePeriodMs: number = 2500): void {
  sceneRadioImmunityUntil = Date.now() + gracePeriodMs;
}

/**
 * Checks whether Scene Radio is currently in its user interaction immunity window.
 */
export function isSceneRadioImmune(): boolean {
  return Date.now() < sceneRadioImmunityUntil;
}

/**
 * Requests Scene Radio to pause due to explicit external audio/music playback.
 * Automatically respects the user immunity window and throttles duplicate calls.
 */
export function requestPauseSceneRadio(reason: string = 'media_playback'): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  // If user just interacted with Scene Radio, do not pause it!
  if (now < sceneRadioImmunityUntil) {
    return;
  }

  // Throttle duplicate dispatches within 300ms
  if (now - lastDispatchedPauseTime < 300) return;
  lastDispatchedPauseTime = now;

  try {
    const detail = { reason, timestamp: now };
    window.dispatchEvent(new CustomEvent(SCENE_RADIO_PAUSE_EVENT, { detail }));
    window.dispatchEvent(new CustomEvent(LEGACY_RADIO_PAUSE_EVENT, { detail }));
    document.dispatchEvent(new CustomEvent(SCENE_RADIO_PAUSE_EVENT, { detail }));
  } catch (err) {
    console.warn('[MediaPlaybackCoordinator] Pause dispatch error:', err);
  }
}

/**
 * Targeted DOM media listener.
 * ONLY triggers when an unmuted, audible HTML audio/video element (not belonging to the radio)
 * genuinely starts playing. Does NOT patch prototypes and does NOT sniff cross-origin postMessages.
 */
export function initGlobalMediaInterceptors(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleMediaPlay = (e: Event) => {
    try {
      const target = e.target as HTMLMediaElement | null;
      if (!target || typeof target.tagName !== 'string') return;
      const tag = target.tagName.toUpperCase();
      if (tag !== 'AUDIO' && tag !== 'VIDEO') return;

      // Ignore if marked as scene radio or inside scene radio container
      const isRadio =
        target.id === 'youtube-radio-player' ||
        target.getAttribute('data-scene-radio') === 'true' ||
        Boolean(target.closest?.('[data-scene-radio="true"]'));

      if (isRadio) return;

      // IGNORE muted videos/audios or zero volume (e.g. background looping video clips, story thumbnails)
      if (target.muted || target.volume <= 0.01) {
        return;
      }

      // Audible non-radio media has started playing
      requestPauseSceneRadio('dom_media_play');
    } catch {
      // safe fallback
    }
  };

  const handleVolumeChange = (e: Event) => {
    try {
      const target = e.target as HTMLMediaElement | null;
      if (!target || typeof target.tagName !== 'string') return;
      const tag = target.tagName.toUpperCase();
      if (tag !== 'AUDIO' && tag !== 'VIDEO') return;

      const isRadio =
        target.id === 'youtube-radio-player' ||
        target.getAttribute('data-scene-radio') === 'true' ||
        Boolean(target.closest?.('[data-scene-radio="true"]'));

      if (isRadio) return;

      // If user specifically unmuted an active playing media element
      if (!target.paused && !target.muted && target.volume > 0.01) {
        requestPauseSceneRadio('media_unmuted');
      }
    } catch {
      // safe fallback
    }
  };

  // Passive capture listeners for actual audible media playback
  window.addEventListener('play', handleMediaPlay, true);
  window.addEventListener('volumechange', handleVolumeChange, true);

  return () => {
    window.removeEventListener('play', handleMediaPlay, true);
    window.removeEventListener('volumechange', handleVolumeChange, true);
  };
}
