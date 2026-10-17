import { cpSync, readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const overlays = join(dirname(fileURLToPath(import.meta.url)), 'mathtank-web');
const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function replaceExact(source, before, after, count = 1) {
  const matches = source.split(before).length - 1;
  if (matches !== count) {
    throw new Error(`Math Tank website source context changed (${matches}, expected ${count}): ${before.slice(0, 100)}`);
  }
  return source.split(before).join(after);
}

function readSource(path) {
  return readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
}

/** Apply once to an isolated, writable copy of production; never to production itself. */
export function prepareMathtankWeb(workspace) {
  const root = realpathSync(workspace);
  const prohibited = [
    resolve(site, '..', 'Math Tank'),
    join(site, 'Math-Tank'), join(site, 'games', 'mathtank'),
  ];
  if (!relative(site, root)) throw new Error('Refusing to overlay the website repository root');
  for (const path of prohibited) {
    const rel = relative(path, root);
    if (!rel || (!rel.startsWith('..') && !rel.startsWith('\\') && !rel.includes(':'))) {
      throw new Error(`Refusing to apply website overlays to source/export tree: ${root}`);
    }
  }
  const app = join(root, 'src', 'app');
  const universePath = join(app, 'components', 'SaveUniverseScreen.tsx');
  let universe = readSource(universePath);
  const start = '                      /* Hints depleted - inline ad prompt */\n';
  const end = '                      </motion.button>\n                    )}\n                  </AnimatePresence>';
  const startIndex = universe.indexOf(start);
  const endIndex = universe.indexOf(end, startIndex);
  if (startIndex < 0 || endIndex < startIndex || universe.indexOf(start, startIndex + 1) !== -1) {
    throw new Error('Math Tank website hint CTA context changed or overlays were already applied');
  }
  const adPrompt = universe.slice(startIndex, endIndex + '                      </motion.button>'.length);
  if (!adPrompt.includes('key="hint-ad"') || !adPrompt.includes('Watch ad for hint') ||
      !adPrompt.includes('showRewardedAdForHint()')) {
    throw new Error('Math Tank website hint CTA no longer matches the expected reward prompt');
  }
  universe = replaceExact(universe, adPrompt,
    '                      <p key="hint-refill" role="status" className="text-slate-200 text-xs sm:text-sm text-center">\n' +
    '                        Free hints refill daily. Rewarded videos are unavailable on the website.\n' +
    '                      </p>');
  universe = replaceExact(universe, "import { showRewardedAdForHint, getUniverseAdStatus } from '@/app/lib/adService';\n", '');
  universe = replaceExact(universe, '  addHintFromAd,\n', '');
  universe = replaceExact(universe, '  const [isLoadingAd, setIsLoadingAd] = useState(false);\n', '');
  universe = replaceExact(universe, '  const [hintAdCooldown, setHintAdCooldown] = useState(false);\n', '');
  universe = replaceExact(universe,
    "import { useAppVisibility } from '@/app/lib/useAppVisibility';",
    "import { useAppVisibility } from '@/app/lib/useAppVisibility';\n" +
    "import { scheduleWhenVisible, type VisibilityTimer } from '@/app/lib/websiteTimers';");
  universe = replaceExact(universe,
    '  const pendingTimers = useRef(new Set<ReturnType<typeof setTimeout>>());\n' +
    '  const schedule = useCallback((callback: () => void, delay: number) => {\n' +
    '    const timer = setTimeout(() => {\n' +
    '      pendingTimers.current.delete(timer);\n' +
    '      callback();\n' +
    '    }, delay);\n' +
    '    pendingTimers.current.add(timer);\n' +
    '    return timer;\n' +
    '  }, []);\n' +
    '  const clearPending = useCallback(() => {\n' +
    '    pendingTimers.current.forEach(clearTimeout);',
    '  const pendingTimers = useRef(new Set<VisibilityTimer>());\n' +
    '  const schedule = useCallback((callback: () => void, delay: number) => {\n' +
    '    const timer = scheduleWhenVisible(() => {\n' +
    '      pendingTimers.current.delete(timer);\n' +
    '      callback();\n' +
    '    }, delay);\n' +
    '    pendingTimers.current.add(timer);\n' +
    '    return timer;\n' +
    '  }, []);\n' +
    '  const clearPending = useCallback(() => {\n' +
    '    pendingTimers.current.forEach(timer => timer.cancel());');
  universe = replaceExact(universe,
    '      const timer = setTimeout(() => ttsSpeak(mission, vol).catch(() => {}), 100);\n' +
    '      return () => clearTimeout(timer);',
    '      const timer = scheduleWhenVisible(() => { void ttsSpeak(mission, vol).catch(() => {}); }, 100);\n' +
    '      return () => timer.cancel();');

  const artworkPath = join(app, 'components', 'CelestialArtwork.tsx');
  let artwork = readSource(artworkPath);
  artwork = replaceExact(artwork,
    "import { WORLDS, type AtlasSpec } from '@/app/universe-preview/universe';",
    "import { WORLDS, type AtlasSpec } from '@/app/universe-preview/universe';\nimport { assetPath } from '@/app/lib/assetPath';");
  artwork = replaceExact(artwork, "fetch('/universe-preview/atlas.json')", "fetch(assetPath('/universe-preview/atlas.json'))");
  artwork = replaceExact(artwork, 'image.src = `/universe-preview/${world.key}-atlas.webp`;',
    'image.src = assetPath(`/universe-preview/${world.key}-atlas.webp`);');
  artwork = replaceExact(artwork, 'src={`/universe-preview/${world.key}.png`}',
    'src={assetPath(`/universe-preview/${world.key}.png`)}');

  const soundPath = join(app, 'lib', 'sound.ts');
  let sound = readSource(soundPath);
  sound = replaceExact(sound, "import { App } from '@capacitor/app';",
    "import { App } from '@capacitor/app';\nimport { assetPath } from './assetPath';");
  sound = replaceExact(sound, 'new Audio(src)', 'new Audio(assetPath(src))', 2);
  sound = replaceExact(sound, 'new Audio(trackPath)', 'new Audio(assetPath(trackPath))');

  const ttsPath = join(app, 'lib', 'ttsService.ts');
  let tts = readSource(ttsPath);
  tts = replaceExact(tts,
    "import { duckMusicForTTS, restoreMusicAfterTTS } from './sound';",
    "import { duckMusicForTTS, restoreMusicAfterTTS } from './sound';\n" +
    "import { isWebsitePaused } from './useAppVisibility';\n\nlet websiteSpeechEpoch = 0;");
  for (const signature of [
    'export async function speakQuestion(prompt: string, volume: number = 1.0): Promise<void> {',
    'export async function speakFeedback(text: string, volume: number = 1.0): Promise<void> {',
    'export async function speak(text: string, volume: number = 1.0): Promise<void> {',
  ]) {
    tts = replaceExact(tts, signature, `${signature}\n  const speechEpoch = websiteSpeechEpoch;`);
  }
  tts = replaceExact(tts, 'setTimeout(() => window.speechSynthesis.speak(utterance), 50);',
    'setTimeout(() => {\n' +
    '          if (speechEpoch !== websiteSpeechEpoch || isWebsitePaused()) { resolve(); return; }\n' +
    '          window.speechSynthesis.speak(utterance);\n' +
    '        }, 50);', 3);
  tts = replaceExact(tts, 'export async function stopSpeaking(): Promise<void> {',
    'export async function stopSpeaking(): Promise<void> {\n  websiteSpeechEpoch++;');

  const extraSources = new Map();
  const edit = (name, transform) => {
    const path = join(app, name);
    extraSources.set(path, transform(extraSources.get(path) ?? readSource(path)));
  };
  edit('App.tsx', text => {
    text = replaceExact(text, "import { Capacitor } from '@capacitor/core';",
      "import { Capacitor } from '@capacitor/core';\nimport { useAppVisibility } from './lib/useAppVisibility';");
    text = replaceExact(text,
      "function AppContent() {\n  const [currentScreen, setCurrentScreen] = useState<Screen>('home');",
      "export function AppContent({ initialScreen = 'home' }: { initialScreen?: Screen }) {\n" +
      "  const isVisible = useAppVisibility();\n" +
      "  const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen);");
    text = replaceExact(text, "const navigationHistory = useRef<Screen[]>(['home']);",
      'const navigationHistory = useRef<Screen[]>([initialScreen]);');
    text = replaceExact(text,
      '  // Check if onboarding should be shown (first time user)\n' +
      '  useEffect(() => {\n' +
      '    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_COMPLETE_KEY);\n' +
      '    if (!hasCompletedOnboarding) {\n' +
      '      // Small delay to let app render first\n' +
      '      setTimeout(() => setShowOnboarding(true), 500);\n' +
      '    }\n' +
      '  }, []);',
      '  // The website gesture/help screen replaces native first-run onboarding.');
    text = replaceExact(text,
      "    playMusicForScreen(currentScreen);\n  }, [currentScreen]);",
      "    if (isVisible) playMusicForScreen(currentScreen);\n  }, [currentScreen, isVisible]);");
    text = replaceExact(text,
      '<div className="game-controls w-full min-h-[100dvh] overflow-hidden">',
      '<div className="game-controls w-full h-full overflow-hidden" data-testid="math-tank-app" data-screen={currentScreen}>');
    const hosts = text.split('className="w-full h-full"').length - 1;
    if (hosts !== 11) throw new Error(`Math Tank app screen-host count changed: ${hosts}`);
    text = replaceExact(text, 'className="w-full h-full"', 'className="w-full h-full web-screen-host"', hosts);
    text = replaceExact(text, '              difficulty={battleDifficulty}',
      '              difficulty={battleDifficulty}\n              externallyPaused={!isVisible}');
    return text;
  });

  // Shadow timer APIs only inside each copied screen; no global timer monkeypatch.
  const timerScreens = [
    ['HomeScreen.tsx', 'function HomeScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {'],
    ['FightSetupScreen.tsx', 'function FightSetupScreen({ onNavigate, onStartBattle }: FightSetupScreenProps) {'],
    ['BattleScreen.tsx', 'function BattleScreen({ onBack, onBattleSetup, difficulty = Difficulty.Easy, demo = false, externallyPaused = false, onComplete }: BattleScreenProps) {'],
    ['LessonsScreen.tsx', 'function LessonsScreen({ onNavigate }: LessonsScreenProps) {'],
    ['PracticeScreen.tsx', 'export default function PracticeScreen({ onBack }: PracticeScreenProps) {'],
    ['GarageScreen.tsx', 'function GarageScreen({ onBack }: { onBack: () => void }) {'],
    ['SettingsScreen.tsx', 'function SettingsScreen({ onNavigate }: SettingsScreenProps) {'],
    ['ProgressScreen.tsx', 'function ProgressScreen({ onNavigate }: ProgressScreenProps) {'],
    ['AchievementsScreen.tsx', 'function AchievementsScreen({ onNavigate }: AchievementsScreenProps) {'],
    ['MissileUXDashboard.tsx', 'export function MissileUXDashboard({ onNavigate }: MissileUXDashboardProps) {'],
  ];
  for (const [name, signature] of timerScreens) {
    edit(join('components', name), text => {
      text = replaceExact(text, signature,
        `${signature}\n  const { setTimeout, clearTimeout, setInterval, clearInterval } = useWebsiteTimers(${name === 'BattleScreen.tsx' ? '!demo' : ''});`);
      // Prepending before a client directive would change its meaning.
      const anchor = name === 'BattleScreen.tsx'
        ? 'import { showRewardedAdForFuel, getAdConfig, getBattleAdStatus } from "../lib/adService";'
        : signature;
      return replaceExact(text, anchor, `import { useWebsiteTimers } from '@/app/lib/useWebsiteTimers';\n${anchor}`);
    });
  }
  edit(join('components', 'ChargeRoundOverlay.tsx'), text => {
    text = replaceExact(text, 'import { speakFeedback as ttsFeedback } from "@/app/lib/ttsService";',
      'import { speakFeedback as ttsFeedback } from "@/app/lib/ttsService";\nimport { useWebsiteTimers } from "@/app/lib/useWebsiteTimers";');
    text = replaceExact(text, '  voiceVolume?: number;\n', '  voiceVolume?: number;\n  websiteManaged?: boolean;\n');
    text = replaceExact(text, '  voiceVolume = 100,\n}: ChargeRoundOverlayProps) {',
      '  voiceVolume = 100,\n  websiteManaged = false,\n}: ChargeRoundOverlayProps) {\n' +
      '  const { setTimeout, clearTimeout, setInterval, clearInterval, now } = useWebsiteTimers(websiteManaged);');
    return replaceExact(text, 'Date.now()', 'now()', 2);
  });
  edit(join('components', 'BattleScreen.tsx'), text => {
    text = replaceExact(text,
      'className="absolute left-4 right-4 flex justify-between z-10"',
      'className="web-battle-health absolute left-4 right-4 flex justify-between z-10"');
    text = replaceExact(text, '        <BattleBackdrop />',
      '        <div className="web-battle-backdrop absolute inset-0"><BattleBackdrop /></div>');
    text = replaceExact(text, 'bottom: "12%",',
      'bottom: "var(--web-impact-bottom, 12%)",');
    text = replaceExact(text, '<ChargeRoundOverlay\n', '<ChargeRoundOverlay\n          websiteManaged={!demo}\n');
    text = replaceExact(text, 'className="w-28 h-24 sm:w-36 sm:h-28 md:w-44 md:h-36"',
      'className="web-battle-tank w-28 h-24 sm:w-36 sm:h-28 md:w-44 md:h-36"', 2);
    text = replaceExact(text,
      'import { showRewardedAdForFuel, getAdConfig, getBattleAdStatus } from "../lib/adService";',
      'import { showRewardedAdForFuel, getAdConfig, getBattleAdStatus, areAdsAvailable } from "../lib/adService";');
    return replaceExact(text, '{!demo && (adWatchedInResult ? (',
      '{!demo && areAdsAvailable() && (adWatchedInResult ? (');
  });
  edit(join('components', 'HomeScreen.tsx'), text => {
    for (const [id, label] of [
      ['btn-fightSetup', 'Battle'], ['btn-universe', 'Universe'],
      ['btn-lessons', 'Learn'], ['btn-garage', 'Garage'],
    ]) {
      text = replaceExact(text, `id="${id}"`, `id="${id}" aria-label="${label}"`);
    }
    return replaceExact(text,
      '        <div className={styles.ad}>\n' +
      '          <GameIllustration name="video" size={30} />\n' +
      '          <div><strong>{isWatchingAd ? \'Playing Ad…\' : adStatus.adsRemaining === 0 ? \'Daily limit reached\' : adStatus.cooldownRemaining > 0 ? `Ad ready in ${cooldown}` : `Watch Ad · Get ${adConfig.coinsReward} Coins`}</strong><span>Rewarded Ad</span></div>\n' +
      '          <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={handleWatchAd} disabled={isWatchingAd || !adStatus.canShow}>{isWatchingAd ? \'Playing…\' : \'Watch\'}</button>\n' +
      '        </div>',
      '        <p className={styles.ad}>Rewarded videos are unavailable on the website. Earn coins through play.</p>');
  });
  edit(join('components', 'FightSetupScreen.tsx'), text => {
    text = replaceExact(text, '>Daily Limit Reached</p>', '>Daily Energy Used</p>');
    text = replaceExact(text, "width: 'clamp(96px, 18vw, 120px)'",
      "width: 'var(--web-equipment-width, clamp(96px, 18vw, 120px))'", 2);
    text = replaceExact(text, "height: 'clamp(98px, 22vw, 120px)'",
      "height: 'var(--web-equipment-height, clamp(98px, 22vw, 120px))'", 2);
    text = replaceExact(text, "width: 'clamp(40px, 12vw, 65px)'",
      "width: 'var(--web-art-width, clamp(40px, 12vw, 65px))'", 2);
    for (const height of ['clamp(28px, 9vw, 48px)', 'clamp(24px, 7vw, 40px)']) {
      text = replaceExact(text, `height: '${height}'`, `height: 'var(--web-art-height, ${height})'`);
    }
    return replaceExact(text, 'Come back tomorrow for more battles!',
      'Free energy refills daily. Rewarded videos are unavailable here. Try Lessons, Practice or Universe meanwhile.');
  });

  for (const name of ['BattleScreen.tsx', 'PracticeScreen.tsx', 'SaveUniverseScreen.tsx']) {
    const restrict = text => replaceExact(text,
      'setIsLandscape(window.innerWidth > window.innerHeight);',
      `setIsLandscape(window.innerWidth > window.innerHeight && ${name === 'BattleScreen.tsx' ? '(demo || window.innerHeight <= 550)' : 'window.innerHeight <= 550'});`);
    if (name === 'SaveUniverseScreen.tsx') universe = restrict(universe);
    else edit(join('components', name), restrict);
  }
  universe = replaceExact(universe,
    'className="absolute inset-x-0 bottom-0 h-10 border-t border-cyan-100/10 bg-slate-900/75"',
    'className="web-universe-ground absolute inset-x-0 bottom-0 h-10 border-t border-cyan-100/10 bg-slate-900/75"');
  edit(join('components', 'LessonsScreen.tsx'), text => {
    text = replaceExact(text, 'className="flex flex-col relative overflow-hidden"',
      'className="web-lessons flex flex-col relative overflow-hidden"');
    return replaceExact(text,
      'className="space-y-3 landscape:space-y-0 landscape:grid landscape:grid-cols-2 landscape:gap-2"',
      'className="web-lesson-choices space-y-3 landscape:space-y-0 landscape:grid landscape:grid-cols-2 landscape:gap-2"', 2);
  });
  edit(join('components', 'PracticeScreen.tsx'), text => {
    text = replaceExact(text, 'className="flex-1 flex flex-col overflow-auto"',
      'className="web-practice-table flex-1 flex flex-col overflow-auto"');
    text = replaceExact(text,
      "const renderPractice = () => {\n    const opConfig = OPERATIONS.find(o => o.mode === selectedMode);\n    \n    return (\n      <div className=\"flex-1 flex flex-col\">",
      "const renderPractice = () => {\n    const opConfig = OPERATIONS.find(o => o.mode === selectedMode);\n    \n    return (\n      <div className=\"web-practice-round flex-1 flex flex-col\">");
    text = replaceExact(text, 'border-2 rounded-3xl p-6 mx-2 backdrop-blur-xl text-center relative overflow-hidden`}',
      'web-practice-question border-2 rounded-3xl p-6 mx-2 backdrop-blur-xl text-center relative overflow-hidden`}');
    return replaceExact(text, '<div className="mt-auto px-2 pb-2">',
      '<div className="web-practice-input mt-auto px-2 pb-2">');
  });
  for (const name of ['HomeGarageRefresh', 'GarageWorkbench', 'GameLayout', 'UniverseScene']) {
    edit(join('components', `${name}.module.css`), text =>
      `${text}\n${readSource(join(overlays, `${name}.web.css`))}`);
  }
  edit(join('components', 'UniverseMap.tsx'), text => {
    text = replaceExact(text,
      'const SPACING = 220;\nconst FIRST_X = 160;\nconst worldPoint = (index: number, height: number) => ({\n' +
      '  x: FIRST_X + index * SPACING,\n' +
      '  y: height * 0.43 + Math.sin(index * 0.8) * Math.min(48, height * 0.12),\n' +
      '});\n', '');
    text = replaceExact(text, '  const [height, setHeight] = useState(320);',
      '  const [viewport, setViewport] = useState({ width: 320, height: 320 });\n' +
      '  const { height, width } = viewport;\n' +
      '  const SPACING = width >= 1024 ? 360 : width >= 640 ? 280 : 240;\n' +
      '  const FIRST_X = width / 2;\n' +
      '  const worldPoint = (index: number, mapHeight: number) => ({\n' +
      '    x: FIRST_X + index * SPACING,\n' +
      '    y: mapHeight * 0.43 + Math.sin(index * 0.8) * Math.min(40, mapHeight * 0.1),\n' +
      '  });');
    text = replaceExact(text,
      '  const lastIndex = complete || discoveredCount === 30 ? 29 : discoveredCount;\n' +
      '  const mapWidth = FIRST_X + (lastIndex + 1) * SPACING + 80;\n' +
      '  const artworkHeight = Math.min(130, Math.max(50, height - 72));',
      '  const lastIndex = Math.min(29, discoveredCount + 2);\n' +
      '  const mapWidth = FIRST_X + lastIndex * SPACING + width / 2 + (complete ? 160 : 0);\n' +
      '  const artworkHeight = Math.min(width >= 1024 ? 290 : 220, Math.max(50, height - 88));\n' +
      '  const artworkWidth = Math.min(width - 32, height < 160 ? 300 : artworkHeight + 90);');
    text = replaceExact(text,
      'new ResizeObserver(([entry]) => setHeight(Math.max(80, entry.contentRect.height)))',
      'new ResizeObserver(([entry]) => setViewport({\n' +
      '      width: entry.contentRect.width, height: Math.max(80, entry.contentRect.height),\n' +
      '    }))');
    text = replaceExact(text, '  }, [selected, height, reduced]);',
      '  }, [selected, height, width, reduced, SPACING, FIRST_X]);');
    text = replaceExact(text,
      '    element.scrollTo({\n' +
      '      left: Math.max(0, worldPoint(selected, height).x - element.clientWidth / 2),\n' +
      "      behavior: reduced ? 'auto' : 'smooth',\n" +
      '    });',
      '    let frame = 0;\n' +
      '    const center = () => {\n' +
      '      const left = Math.max(0, worldPoint(selected, height).x - element.clientWidth / 2);\n' +
      '      // Entrance transforms can temporarily shorten the scrollable extent.\n' +
      '      if (element.scrollWidth - element.clientWidth + 1 < left) {\n' +
      '        frame = requestAnimationFrame(center);\n' +
      '        return;\n' +
      '      }\n' +
      "      element.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' });\n" +
      '    };\n' +
      '    frame = requestAnimationFrame(center);\n' +
      '    return () => cancelAnimationFrame(frame);');
    text = replaceExact(text,
      'className="relative min-h-0 flex-1 overflow-auto scrollbar-hide"',
      'className={`${styles.mapViewport} relative min-h-0 flex-1 overflow-auto scrollbar-hide`}');
    text = replaceExact(text,
      '<div className="relative" style={{ width: mapWidth, height }}>',
      '<div className={`${styles.mapCanvas} relative`} data-moving={moving} style={{ width: mapWidth, height }}>\n' +
      '          <div className={styles.mapNebula} aria-hidden="true" />');
    text = replaceExact(text, '{ x: 32, y: height * 0.43 }',
      '{ x: FIRST_X - SPACING / 2, y: height * 0.43 }');
    text = replaceExact(text, 'left: 20, top: height * 0.43 - 12',
      'left: FIRST_X - SPACING / 2 - 12, top: height * 0.43 - 12');
    text = replaceExact(text,
      'className="absolute w-[196px] rounded-2xl text-center outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"',
      'className={`${styles.mapWorld} absolute rounded-2xl text-center outline-none focus-visible:ring-2 focus-visible:ring-cyan-300`}');
    text = replaceExact(text,
      'style={{ left: point.x - 98, top: Math.max(0, point.y - artworkHeight / 2 - (height < 230 ? 22 : 0)) }}',
      'style={{ width: artworkWidth, left: point.x - artworkWidth / 2, top: Math.max(0, point.y - artworkHeight / 2 - (height < 230 ? 22 : 0)) }}');
    text = replaceExact(text, '<div style={{ height: artworkHeight }}>',
      '<div className={styles.mapArtwork} style={{ height: artworkHeight }}>');
    text = replaceExact(text,
      '          {!complete && discoveredCount < 30 && <div data-testid="universe-fog"',
      '          {!complete && Array.from({ length: lastIndex - discoveredCount + 1 }, (_, offset) => (\n' +
      '          <div key={offset} data-testid={offset === 0 ? "universe-fog" : undefined}\n' +
      '            data-universe-mystery={offset} aria-label="Undiscovered destination"');
    text = replaceExact(text,
      'className="absolute flex h-44 w-48 flex-col items-center justify-center rounded-full text-center"',
      'className={`${styles.mapFog} absolute flex h-44 w-48 flex-col items-center justify-center rounded-full text-center`}');
    text = replaceExact(text,
      'left: worldPoint(discoveredCount, height).x - 96, top: Math.max(0, worldPoint(discoveredCount, height).y - 65), height: Math.min(176, height - 8),',
      'left: worldPoint(discoveredCount + offset, height).x - 96, top: Math.max(0, worldPoint(discoveredCount + offset, height).y - 65), height: Math.min(176, height - 8),');
    text = replaceExact(text, '>Uncharted space</p>',
      '>{offset === 0 ? "Beyond the starlight" : "A distant whisper"}</p>');
    text = replaceExact(text, 'Finish this rescue to trace the next signal.',
      'Save this world. Let the next mystery find you.');
    text = replaceExact(text, '          </div>}\n          {complete &&',
      '          </div>))}\n          {complete &&');
    text = replaceExact(text,
      'left: FIRST_X + discoveredCount * SPACING - 64, top: height * 0.43 - 22',
      'left: worldPoint(29, height).x + SPACING * 0.6 - 64, top: Math.max(0, height * 0.43 - 22)');
    return text;
  });
  const tailwindPath = join(root, 'tailwind.config.js');
  const tailwind = replaceExact(readSource(tailwindPath),
    "'landscape': { 'raw': '(orientation: landscape)' },",
    "'landscape': { 'raw': '(orientation: landscape) and (max-height: 550px)' },");

  edit(join('components', 'GameIllustration.tsx'), text => {
    text = "import { assetPath } from '@/app/lib/assetPath';\n\n" + text;
    return replaceExact(text, 'src={`/art-preview/icons/${name}.png`}',
      'src={assetPath(`/art-preview/icons/${name}.png`)}');
  });
  edit(join('components', 'HomeIcons.tsx'), text => {
    text = replaceExact(text, "import { TankType } from '@/app/lib/types';",
      "import { TankType } from '@/app/lib/types';\nimport { assetPath } from '@/app/lib/assetPath';");
    return replaceExact(text, 'src="/universe-preview/saturn.png"',
      "src={assetPath('/universe-preview/saturn.png')}");
  });
  edit(join('components', 'GarageScreen.tsx'), text => {
    text = replaceExact(text, "import { Capacitor } from '@capacitor/core';",
      "import { Capacitor } from '@capacitor/core';\nimport { assetPath } from '@/app/lib/assetPath';");
    return replaceExact(text, 'src={`/art-preview/decals/${sticker}.svg`}',
      'src={assetPath(`/art-preview/decals/${sticker}.svg`)}');
  });
  edit(join('components', 'MissileTestRange.tsx'), text => {
    text = replaceExact(text, "import { Capacitor } from '@capacitor/core';",
      "import { Capacitor } from '@capacitor/core';\nimport { assetPath } from '@/app/lib/assetPath';");
    return replaceExact(text, 'href="/art-preview/icons/target.png"',
      "href={assetPath('/art-preview/icons/target.png')}");
  });
  edit(join('components', 'SettingsScreen.tsx'), text => {
    text = replaceExact(text, "import { VERSION_STRING, APP_INFO } from '@/app/lib/version';",
      "import { VERSION_STRING, APP_INFO } from '@/app/lib/version';\nimport { assetPath } from '@/app/lib/assetPath';");
    text = replaceExact(text, 'src="/images/otter-mascot.png"',
      "src={assetPath('/images/otter-mascot.png')}", 2);
    const hapticStart = text.indexOf('          {/* Haptic Feedback */}\n');
    const hapticEnd = text.indexOf('        </motion.div>\n\n        {/* RHS Column', hapticStart);
    if (hapticStart < 0 || hapticEnd < hapticStart ||
        !text.slice(hapticStart, hapticEnd).includes('ariaLabel="Toggle haptic feedback"')) {
      throw new Error('Math Tank native haptic settings context changed');
    }
    text = text.slice(0, hapticStart) + text.slice(hapticEnd);
    const embedStart = text.indexOf('              <iframe\n                id="kofiframe"');
    const embedEnd = text.indexOf('              />', embedStart);
    if (embedStart < 0 || embedEnd < embedStart ||
        !text.slice(embedStart, embedEnd).includes('https://ko-fi.com/otterly_games/')) {
      throw new Error('Math Tank support iframe context changed');
    }
    return text.slice(0, embedStart) +
      '              <p className="p-6 text-slate-800">For support, visit <a href="/" target="_top" className="underline">Otterly Games</a>. No payment service is loaded inside this game.</p>\n' +
      text.slice(embedEnd + '              />'.length);
  });
  edit(join('lib', 'useOtterlyApps.ts'), text =>
    replaceExact(text, '    load();', '    setLoading(false); // Website uses the local fallback/cache; no remote catalogue request.'));
  edit(join('lib', 'database.ts'), text =>
    replaceExact(text, "    'mathTank_universeProgress',  // Save Universe progress",
      "    'mathTank_universeProgress',  // Legacy Save Universe progress\n" +
      "    'math_tank_universe_progress',\n    'math_tank_universe_hints',"));
  edit(join('components', 'ProgressScreen.tsx'), text =>
    replaceExact(text, "onClick={() => { playFeedback('click', 'light'); onNavigate('home'); }}",
      "aria-label=\"Back to Home\"\n          onClick={() => { playFeedback('click', 'light'); onNavigate('home'); }}"));
  edit(join('components', 'AchievementsScreen.tsx'), text =>
    replaceExact(text,
      '          className="min-w-[36px] min-h-[36px] bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border-2 border-amber-200 flex-shrink-0"',
      '          aria-label="Back to Home"\n' +
      '          className="min-w-[36px] min-h-[36px] bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border-2 border-amber-200 flex-shrink-0"'));

  // Validate all production anchors before writing any overlay.
  writeFileSync(universePath, universe);
  writeFileSync(artworkPath, artwork);
  writeFileSync(soundPath, sound);
  writeFileSync(ttsPath, tts);
  writeFileSync(tailwindPath, tailwind);
  for (const [path, text] of extraSources) writeFileSync(path, text);
  for (const name of ['page.tsx', 'layout.tsx', 'WebsiteGame.tsx', 'website.css']) {
    cpSync(join(overlays, name), join(app, name));
  }
  cpSync(join(overlays, 'adService.ts'), join(app, 'lib', 'adService.ts'));
  cpSync(join(overlays, 'useAppVisibility.ts'), join(app, 'lib', 'useAppVisibility.ts'));
  cpSync(join(overlays, 'websiteTimers.ts'), join(app, 'lib', 'websiteTimers.ts'));
  cpSync(join(overlays, 'useWebsiteTimers.ts'), join(app, 'lib', 'useWebsiteTimers.ts'));
}
