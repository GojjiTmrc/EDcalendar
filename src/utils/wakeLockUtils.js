import { useState, useEffect, useRef, useCallback } from 'react';

const WAKE_LOCK_PREF_KEY = 'edcalendar_fullscreen_wakelock_pref';
const CHIME_PREF_KEY = 'edcalendar_classroom_chime_enabled';
const DIMMER_PREF_KEY = 'edcalendar_classroom_dimmer_level';

export function getStoredWakeLockPref() {
  try {
    const val = localStorage.getItem(WAKE_LOCK_PREF_KEY);
    // Default to true when opening fullscreen classroom clock
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function saveStoredWakeLockPref(enabled) {
  try {
    localStorage.setItem(WAKE_LOCK_PREF_KEY, String(Boolean(enabled)));
  } catch {
    // Ignore storage error
  }
}

export function getStoredChimePref() {
  try {
    return localStorage.getItem(CHIME_PREF_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveStoredChimePref(enabled) {
  try {
    localStorage.setItem(CHIME_PREF_KEY, String(Boolean(enabled)));
  } catch {
    // Ignore storage error
  }
}

export function getStoredDimmerLevel() {
  try {
    const saved = localStorage.getItem(DIMMER_PREF_KEY);
    if (saved === 'normal' || saved === 'comfort' || saved === 'oled') {
      return saved;
    }
  } catch {
    // Ignore storage error
  }
  return 'normal';
}

export function saveStoredDimmerLevel(level) {
  try {
    localStorage.setItem(DIMMER_PREF_KEY, level);
  } catch {
    // Ignore storage error
  }
}

/**
 * Dual-Layer Screen Wake Lock Hook:
 * 1. Primary: HTML5 Screen Wake Lock API (navigator.wakeLock.request('screen'))
 * 2. Fallback: Hidden 1-FPS Canvas Video Stream loop for browsers without Wake Lock API
 * Also supports automatic release when transitioning into 'after_school' phase.
 */
export function useScreenWakeLock({
  enabled = false,
  onChangeEnabled,
  phase = null,
  autoReleaseAfterSchool = true,
} = {}) {
  const [isAwake, setIsAwake] = useState(false);
  const [wakeMethod, setWakeMethod] = useState('none'); // 'native' | 'fallback' | 'none'
  const [autoReleasedNotice, setAutoReleasedNotice] = useState(false);

  const wakeLockSentinelRef = useRef(null);
  const fallbackVideoRef = useRef(null);
  const fallbackIntervalRef = useRef(null);
  const prevPhaseRef = useRef(phase);

  const releaseAllLocks = useCallback(async () => {
    if (wakeLockSentinelRef.current) {
      try {
        await wakeLockSentinelRef.current.release();
      } catch {
        // Ignore release error
      }
      wakeLockSentinelRef.current = null;
    }

    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }

    if (fallbackVideoRef.current) {
      try {
        fallbackVideoRef.current.pause();
        fallbackVideoRef.current.srcObject = null;
        fallbackVideoRef.current.remove();
      } catch {
        // Ignore cleanup error
      }
      fallbackVideoRef.current = null;
    }

    setIsAwake(false);
    setWakeMethod('none');
  }, []);

  const acquireWakeLock = useCallback(async () => {
    // Layer 1: Native Web Screen Wake Lock API
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (wakeLockSentinelRef.current && !wakeLockSentinelRef.current.released) {
          setIsAwake(true);
          setWakeMethod('native');
          return true;
        }
        const sentinel = await navigator.wakeLock.request('screen');
        wakeLockSentinelRef.current = sentinel;
        sentinel.addEventListener('release', () => {
          // Only mark false if we didn't switch to fallback
          if (!fallbackVideoRef.current) {
            setIsAwake(false);
          }
        });
        setIsAwake(true);
        setWakeMethod('native');
        return true;
      } catch {
        // Fall through to Layer 2 fallback if blocked or unsupported
      }
    }

    // Layer 2: Silent Tiny Canvas Stream Video Fallback
    try {
      if (typeof document === 'undefined') return false;
      if (!fallbackVideoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 2;
        const ctx = canvas.getContext('2d');

        let toggle = false;
        fallbackIntervalRef.current = setInterval(() => {
          if (ctx) {
            ctx.fillStyle = toggle ? '#000000' : '#010101';
            ctx.fillRect(0, 0, 2, 2);
            toggle = !toggle;
          }
        }, 1000);

        if (typeof canvas.captureStream === 'function') {
          const stream = canvas.captureStream(1);
          const video = document.createElement('video');
          video.muted = true;
          video.playsInline = true;
          video.loop = true;
          video.style.position = 'fixed';
          video.style.width = '1px';
          video.style.height = '1px';
          video.style.opacity = '0.01';
          video.style.pointerEvents = 'none';
          video.style.bottom = '0';
          video.style.right = '0';
          video.style.zIndex = '-1';
          video.srcObject = stream;
          document.body.appendChild(video);
          await video.play();
          fallbackVideoRef.current = video;
          setIsAwake(true);
          setWakeMethod('fallback');
          return true;
        }
      } else {
        await fallbackVideoRef.current.play();
        setIsAwake(true);
        setWakeMethod('fallback');
        return true;
      }
    } catch {
      // Fallback also blocked
    }

    setIsAwake(false);
    setWakeMethod('none');
    return false;
  }, []);

  // Acquire or release when `enabled` changes
  useEffect(() => {
    if (enabled) {
      acquireWakeLock();
    } else {
      releaseAllLocks();
    }
    return () => {
      releaseAllLocks();
    };
  }, [enabled, acquireWakeLock, releaseAllLocks]);

  // Re-acquire native wake lock when user switches back to this tab
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        acquireWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [enabled, acquireWakeLock]);

  // Auto-release after school hours when transitioning from school day into 'after_school'
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (
      autoReleaseAfterSchool &&
      enabled &&
      prev &&
      prev !== 'after_school' &&
      phase === 'after_school'
    ) {
      setAutoReleasedNotice(true);
      if (onChangeEnabled) {
        onChangeEnabled(false);
      } else {
        releaseAllLocks();
      }
    }
  }, [phase, autoReleaseAfterSchool, enabled, onChangeEnabled, releaseAllLocks]);

  return {
    isAwake,
    wakeMethod,
    autoReleasedNotice,
    clearAutoReleasedNotice: () => setAutoReleasedNotice(false),
    reacquire: acquireWakeLock,
    release: releaseAllLocks,
  };
}

/**
 * Browser True Fullscreen Hook (F11-style Fullscreen API)
 */
export function useBrowserFullscreen() {
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(() =>
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsBrowserFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const enterBrowserFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Ignore if blocked
    }
  }, []);

  const exitBrowserFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore if blocked
    }
  }, []);

  const toggleBrowserFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await exitBrowserFullscreen();
    } else {
      await enterBrowserFullscreen();
    }
  }, [enterBrowserFullscreen, exitBrowserFullscreen]);

  return {
    isBrowserFullscreen,
    enterBrowserFullscreen,
    exitBrowserFullscreen,
    toggleBrowserFullscreen,
  };
}

/**
 * Synthesizes pleasant classroom chimes using Web Audio API (no external audio files needed)
 * @param {'test' | 'warning' | 'end'} type
 */
export function playClassroomChime(type = 'test') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playNote = (freq, startOffset, duration, peakGain = 0.18) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);

      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + startOffset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.05);
    };

    if (type === 'test') {
      // Gentle 2-note confirmation (G5 -> C6)
      playNote(783.99, 0, 0.22, 0.12);
      playNote(1046.5, 0.18, 0.4, 0.14);
    } else if (type === 'warning') {
      // 5-minute wrap-up reminder chime (E5 -> G5 -> E5)
      playNote(659.25, 0, 0.35, 0.16);
      playNote(783.99, 0.28, 0.35, 0.16);
      playNote(659.25, 0.56, 0.55, 0.16);
    } else if (type === 'end') {
      // End-of-period 4-note school chime (E5 -> G5 -> C5 -> G5 -> C6)
      playNote(659.25, 0, 0.4, 0.2);
      playNote(783.99, 0.35, 0.4, 0.2);
      playNote(523.25, 0.7, 0.4, 0.2);
      playNote(783.99, 1.05, 0.4, 0.2);
      playNote(1046.5, 1.4, 0.9, 0.22);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 3000);
  } catch {
    // Ignore audio context errors
  }
}
