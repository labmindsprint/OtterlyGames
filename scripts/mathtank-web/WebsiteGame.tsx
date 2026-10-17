'use client';

import { useCallback, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { GameProvider, useGame } from './lib/GameContext';
import { ToastProvider } from './components/Toast';
import { AppContent } from './App';
import { VolumeButton } from './components/VolumeButton';
import { initializeAudio, updateAudioSettings, muteAllAudio, cleanupAudio } from './lib/sound';
import { setBattleSoundEnabled, stopAllBattleSounds } from './lib/battleSounds';
import { setupTTSVisibilityHandler, stopSpeaking } from './lib/ttsService';
import { useAppVisibility } from './lib/useAppVisibility';
import { PLAY_STORE_URL } from './lib/reviewService';

const SAVE_KEYS = [
  'mathTank_gameState', 'mathTank_settings', 'mathTank_progress',
  'mathTank_fuel', 'mathTank_achievements', 'mathTank_dailyChallenge',
  'mathTank_customizations', 'math_tank_universe_progress', 'math_tank_universe_hints',
] as const;

function checkBrowserStorage(): void {
  const storage = window.localStorage;
  // Do not let production's recovery-to-defaults overwrite malformed saves.
  for (const key of SAVE_KEYS) {
    const saved = storage.getItem(key);
    if (saved !== null) {
      const parsed: unknown = JSON.parse(saved);
      if (parsed === null || typeof parsed !== 'object') throw new Error('Unreadable browser save');
    }
  }
  const probe = `mathTank_website_storage_check_${Date.now()}_${Math.random()}`;
  try {
    storage.setItem(probe, 'available');
    if (storage.getItem(probe) !== 'available') throw new Error('Browser storage is unavailable');
  } finally {
    storage.removeItem(probe);
  }
}

function silence() {
  muteAllAudio();
  setBattleSoundEnabled(false);
  stopAllBattleSounds();
  void stopSpeaking();
}

function BrowserUniverse({ onStorageError }: { onStorageError: () => void }) {
  const { isDataLoaded, settings } = useGame();
  const visible = useAppVisibility();
  const [playing, setPlaying] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const universeOnly = new URLSearchParams(window.location.search).get('mode') === 'universe';

  useEffect(() => {
    const cleanupVisibility = setupTTSVisibilityHandler();
    return () => {
      silence();
      cleanupVisibility();
      cleanupAudio();
    };
  }, []);

  useEffect(() => {
    if (!playing || !isDataLoaded || !visible) {
      silence();
      return;
    }
    updateAudioSettings({
      soundEnabled: settings.soundEnabled,
      musicEnabled: settings.musicEnabled,
      musicVolume: settings.musicVolume,
      hapticEnabled: settings.hapticFeedback,
    });
    setBattleSoundEnabled(settings.soundEnabled);
  }, [playing, isDataLoaded, settings, visible]);

  function start() {
    try {
      checkBrowserStorage();
    } catch {
      onStorageError();
      return;
    }
    // Audio is initialized only by an explicit user gesture, never on page load.
    initializeAudio();
    updateAudioSettings({
      soundEnabled: settings.soundEnabled,
      musicEnabled: settings.musicEnabled,
      musicVolume: settings.musicVolume,
      hapticEnabled: settings.hapticFeedback,
    });
    setBattleSoundEnabled(settings.soundEnabled);
    setHelpOpen(false);
    setPlaying(true);
  }

  function home() {
    silence();
    setPlaying(false);
    setHelpOpen(false);
  }

  return <MotionConfig reducedMotion="user">
    <main className={`web-game${playing ? ' web-game--playing' : ''}`}
      data-testid="website-game" data-web-paused={!visible || !playing}>
      {playing ? <>
        <header className="web-toolbar">
          <button type="button" onClick={home}>Game home / take a break</button>
          <a href="/" target="_top">Otterly Games</a>
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">Install mobile version</a>
          <button type="button" onClick={() => setHelpOpen(value => !value)}
            aria-expanded={helpOpen} aria-controls="web-help">Help</button>
          <VolumeButton variant="dark" size="sm" />
          {helpOpen && <p id="web-help" className="web-toolbar-help">
            Choose Battle, Universe, Learn or Garage on the game home screen. Free energy and hints refill daily.
            Use Game home to take a break; an unfinished battle restarts when you return.
            Finished progress stays in this browser.
          </p>}
        </header>
        <section className="web-app" aria-label="Math Tank game">
          {isDataLoaded && <AppContent initialScreen={universeOnly ? 'saveUniverse' : 'home'} />}
        </section>
      </> : <section className="web-start">
        <p className="web-eyebrow">MATH TANK · BROWSER EDITION</p>
        <h1>{universeOnly ? 'Save the Universe' : 'Math Tank'}</h1>
        <p className="web-intro">Battle with math, rescue 30 worlds, learn new skills and customize your tank.</p>
        <button type="button" className="web-play" onClick={start} disabled={!isDataLoaded}>
          {isDataLoaded ? (universeOnly ? 'Play Universe' : 'Play Math Tank') : 'Loading your browser save…'}
        </button>
        <div className="web-start-audio">
          <VolumeButton variant="dark" size="sm" />
          <span>Music and sound</span>
        </div>
        <p className="web-save-notice">
          Progress is saved only on this browser, not an account. Keep using the same browser and device.
          Clearing site data or ending a private browsing session can erase your progress.
        </p>
        <details className="web-help">
          <summary>How to play &amp; healthy breaks</summary>
          <p>Choose Battle, Universe, Learn or Garage from the game home screen.
            Learn includes lessons and unlimited practice. Your free energy and hints refill daily.
            Daily play limits are the same as the app; rewarded videos are unavailable here.</p>
          <p>Take regular screen breaks. Use Game home or the in-game back button to stop playing.
            Completed progress is kept; an unfinished battle restarts. Browser zoom is supported.</p>
        </details>
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">Install mobile version on Google Play</a>
        <a href="/" target="_top">Return to Otterly Games</a>
      </section>}
    </main>
  </MotionConfig>;
}

export default function WebsiteGame() {
  const [storage, setStorage] = useState<'checking' | 'ready' | 'blocked'>('checking');
  const fail = useCallback(() => {
    silence();
    setStorage('blocked');
  }, []);

  useEffect(() => {
    const check = () => {
      try {
        checkBrowserStorage();
        setStorage('ready');
      } catch {
        fail();
      }
    };
    check();
    // Also catch browser permission/quota changes during a session.
    const recheck = () => {
      if (!document.hidden) {
        try { checkBrowserStorage(); } catch { fail(); }
      }
    };
    const interval = window.setInterval(recheck, 5000);
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, [fail]);

  if (storage === 'checking') return <p role="status" className="web-loading">Checking browser storage…</p>;
  if (storage === 'blocked') return <main className="web-storage-error">
    <h1>Progress cannot be saved</h1>
    <p role="alert">Math Tank could not read or write your browser save. Play is stopped to avoid losing progress.</p>
    <p>Allow site data for this website, check that your browser has free storage, then reload.
      If you are in a restricted embed, open the game directly. Existing unreadable saves are not reset automatically.</p>
    <button type="button" onClick={() => window.location.reload()}>Reload and check again</button>
    <a href={window.location.pathname} target="_top">Open Math Tank directly</a>
    <a href="/" target="_top">Return to Otterly Games</a>
  </main>;

  return <GameProvider><ToastProvider>
    <BrowserUniverse onStorageError={fail} />
  </ToastProvider></GameProvider>;
}
