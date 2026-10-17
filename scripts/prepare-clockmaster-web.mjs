import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const overlays = join(dirname(fileURLToPath(import.meta.url)), 'clockmaster-web');
export function prepareClockMaster(work, site, source) {
  const root = resolve(work);
  if (!root.startsWith(resolve(site, '.clockmaster-build-')) || [site, source, join(site, 'games', 'clockmaster')].some(p => resolve(p) === root)) {
    throw new Error('Overlay target must be this exporter’s isolated build copy');
  }
  function patch(file, before, after, count = 1) {
    const path = join(root, file);
    const text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
    const found = text.split(before).length - 1;
    if (found !== count) throw new Error(`${file}: expected ${count} overlay contexts, found ${found}: ${before.slice(0, 80)}`);
    writeFileSync(path, text.split(before).join(after));
  }
  copyFileSync(join(overlays, 'ads.ts'), join(root, 'src', 'app', 'lib', 'ads.ts'));
  copyFileSync(join(overlays, 'BrowserEntry.tsx'), join(root, 'src', 'main.tsx'));
  copyFileSync(join(overlays, 'browser.css'), join(root, 'src', 'styles', 'browser.css'));
  copyFileSync(join(overlays, 'activeDelay.ts'), join(root, 'src', 'app', 'lib', 'activeDelay.ts'));
  patch('src/styles/index.css', "@import './audio.css';", "@import './audio.css';\n@import './browser.css';");
  patch('index.html', ', user-scalable=no', '');
  patch('src/app/App.tsx', "if (!isWebsiteBuild || window.parent === window) return;", "if (!isWebsiteBuild) return;\n    let parentPaused = false;\n    const syncPause = () => {\n      const paused = parentPaused || document.hidden;\n      setWebsitePaused(paused); setEmbedPaused(paused);\n      if (paused) { pauseBackgroundMusic(); void stopTTS(); } else resumeBackgroundMusic();\n    };\n    document.addEventListener('visibilitychange', syncPause);");
  patch('src/app/App.tsx', "const paused = event.data.type === 'pauseAudio';", "parentPaused = event.data.type === 'pauseAudio';\n      syncPause();\n      const paused = parentPaused || document.hidden;");
  patch('src/app/App.tsx', "window.parent.postMessage({ type: 'clockReady' }, window.location.origin);", "syncPause();\n    window.parent.postMessage({ type: 'clockReady' }, window.location.origin);");
  patch('src/app/App.tsx', "window.removeEventListener('message', onMessage);", "window.removeEventListener('message', onMessage);\n      document.removeEventListener('visibilitychange', syncPause);");
  patch('src/app/App.tsx', "const handleBackButton = CapacitorApp.addListener", "if (isWebsiteBuild) return;\n    const handleBackButton = CapacitorApp.addListener");
  patch('src/app/App.tsx', "<AstronomyScreen onNavigate={handleNavigate} />", "<AstronomyScreen onNavigate={handleNavigate} embedPaused={embedPaused} />");
  patch('src/app/App.tsx', "pauseBackgroundMusic, resumeBackgroundMusic", "pauseBackgroundMusic, resumeBackgroundMusic, cancelWebsiteAudioResume");
  patch('src/app/App.tsx', "const handleNavigate = (screen: Screen) => {", "const handleNavigate = (screen: Screen) => {\n    cancelWebsiteAudioResume();");
  patch('src/app/lib/sound.ts', "let resumeTimer: ReturnType<typeof setTimeout> | undefined;", "let resumeTimer: ReturnType<typeof setTimeout> | undefined;\nexport function cancelWebsiteAudioResume() { clearTimeout(resumeTimer); }");
  patch('src/app/lib/sound.ts', "const musicToResume = musicTypeBeforeHidden || lastKnownMusicType;", "const musicToResume = lastKnownMusicType;");
  patch('src/app/components/HomeScreen.tsx', "dailyChallenge.type === 'lessons' ? 'lessons'", "dailyChallenge.type === 'lessons' ? 'lesson'");
  patch('src/app/components/AstronomyScreen.tsx', "export function AstronomyScreen({ onNavigate }: { onNavigate: (screen: Screen) => void })", "export function AstronomyScreen({ onNavigate, embedPaused = false }: { onNavigate: (screen: Screen) => void; embedPaused?: boolean })");
  patch('src/app/components/AstronomyScreen.tsx', "if (!isAdMobAvailable()) { beginFlight(); return; }", "if (!isAdMobAvailable()) { setStatus('Video rewards are unavailable in the browser. Retry your journey.'); return; }");
  patch('src/app/components/AstronomyScreen.tsx', "paused={modal}", "paused={modal || embedPaused}");
  patch('src/app/components/AstronomyScreen.tsx', "<button className=\"universe-primary\" disabled={adBusy} onClick={watchAd}>{adBusy ? 'Waiting for ad…' : 'Watch Ad to Continue'}</button>", "<p>Video rewards are unavailable in the browser. Retry to keep exploring.</p>");
  patch('src/app/components/celestial/SpaceJourney.tsx', "const start = performance.now();", "let previous = performance.now();\n    let elapsed = 0;");
  patch('src/app/components/celestial/SpaceJourney.tsx', "const progress = Math.min(1, (now - start) / duration);", "if (!pauseRef.current && !document.hidden) elapsed += now - previous;\n      previous = now;\n      const progress = Math.min(1, elapsed / duration);");
  patch('src/app/components/celestial/SpaceJourney.tsx', "const completion = useRef(onFlightComplete);", "const pauseRef = useRef(paused);\n  pauseRef.current = paused;\n  const completion = useRef(onFlightComplete);");
  // Account for the hidden gap even if the browser suspends requestAnimationFrame.
  patch('src/app/components/celestial/SpaceJourney.tsx', "frame = requestAnimationFrame(tick);\n    return () => cancelAnimationFrame(frame);", "const resetTimestamp = () => { previous = performance.now(); };\n    document.addEventListener('visibilitychange', resetTimestamp);\n    frame = requestAnimationFrame(tick);\n    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', resetTimestamp); };");
  patch('src/app/components/TimeRaceScreen.tsx', "|| !shouldShowRatingPrompt()) return;", "|| isWebsiteBuild || !shouldShowRatingPrompt()) return;");
  patch('src/app/components/TimeRaceScreen.tsx', "const [countdownValue, setCountdownValue] = useState(3);", `const [countdownValue, setCountdownValue] = useState(3);
  const countdownRemaining = useRef(1000);
  const tickRemaining = useRef(1000);
  const activeMilliseconds = useRef(0);
  const activeStarted = useRef<number | null>(null);
  useEffect(() => {
    if (gameState !== 'playing' || embedPaused) return;
    activeStarted.current = performance.now();
    return () => {
      if (activeStarted.current !== null) activeMilliseconds.current += performance.now() - activeStarted.current;
      activeStarted.current = null;
    };
  }, [gameState, embedPaused]);`);
  patch('src/app/components/TimeRaceScreen.tsx', "raceFinished.current = false;", "raceFinished.current = false;\n    countdownRemaining.current = 1000;\n    activeMilliseconds.current = 0;\n    activeStarted.current = null;");
  patch('src/app/components/TimeRaceScreen.tsx', `const timer = setTimeout(() => {
          playSound('countdown');
          setCountdownValue(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);`, `const started = performance.now();
        let completed = false;
        const timer = setTimeout(() => {
          completed = true;
          countdownRemaining.current = 1000;
          playSound('countdown');
          setCountdownValue(prev => prev - 1);
        }, countdownRemaining.current);
        return () => {
          clearTimeout(timer);
          if (!completed) countdownRemaining.current = Math.max(0, countdownRemaining.current - (performance.now() - started));
        };`);
  patch('src/app/components/TimeRaceScreen.tsx', "const settings = difficultySettings[difficulty];\n    \n    // Master mode", "const settings = difficultySettings[difficulty];\n    tickRemaining.current = 1000;\n    \n    // Master mode");
  patch('src/app/components/TimeRaceScreen.tsx', `const interval = setInterval(() => {
        setTimer(t => t - 1);
        if (timer <= 3) {
          playSound('tick');
        }
      }, 1000);
      return () => clearInterval(interval);`, `const started = performance.now();
      let completed = false;
      const interval = setTimeout(() => {
        completed = true;
        tickRemaining.current = 1000;
        setTimer(t => t - 1);
        if (timer <= 3) playSound('tick');
      }, tickRemaining.current);
      return () => {
        clearTimeout(interval);
        if (!completed) tickRemaining.current = Math.max(0, tickRemaining.current - (performance.now() - started));
      };`);
  patch('src/app/components/TimeRaceScreen.tsx', "const totalTime = Math.floor((Date.now() - startTime) / 1000);", "const totalTime = Math.floor((activeMilliseconds.current + (activeStarted.current === null ? 0 : performance.now() - activeStarted.current)) / 1000);");
  patch('src/app/components/TimeRaceScreen.tsx', `initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="race-results-actions"`, `initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="race-results-actions"`);
  patch('src/app/components/ui/AdButton.tsx', "if (isPlaying) {\n      return 'Playing Ad...';", "if (!canShow && !isPlaying) return 'Video rewards unavailable in browser';\n    if (isPlaying) {\n      return 'Playing Ad...';");
  patch('src/app/components/ui/AdButton.tsx', "Come back tomorrow for more rewards!", "Video rewards are not available in this browser.");
  patch('src/app/lib/website.ts', "() => paused", "() => paused || document.hidden");
  patch('src/app/lib/website.ts', "paused = value;", "paused = value;\n  window.dispatchEvent(new Event('clock-visibility'));");
  patch('src/app/components/ClockLessonScreen.tsx', "import type { Screen } from '@/app/App';", "import type { Screen } from '@/app/App';\nimport { activeDelay } from '@/app/lib/activeDelay';");
  patch('src/app/components/ClockLessonScreen.tsx', "let pauseTimer: ReturnType<typeof setTimeout> | undefined;", "let cancelTransition: (() => void) | undefined;");
  patch('src/app/components/ClockLessonScreen.tsx', "pauseTimer = setTimeout(transitionToTutorial, 1500);", "cancelTransition = activeDelay(transitionToTutorial, 1500);");
  patch('src/app/components/ClockLessonScreen.tsx', "clearTimeout(pauseTimer);", "cancelTransition?.();");
  patch('src/app/components/ClockLessonScreen.tsx', `const timer = setTimeout(() => {
        initializeAudio();
        speakDynamic(getTutorialInstruction(), { interrupt: false });
      }, 300);
      return () => clearTimeout(timer);`, `const cancelNarration = activeDelay(() => {
        initializeAudio();
        speakDynamic(getTutorialInstruction(), { interrupt: false });
      }, 300);
      return cancelNarration;`);
  patch('src/app/components/ui/AdButton.tsx', "const getButtonContent = () => {", "const getButtonContent = () => {\n    if (!canShow && !isPlaying) return <span>Video rewards unavailable in browser</span>;");
  patch('src/app/lib/useOtterlyApps.ts', "'https://www.otterlygames.com/api/apps.json'", "'/api/apps.json'");
  patch('src/app/components/SettingsScreen.tsx', "Rate Us ⭐", "Android app on Google Play ↗");
  patch('src/app/components/SettingsScreen.tsx', "url: PLAY_STORE_URL,", "url: `${location.origin}/play/clock-master.html`,");
  patch('src/app/components/SettingsScreen.tsx', "await Share.share({", "if (!navigator.share) { window.prompt('Copy the browser game link:', `${location.origin}/play/clock-master.html`); return; }\n                await navigator.share({");
  patch('src/app/components/SettingsScreen.tsx', "dialogTitle: 'Share Clock Master',", "");
  patch('src/app/components/SettingsScreen.tsx', "🔒 Zero Data", "🔒 Local browser saves");
  patch('src/app/components/SettingsScreen.tsx', "✅ COPPA Safe", "No game advertising");
  const settings = readFileSync(join(root, 'src/app/components/SettingsScreen.tsx'), 'utf8');
  const iframe = settings.match(/<iframe\s+id="kofiframe"[\s\S]+?\/>/g);
  if (iframe?.length !== 1) throw new Error('Expected one native support iframe');
  patch('src/app/components/SettingsScreen.tsx', iframe[0], '<p className="p-6 text-gray-800">Parents: support is optional and opens an external website. <a href="https://ko-fi.com/otterly_games" target="_blank" rel="noopener noreferrer">Visit Ko-fi ↗</a></p>');
}
