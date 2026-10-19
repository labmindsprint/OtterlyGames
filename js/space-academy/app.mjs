import { CONTENT_VERSION, EVIDENCE_VERSIONS, GRADES, LEVELS, chapterRoute, gameLink, getGrade } from './curriculum.mjs';
import { createMission } from './questions.mjs';
import {
  EXPLORERS, applyAction, campaignRecommendation, campaignStatus, chapterObjectives, currentExplorer, currentJourney,
  readMissionLink, recommendChapter, skillReport, universePassport, validateSave,
} from './progress.mjs';
import { AcademyStorage, SaveConflict } from './storage.mjs';
import { ART_ROOT, DESTINATIONS, PAINTS } from './destinations.mjs';
import { SpaceScene, answerChoice, diagram, escapeHTML as e, symbolSVG } from './art.mjs';
import { choiceDescription, questionReadAloud } from './question-display.mjs';
import { chapterSystem, getCampaign } from './campaigns.mjs';
import { craftFor, renderCraft, renderCraftPart } from './campaign-crafts.mjs';
import { renderActivity } from './campaign-activities.mjs';
import { coachingFeedback, coachingFocus, coachingHint } from './coaching.mjs';
import { nextStep } from './guide.mjs';
import { flightStage, runFx, stopFx } from './fx.mjs';

const root = document.getElementById('academy');
let storage;
let save;
let screen = 'missions';
let busy = false;
let scene = null;
let selectedPart = null;
let selectedWorld = null;
let discoveryReturn = 'map';
let manualPause = false;
let visible = true;
let notice = '';
const DISCOVERY_NOTICE = 'A new discovery for your Passport!';
let linkRequest = null;
let pendingRestore = null;
let gesture = null;
let suppressClick = false;
let speechRequest = 0;
let passportAnchor = null;
let panelLeads = null;
let moreOpen = false;
let pendingFx = null;

const button = (label, action, attributes = '', kind = '') =>
  `<button type="button" class="sa-button ${kind}" data-action="${action}" ${attributes}>${label}</button>`;
const countLabel = (value, singular, plural = `${singular}s`) => `${value} ${value === 1 ? singular : plural}`;
const explorerName = () => EXPLORERS.find(explorer => explorer.id === save.activeExplorer).name;
const originalBankNote = mission => mission.contentVersion === 1
  ? '<p class="sa-bank-note sa-small">An earlier saved mission. Your parts and progress are safe.</p>' : '';

const ICONS = {
  play: '<path d="m9 5 11 7-11 7Z"/>',
  build: '<path d="m14 7 3 3 4-4a7 7 0 0 1-9 9l-6 6-3-3 6-6a7 7 0 0 1 9-9Z"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 6-5 2 3-6Z"/>',
  worlds: '<circle cx="12" cy="12" r="7"/><ellipse cx="12" cy="12" rx="12" ry="3" transform="rotate(-25 12 12)"/>',
  progress: '<path d="M4 19h16M6 15v-4m6 4V5m6 10V8"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .6-1.5 1-1.5 2.5M12 17h.01"/>',
  fullscreen: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  charge: '<path d="m14 2-9 12h6l-1 8 9-12h-6Z"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  hint: '<path d="M9 18h6m-5 3h4M8 13a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/>',
  sound: '<path d="m4 9 5-1 5-4v16l-5-4-5-1Zm13-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  next: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m9 10 6-4M9 14l6 4"/>',
  mix: '<path d="m12 3 2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2Z"/>',
  paper: '<path d="M7 3h7l5 5v13H7ZM14 3v5h5M10 13h6M10 17h6"/>',
  rocket: '<path d="M12 2c3.200 2.200 5 5.400 5 9.200 0 2-.5 3.600-1.400 4.800H8.400C7.500 14.800 7 13.200 7 11.200 7 7.400 8.800 4.200 12 2Z"/><circle cx="12" cy="10" r="1.700"/><path d="m7.600 13.500-3.100 3.500.8 3 3.200-1.600m7.900-4.900 3.100 3.500-.8 3-3.200-1.600M10.200 20.200c.4 1 1 1.700 1.800 2.300.8-.6 1.400-1.300 1.800-2.300"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.500"/><path d="M8 11V8a4 4 0 0 1 8 0v3m-4 4v2"/>',
  hand: '<path d="M9.500 12.500V5.700a1.800 1.800 0 0 1 3.600 0v5.300m0-.2a1.700 1.700 0 0 1 3.400 0v1.200m0-.400a1.700 1.700 0 0 1 3.300.600V15c0 3.600-2.300 6-5.700 6H13c-2.300 0-3.800-.9-4.900-2.700l-3-4.600a1.600 1.600 0 0 1 2.600-1.800l1.800 2.100"/>',
  star: '<path d="m12 3 2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9Z"/>',
  puzzle: '<path d="M5 8h4V6.500a2 2 0 1 1 4 0V8h4v4h-1.500a2 2 0 1 0 0 4H17v4H5Z"/>',
  more: '<circle cx="5.500" cy="12" r="1.500"/><circle cx="12" cy="12" r="1.500"/><circle cx="18.500" cy="12" r="1.500"/>',
};

function uiIcon(name) {
  if (!Object.hasOwn(ICONS, name)) throw new Error(`Unknown game icon: ${name}`);
  return `<svg class="sa-ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}

function repairGoal(gradeId, chapterId) {
  if (!chapterId) return null;
  const system = chapterSystem(gradeId, chapterId);
  return craftFor(gradeId).parts.find(part => part.id === system.id);
}

const STEPS = {
  play: { label: 'Play', icon: 'play', hint: 'win parts' },
  build: { label: 'Build', icon: 'build', hint: 'fit parts' },
  launch: { label: 'Launch', icon: 'rocket', hint: 'find worlds' },
};
const GUIDE_ICONS = { BUILD: 'build', 'FIT IT': 'build', LAUNCH: 'rocket', WATCH: 'rocket', PUZZLE: 'puzzle', 'NEW TRIP': 'worlds' };

// Three pictures, three words each: the whole game loop for a child who cannot read a paragraph yet.
function howTo() {
  return `<ol class="sa-howto" aria-label="How to play">${Object.values(STEPS).map(step =>
    `<li><span class="sa-howto-disc">${uiIcon(step.icon)}</span><strong>${step.label}</strong><span>${step.hint}</span></li>`).join('')}</ol>`;
}

function sameSet(request, mission) {
  return Boolean(request && mission && request.seed !== undefined && request.seed === mission.seed &&
    request.mode === mission.mode && (request.chapter ?? null) === (mission.chapter ?? null) &&
    request.level === mission.level && request.contentVersion === mission.contentVersion);
}

function guideContext() {
  const explorer = currentExplorer(save);
  const journey = currentJourney(save);
  // The address bar keeps the link of the set just played, so a played set is not "a shared set waiting".
  const linkReady = Boolean(linkRequest && linkRequest.grade === explorer.grade && !journey.active &&
    !sameSet(linkRequest, journey.lastResult?.mission));
  return { screen, selectedPart, linkReady };
}

function guideBar(guide, pointAtPlay) {
  const go = guide.button;
  const attributes = Object.entries(go.attributes).map(([name, value]) => `${name}="${e(value)}"`).join(' ');
  return `<aside class="sa-guide${pointAtPlay ? ' has-hand' : ''}" aria-label="Your guide">
    <img class="sa-guide-otter" src="/images/brand/otter-buddy-320.webp" width="64" height="64" alt="">
    <p class="sa-guide-say">${e(guide.say)}</p>
    ${button(`${uiIcon(GUIDE_ICONS[go.label] ?? 'play')}<span>${e(go.label)}</span>`, go.action, attributes, 'sa-guide-go')}
    ${pointAtPlay ? `<span class="sa-hand" aria-hidden="true">${uiIcon('hand')}</span>` : ''}
  </aside>`;
}

function ribbon(guide) {
  const here = screen === 'discovery' ? discoveryReturn : screen;
  const current = { missions: 'play', mission: 'play', result: 'play', workshop: 'build', map: 'launch' }[here] ?? null;
  const nameFor = step => {
    const label = STEPS[step.id].label;
    if (step.state === 'done') return `${label}, done`;
    if (!step.badge) return label;
    return `${label}: ${step.badge.replace('/', ' of ')} ${step.id === 'build' ? 'parts fitted' : 'ready'}`;
  };
  return `<nav class="sa-ribbon" aria-label="Your journey">
    <ol class="sa-steps">${guide.steps.map(step => `<li class="sa-step is-${step.state}${current === step.id ? ' is-here' : ''}">
      <button type="button" data-action="view" data-view="${step.view}" class="sa-step-go" aria-label="${e(nameFor(step))}"${current === step.id ? ' aria-current="page"' : ''}>
        <span class="sa-step-disc">${uiIcon(STEPS[step.id].icon)}${step.state === 'done' ? `<i class="sa-step-tick">${uiIcon('check')}</i>` : ''}</span>
        <span class="sa-step-name">${STEPS[step.id].label}</span>${step.badge ? `<b class="sa-step-badge" aria-hidden="true">${step.badge}</b>` : ''}
      </button></li>`).join('')}</ol>
    <div class="sa-extra">${[['passport', 'My worlds', 'worlds'], ['progress', 'My stars', 'star']].map(([view, label, icon]) =>
      `<button type="button" data-action="view" data-view="${view}" class="sa-extra-go"${here === view ? ' aria-current="page"' : ''}>${uiIcon(icon)}<span>${label}</span></button>`).join('')}</div>
  </nav>`;
}

function systemStamps(gradeId, ids, journey) {
  const craft = craftFor(gradeId);
  return `<div class="sa-system-stamps" role="group" aria-label="Parts this trip needs">${ids.map(id => {
    const part = craft.parts.find(item => item.id === id);
    const fitted = journey.fitted.includes(id);
    const earned = journey.earned.includes(id);
    return `<span class="sa-system-stamp ${fitted ? 'is-fitted' : earned ? 'is-ready' : ''}" title="${e(part.name)}: ${fitted ? 'fitted' : earned ? 'ready to fit' : 'play to win'}"><span>${renderCraftPart(gradeId, id, journey.paint)}</span><small>${e(part.name)}</small><b>${fitted ? uiIcon('check') : earned ? 'Fit' : '?'}</b></span>`;
  }).join('')}</div>`;
}

function answerSummary(question, index, label) {
  return `<div class="sa-answer-summary"><strong>${e(label)}</strong><div class="sa-answer-display" role="group" aria-label="${e(`${label}: ${choiceDescription(question, index)}`)}">${answerChoice(question, index)}</div></div>`;
}

function selectedFeedback(question, index, contentVersion) {
  const message = EVIDENCE_VERSIONS.includes(contentVersion) && index !== question.correctIndex ? coachingFeedback(question, index) : null;
  return message ? `<p class="sa-choice-feedback"><strong>A useful check:</strong> ${e(message)}</p>` : '';
}

function readLink() {
  try {
    const request = readMissionLink(location.search);
    if (!request) return;
    const grade = getGrade(request.grade, request.contentVersion);
    linkRequest = request;
    const note = document.getElementById('sa-link-note');
    if (note) note.textContent = `${grade.label} - ${LEVELS.find(level => level.id === request.level).name}. Your challenge is ready.`;
  } catch (error) {
    notice = `The mission link could not be used: ${error.message} Choose a grade and chapter after opening the game.`;
  }
}
readLink();

function status(text) {
  notice = text;
  const inline = root.querySelector('#sa-activity-notice');
  const node = inline ?? root.querySelector('#sa-notice');
  if (node) { node.textContent = text; node.hidden = !text; node.classList?.remove('sa-notice--announce'); }
  if (inline) root.querySelector('#sa-notice').hidden = true;
}

function stopSpeech() {
  speechRequest += 1;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  const stop = root.querySelector('[data-action="stop-speech"]');
  if (stop) stop.hidden = true;
}

function clearGesture() {
  gesture?.ghost?.remove();
  gesture = null;
}

function destroyScene() {
  scene?.destroy();
  scene = null;
  stopFx();
  stopSpeech();
  clearGesture();
}

function focusContent(selector = '#sa-focus') {
  const heading = root.querySelector(selector) ?? root.querySelector('#sa-focus');
  if (heading && !heading.matches('button,input,select,a')) heading.tabIndex = -1;
  heading?.focus({ preventScroll: true });
  const group = heading?.closest('.sa-section-title') ?? heading;
  group?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
}

function storageError(error) {
  destroyScene();
  busy = false;
  root.removeAttribute('aria-busy');
  root.dataset.screen = 'storage-error';
  root.innerHTML = `<div class="sa-storage-error" role="alert">
    <span class="sa-pill">LOCAL SAVE NEEDS ATTENTION</span>
    <h2 id="sa-focus" tabindex="-1">Your progress could not be saved safely.</h2>
    <p>${e(error.message)}</p>
    <p>Play is paused. We have not cleared your existing save or granted an unsaved reward. Enable site storage, free some device space, or close other game tabs, then try again.</p>
    <div class="sa-actions">${button('Try opening the save again', 'retry', '', 'sa-button--primary')}<a class="sa-button" href="/learn/olympiad/">Read chapter examples instead</a></div>
    <p class="sa-small">A browser-local save is not a cloud backup. Restoring access cannot recover data the browser has already deleted.</p>
  </div>`;
  focusContent();
}

async function boot() {
  if (busy) return;
  busy = true;
  const opener = root.querySelector('[data-action="open"],[data-action="retry"]');
  if (opener) opener.disabled = true;
  try {
    storage ??= new AcademyStorage();
    save = await storage.open();
    if (linkRequest) {
      save = await storage.update(save.revision, current => {
        let next = applyAction(current, { type: 'grade', id: linkRequest.grade });
        next = applyAction(next, { type: 'level', level: linkRequest.level });
        return next;
      });
    }
    screen = currentJourney(save).active ? 'mission' : 'missions';
    busy = false;
    render();
  } catch (error) { storageError(error); }
}

async function commit(action, after = () => {}) {
  if (busy) return false;
  try { applyAction(save, action); }
  catch (error) { status(error.message); return false; }
  const position = ['activity', 'fit', 'remove', 'paint'].includes(action.type) ? interactionPosition() : null;
  busy = true;
  root.setAttribute('aria-busy', 'true');
  root.querySelectorAll('button,select').forEach(node => { node.disabled = true; });
  try {
    save = await storage.update(save.revision, current => applyAction(current, action));
    busy = false;
    after();
    render(position, action.type === 'answer' ? '.sa-feedback [data-action]' : action.type === 'hint' ? '.sa-hint' : undefined);
    return true;
  } catch (error) {
    if (error instanceof SaveConflict) {
      try {
        save = await storage.read();
        busy = false;
        screen = currentJourney(save).active ? 'mission' : 'missions';
        notice = error.message;
        render();
      } catch (readError) { storageError(readError); }
    } else storageError(error);
    return false;
  }
}

function interactionPosition(node = document.activeElement) {
  return {
    x: window.scrollX, y: window.scrollY, top: root.scrollTop, left: root.scrollLeft,
    contentTop: root.querySelector('.sa-content')?.scrollTop ?? 0,
    data: node?.dataset ? { ...node.dataset } : {},
  };
}

function chrome(content) {
  const explorer = currentExplorer(save);
  const journey = currentJourney(save);
  const activityNotice = screen === 'map' && !journey.flight &&
    getCampaign(explorer.grade).stages[journey.expedition.visits.length];
  const guide = nextStep(save, guideContext());
  const docked = screen !== 'mission' && !(screen === 'map' && journey.flight);
  return `<header class="sa-toolbar">
    <div class="sa-wordmark"><img src="/images/brand/otter-mark-80.webp" width="36" height="36" alt=""><span><small>Space Academy</small></span></div>
    <div class="sa-controls">
      <label><span class="sa-control-caption">Crew</span><select id="sa-explorer" aria-label="Local explorer">${EXPLORERS.map(item => `<option value="${item.id}" ${item.id === save.activeExplorer ? 'selected' : ''}>${item.callSign}</option>`).join('')}</select></label>
      <label><span class="sa-control-caption">Grade</span><select id="sa-grade" aria-label="Learning grade">${GRADES.map(grade => `<option value="${grade.id}" ${grade.id === explorer.grade ? 'selected' : ''}>${grade.label}</option>`).join('')}</select></label>
    </div>
    <div class="sa-tool-actions">${button(uiIcon('help'), 'help', 'aria-label="Help & saves"')}${button(uiIcon('fullscreen'), 'fullscreen', 'aria-label="Toggle full screen"')}</div>
  </header>
  <p id="sa-notice" class="sa-notice${screen === 'discovery' && notice === DISCOVERY_NOTICE ? ' sa-notice--announce' : ''}" role="status" ${notice && !activityNotice ? '' : 'hidden'}>${e(notice)}</p>
  <div class="sa-content">${content}</div>
  ${docked ? `<div class="sa-dock" data-guide="${guide.state}" data-step="${guide.step}">${ribbon(guide)}${guideBar(guide, guide.firstRun && screen === 'missions')}</div>` : ''}
  <footer class="sa-game-footer"><span class="sa-save-dot" aria-hidden="true"></span> Saved on this device ${button('Backup & settings', 'help')}</footer>`;
}

function missionHome() {
  const explorer = currentExplorer(save);
  const grade = getGrade(explorer.grade);
  const journey = currentJourney(save);
  const campaign = getCampaign(grade.id);
  const craft = craftFor(grade.id);
  const objectives = chapterObjectives(grade.id, journey);
  const guide = nextStep(save, guideContext());
  const linked = linkRequest && linkRequest.grade === grade.id;
  const active = journey.active?.mission ?? null;
  const offerLink = Boolean(linked && active && !sameSet(linkRequest, active));
  const linkTitle = !offerLink ? '' : linkRequest.mode === 'paper' ? 'Practice paper' : linkRequest.mode === 'mixed' ? 'Mixed set'
    : getGrade(linkRequest.grade, linkRequest.contentVersion).chapters.find(item => item.id === linkRequest.chapter)?.title ?? 'Shared set';
  const nextChapter = ['win-part', 'fuel'].includes(guide.state) ? guide.button.attributes['data-chapter'] : null;
  const firstRun = guide.firstRun && screen === 'missions';
  const worlds = universePassport(save).length;
  const goal = guide.part;
  const chapterChips = grade.chapters.map(chapter => {
    const needs = chapter.skills.some(skill => skillReport(journey, skill, explorer.level).status === 'Practise next');
    const progress = objectives.find(item => item.id === chapter.id);
    const part = craft.parts.find(item => item.id === progress.part);
    const upNext = nextChapter === chapter.id && !progress.complete;
    return `<li class="sa-chip ${progress.complete ? 'is-complete' : ''} ${upNext ? 'is-next' : ''}">
      <button type="button" class="sa-chapter-pick" data-action="start" data-chapter="${chapter.id}" aria-label="Start ${e(chapter.title)}">
        <span class="sa-chapter-part sa-node-ring" style="--p:${Math.min(100, Math.round(progress.count / progress.target * 100))}"><span class="sa-node-face">${renderCraftPart(grade.id, part.id, journey.paint)}</span>${progress.complete ? `<i class="sa-node-check" aria-hidden="true">${uiIcon('check')}</i>` : ''}${upNext ? '<b class="sa-node-tag" aria-hidden="true">Next</b>' : ''}</span>
        <strong>${e(chapter.title)}</strong>
        <span class="sr-only">${needs ? 'Practise next' : e(part.name)}</span>
      </button>
      <div class="sa-chapter-objective sr-only" data-objective="${chapter.id}"><progress value="${progress.count}" max="${progress.target}" aria-label="${e(chapter.title)} participation"></progress><small>${progress.count}/${progress.target} ${progress.complete ? 'complete' : 'towards this chapter'}</small></div>
    </li>`;
  }).join('');
  const paperSize = grade.year === 5 ? 50 : 35;
  return `<section class="sa-launchpad">
    <div class="sa-hangar-scene">
      <span class="sa-sky-orb" aria-hidden="true"></span><span class="sa-sky-ground" aria-hidden="true"></span>
      <header class="sa-launchpad-heading"><h2 id="sa-focus" tabindex="-1">${e(campaign.title)}</h2></header>
      <ul class="sa-hud" aria-label="Your collection">
        <li title="${journey.charges} fuel">${uiIcon('charge')}<b>${journey.charges}</b><span class="sr-only">${journey.charges} fuel</span></li>
        <li title="${worlds} of 30 worlds found">${uiIcon('worlds')}<b>${worlds}<small>/30</small></b><span class="sr-only">${worlds} of 30 worlds found</span></li>
      </ul>
      <div class="sa-scene-stage">
        <div class="sa-hero-craft" ${goal ? `data-goal="${goal}"` : ''}>${renderCraft(grade.id, journey.fitted, journey.paint)}</div>
        <p class="sa-hangar-caption"><strong>${e(craft.name)}</strong><span class="sa-parts-meter" aria-hidden="true">${Array.from({ length: 6 }, (_, index) => `<i class="${index < journey.fitted.length ? 'is-on' : ''}"></i>`).join('')}</span><span><b>${journey.fitted.length}/6</b> parts fitted</span></p>
      </div>
    </div>
    ${firstRun ? howTo() : ''}
    ${offerLink ? `<div class="sa-link-offer"><span>${uiIcon('share')}<span><strong>Shared set</strong> &middot; ${e(linkTitle)}</span></span>${button('Play the shared set', 'start-linked')}</div>` : ''}
  </section>
  <section class="sa-chapter-section" aria-labelledby="sa-chapters-title">
    <h3 id="sa-chapters-title">Or pick another</h3>
    <ul class="sa-strip">${chapterChips}</ul>
    <details class="sa-more"${moreOpen ? ' open' : ''}><summary>${uiIcon('more')}<span>More</span></summary>
      <div class="sa-more-body">
        <label class="sa-level-pick">Challenge level<select id="sa-level" aria-label="Challenge level">${LEVELS.map(level => `<option value="${level.id}" ${level.id === explorer.level ? 'selected' : ''}>${level.name}</option>`).join('')}</select></label>
        <div class="sa-more-modes">${button(`${uiIcon('mix')} Mixed set`, 'start-mode', 'data-mode="mixed" aria-label="Start mixed set"')}${grade.year > 0 ? button(`${uiIcon('paper')} ${paperSize}-question paper`, 'start-mode', `data-mode="paper" aria-label="Try ${paperSize}-question paper"`) : ''}</div>
        <details class="sa-samples"><summary>${uiIcon('paper')} Sample lessons</summary>
          <ul>${grade.chapters.map(chapter => `<li><a class="sa-sample-link" href="${chapterRoute(grade.id, chapter.id)}">${e(chapter.title)}</a></li>`).join('')}</ul>
        </details>
      </div>
    </details>
  </section>`;
}

function missionScreen() {
  const active = currentJourney(save).active;
  if (!active) throw new Error('No unfinished mission is available.');
  const { mission, index, answers } = active;
  const question = mission.questions[index];
  const answer = answers[index];
  const answered = answer.choice !== null;
  const correct = answer.choice === question.correctIndex;
  const journey = currentJourney(save);
  const goal = repairGoal(mission.grade, EVIDENCE_VERSIONS.includes(mission.contentVersion) && mission.mode === 'chapter' ? mission.chapter : null);
  const done = answers.filter(item => item.choice !== null).length;
  return `<section class="sa-quiz">
    <div class="sa-quiz-top"><span class="sa-pill">${e(getGrade(mission.grade, mission.contentVersion).label)} &middot; ${e(LEVELS.find(level => level.id === question.level).name)}</span><div class="sa-quiz-actions">${button(uiIcon('share'), 'share', 'aria-label="Share or report this question"')}${button(`${uiIcon('pause')} Pause`, 'view',     'data-view="missions" aria-label="Pause game"')}</div></div>
        <div class="sa-question-progress"><span>Question ${index + 1} / ${answers.length}</span><progress value="${done}" max="${answers.length}" aria-label="Questions answered"></progress><span>${uiIcon('charge')} +1 at finish</span></div>
    <div class="sa-question-layout">
      <div class="sa-question-card${question.optionVisuals?.some(Boolean) ? ' sa-question-card--pictures' : ''}">
        <div class="sa-question-main">
          <h2 id="sa-focus" tabindex="-1">${e(question.prompt)}</h2>
          ${diagram(question.visual)}
        </div>
        <div class="sa-question-side">
        <div class="sa-answers${question.optionVisuals?.some(Boolean) ? ' sa-answers--pictures' : ''}"${question.optionVisuals?.some(Boolean) ? ` data-art="${e(question.optionVisuals.find(Boolean).kind)}"` : ''} role="group" aria-label="Answer choices">${question.options.map((_, choice) =>
          `<button type="button" class="sa-answer ${question.optionVisuals?.[choice] ? 'sa-answer--picture' : ''} ${answered && choice === question.correctIndex ? 'is-correct' : answered && choice === answer.choice ? 'is-incorrect' : ''}" data-action="answer" data-choice="${choice}" ${answered ? 'disabled' : ''} aria-label="${e(choiceDescription(question, choice))}"><span class="sa-answer-letter" aria-hidden="true">${String.fromCharCode(65 + choice)}</span>${answerChoice(question, choice)}${answered && choice === question.correctIndex ? '<span class="sa-answer-marker" aria-hidden="true">Correct</span>' : ''}</button>`).join('')}</div>
        ${answered ? `<div class="sa-feedback ${correct ? 'sa-feedback--correct' : ''}" role="status"><div class="sa-feedback-action"><h3>${uiIcon(correct ? 'check' : 'hint')} ${correct ? 'You found it!' : 'Let us work it out.'}</h3>${button(`${index === answers.length - 1 ? 'Collect reward' : 'Next'} ${uiIcon('next')}`, index === answers.length - 1 ? 'complete' : 'next', '', 'sa-button--primary')}</div>
          <details class="sa-answer-method" ${correct ? '' : 'open'}><summary>See the method</summary>${selectedFeedback(question, answer.choice, mission.contentVersion)}${!correct ? answerSummary(question, question.correctIndex, 'Correct answer') : ''}<p>${e(question.explanation)}</p></details></div>`
          : `<div class="sa-question-tools">${button(`${uiIcon('hint')} ${answer.hinted ? 'Hint shown' : 'Hint'}`, 'hint', `${answer.hinted ? 'disabled' : ''} aria-label="Give me a hint"`)}${button(`${uiIcon('sound')} Read aloud`, 'speak', 'aria-label="Read question aloud"')}${button(uiIcon('stop'), 'stop-speech', 'aria-label="Stop reading" hidden')}</div>${answer.hinted ? `<p class="sa-hint" role="status">${e(coachingHint(question))}</p>` : ''}`}
                  </div>
                </div>
                <aside class="sa-mission-aside"><span class="sa-pill">${goal && !journey.earned.includes(goal.id) ? 'WIN THIS PART' : 'YOUR PROGRESS'}</span><div class="sa-mission-goal-art">${goal && !journey.earned.includes(goal.id) ? renderCraftPart(mission.grade, goal.id, journey.paint) : renderCraft(mission.grade, journey.fitted, journey.paint)}</div>
        <h3>${e(goal && !journey.earned.includes(goal.id) ? goal.name : craftFor(mission.grade).name)}</h3>
        <div class="sa-mission-steps" aria-label="${done} of ${answers.length} questions answered">${answers.length <= 10 ? answers.map(item => `<span class="${item.choice !== null ? 'is-done' : ''}" aria-hidden="true"></span>`).join('') : `<progress value="${done}" max="${answers.length}" aria-label="Game progress"></progress>`}</div>
        <p>${done}/${answers.length} answered</p>
      </aside>
    </div>
  </section>`;
}

function resultScreen() {
  const result = currentJourney(save).lastResult;
  if (!result) return missionHome();
  const { mission, answers } = result;
  const independent = answers.filter(answer => !answer.hinted).length;
  const independentCorrect = answers.filter((answer, index) => !answer.hinted && answer.choice === mission.questions[index].correctIndex).length;
  const next = campaignRecommendation(mission.grade, currentJourney(save), mission.level);
  const guide = nextStep(save, guideContext());
  const craft = craftFor(mission.grade);
  const rewards = result.parts ?? (result.part ? [result.part] : []);
  const names = rewards.map(id => craft.parts.find(part => part.id === id).name);
  const winTitle = names.length === 1 ? `You won the ${names[0]}!` : '';
  const heading = !rewards.length ? 'Great job, pilot!' : names.length > 1 ? `You won ${names.length} parts!`
    : winTitle.split(' ').length <= 6 ? winTitle : 'You won a part!';
  return `<section class="sa-result">
    <div class="sa-reward-stage"><span class="sa-pill">${rewards.length ? 'NEW PART' : 'WELL DONE'}</span><h2 id="sa-focus" tabindex="-1">${e(heading)}</h2>
      <div class="sa-reward-display"><div class="sa-reward-art">${rewards.length ? renderCraftPart(mission.grade, rewards[0], currentJourney(save).paint) : symbolSVG('star')}</div><div class="sa-reward-craft">${renderCraft(mission.grade, currentJourney(save).fitted, currentJourney(save).paint)}</div></div>
      ${names.length > 1 ? `<h3>${e(names.join(' + '))}</h3>` : ''}<span class="sa-reward-charge">${uiIcon('charge')} fuel +1 saved</span>
      <div class="sa-actions">${guide.button.action === 'start' ? '' : button(`${uiIcon('play')} Play another`, 'start', `data-chapter="${next.chapter.id}" aria-label="Play another game"`, 'sa-button--quiet')}</div>
    </div>
    <details class="sa-result-report"><summary>Score &amp; learning report</summary><div class="sa-stats"><span><strong>${result.correct}/${answers.length}</strong> correct answers</span><span><strong>${independent ? `${independentCorrect}/${independent}` : 'None yet'}</strong> independent answers</span><span><strong>${result.helped}</strong> with a hint</span></div><p>Hints are counted separately from independent answers. Repeated questions do not add extra evidence.</p>${originalBankNote(mission)}${button('See my stars', 'view', 'data-view="progress"')}</details>
    <details class="sa-review"><summary>Review every answer</summary>${mission.questions.map((question, index) =>
      `<article class="sa-review-question"><span class="sa-pill">${index + 1} / ${answers[index].choice === question.correctIndex ? 'CORRECT' : 'WORK IT THROUGH'}${answers[index].hinted ? ' / HINT USED' : ''}</span><h3>${e(question.prompt)}</h3>${diagram(question.visual)}<div class="sa-review-answers">${answerSummary(question, answers[index].choice, 'Your answer')}${answerSummary(question, question.correctIndex, 'Correct answer')}</div>${selectedFeedback(question, answers[index].choice, mission.contentVersion)}<p>${e(question.explanation)}</p></article>`).join('')}</details>
  </section>`;
}

function workshopScreen() {
  const gradeId = currentExplorer(save).grade;
  const journey = currentJourney(save);
  const craft = craftFor(gradeId);
  const objectives = chapterObjectives(gradeId, journey);
  if (!selectedPart) selectedPart = craft.parts.find(part => journey.earned.includes(part.id) && !journey.fitted.includes(part.id))?.id ?? null;
  return `<section class="sa-workshop">
    <div class="sa-section-title"><div><h2 id="sa-focus" tabindex="-1">Build your ${e(craft.noun)}.</h2></div><span class="sa-pill">${journey.fitted.length} / 6 FITTED</span></div>
    <div class="sa-workbench-layout">
      <div class="sa-parts"><h3>Your parts</h3>${craft.parts.map((part, index) => {
        const earned = journey.earned.includes(part.id);
        const fitted = journey.fitted.includes(part.id);
        const goals = objectives.filter(objective => objective.part === part.id);
        const done = goals.reduce((sum, goal) => sum + Math.min(goal.count, goal.target), 0);
        const total = goals.reduce((sum, goal) => sum + goal.target, 0) || 1;
        return `<div class="sa-system-row ${fitted ? 'is-fitted-row' : earned ? 'is-ready-row' : 'is-locked-row'}"><button type="button" class="sa-part ${fitted ? 'is-fitted' : earned ? 'is-ready' : 'is-locked'} ${selectedPart === part.id ? 'is-selected' : ''}" data-action="select-part" data-part="${part.id}" ${!earned || fitted || journey.flight ? 'disabled' : ''} aria-pressed="${selectedPart === part.id}" aria-label="Select ${e(part.name)}"><span>${renderCraftPart(gradeId, part.id, journey.paint)}</span><span><strong>${index + 1}. ${e(part.name)}</strong><small>${fitted ? 'Fitted' : earned ? 'Ready' : `Play to win<span class="sr-only">, ${done} of ${total} questions done</span>`}</small>${earned ? '' : `<i class="sa-part-meter" style="--p:${Math.round(done / total * 100)}%" aria-hidden="true"></i>`}</span>${fitted ? `<b aria-hidden="true">${uiIcon('check')}</b>` : earned ? '' : `<i class="sa-lock" aria-hidden="true">${uiIcon('lock')}</i>`}</button>${fitted ? button(`${uiIcon('close')}<span class="sr-only">Remove ${e(part.name)}</span>`, 'remove-part', `data-slot="${part.id}" ${journey.flight ? 'disabled' : ''}`, 'sa-remove-system') : ''}</div>`;
      }).join('')}</div>
      <div class="sa-blueprint">
        <div class="sa-blueprint-header"><span>${e(craft.name)}</span><span>${e(getGrade(gradeId).label)}</span></div>
        <div class="sa-assembly sa-craft-assembly ${journey.fitted.length === craft.parts.length ? 'is-complete' : ''}" style="aspect-ratio:${craft.width}/${craft.height}" aria-label="${e(craft.name)} assembly board">${renderCraft(gradeId, journey.fitted, journey.paint)}
          ${craft.parts.map((part, index) => `<button type="button" class="sa-slot ${journey.fitted.includes(part.id) ? 'is-fitted' : ''} ${selectedPart === part.id ? 'is-target' : ''}" style="left:${part.x}%;top:${part.y}%" data-action="${journey.fitted.includes(part.id) ? 'remove-part' : 'fit'}" data-slot="${part.id}" ${journey.flight ? 'disabled' : ''} aria-label="${journey.fitted.includes(part.id) ? 'Remove' : 'Fit'} ${e(part.name)}" title="${e(part.name)}"><span>${index + 1}</span><small>${journey.fitted.includes(part.id) ? 'OK' : selectedPart === part.id ? 'fit' : 'slot'}</small></button>`).join('')}
          <div class="sa-fx-layer" aria-hidden="true"></div>
        </div>
        <div class="sa-fit-control">${selectedPart ? `<p class="sa-fit-pick">${uiIcon('build')} ${e(craft.parts.find(part => part.id === selectedPart).name)}</p>` : journey.fitted.length === craft.parts.length ? `<p class="sa-fit-done">${uiIcon('check')} All six parts fitted. Ready to launch!</p>` : '<p>Win a part, then fit it here.</p>'}</div>
      </div>
      <aside class="sa-launch-check"><h3>Make it yours</h3><div class="sa-paints" role="group" aria-label="Craft paint">${PAINTS.map(paint => button(`<span class="sr-only">${e(paint.name)}</span>`, 'paint', `data-paint="${paint.id}" aria-pressed="${journey.paint === paint.id}" style="--paint:${paint.color}"`)).join('')}</div>
        <details><summary>How to earn parts</summary>${objectives.map(goal => `<p>${e(goal.title)}: ${goal.count}/${goal.target} questions towards ${e(craft.parts.find(part => part.id === goal.part).name)}.</p>`).join('')}<p>Finish different questions to build. Hints and mistakes never take a part away. Some systems need more than one chapter.</p></details>
      </aside>
    </div>
  </section>`;
}

function worldArt(world) {
  return `<div class="sa-world-art"><img src="${ART_ROOT}${world.id}.webp" alt="" width="256" height="256"><canvas data-celestial="${world.id}" role="img" aria-label="Stylised animated illustration of ${e(world.name)}"></canvas></div><p id="sa-art-notice" class="sa-small sa-art-notice" role="status"></p>`;
}

function mapScreen() {
  const gradeId = currentExplorer(save).grade;
  const journey = currentJourney(save);
  const readiness = campaignStatus(save);
  const { campaign, stage } = readiness;
  const craft = craftFor(gradeId);
  if (journey.flight) {
    return `<section class="sa-flight-screen">
      <h2 id="sa-focus" tabindex="-1" class="sr-only">Launching the ${e(craft.name)}</h2>
      <div class="sa-fl-wrap">
        ${flightStage({ craft: renderCraft(gradeId, journey.fitted, journey.paint, true), grade: gradeId, destination: journey.flight.destination, paused: manualPause })}
        <details class="sa-flight-info"><summary><span aria-hidden="true">i</span><span class="sr-only">About this flight</span></summary><p>Make-believe travel, not real speeds or distances. Flight time pauses when hidden, offscreen or paused. Your destination and paid charge stay saved if you leave.${journey.flight.campaignVersion === undefined ? ' This earlier flight keeps its original destination.' : ''}</p></details>
        ${button('Skip<span class="sr-only"> to arrival</span>', 'skip-flight', '', 'sa-fl-skip')}
      </div>
      <div class="sa-actions">${button(manualPause ? 'Resume flight' : 'Pause flight', 'pause-flight', `aria-pressed="${manualPause}"`)}${button('Save flight & take a break', 'view', 'data-view="missions"')}</div>
    </section>`;
  }
  const collected = universePassport(save);
  const fuelOk = readiness.known || journey.charges > 0;
  const needed = stage ? stage.parts.length : 0;
  return `<section class="sa-map">
    <div class="sa-section-title"><div><h2 id="sa-focus" tabindex="-1">${e(campaign.title)}</h2></div><span class="sa-pill">${journey.expedition.visits.length} / ${campaign.stages.length}</span></div>
    ${stage ? `<div class="sa-expedition-layout">
      <div><p id="sa-activity-notice" class="sa-notice sa-activity-notice" role="status" ${notice ? '' : 'hidden'}>${e(notice)}</p>${renderActivity(readiness.activity)}</div>
      <aside class="sa-expedition-checklist${(panelLeads ?? readiness.solved) ? ' is-lead' : ''}" aria-label="Ready to launch?">
        <div class="sa-ready">
          <div class="sa-ready-parts ${readiness.missing.length ? '' : 'is-ok'}">${systemStamps(gradeId, stage.parts, journey)}<b class="sa-ready-count"><span aria-hidden="true">${needed - readiness.missing.length}/${needed}</span><span class="sr-only">${needed - readiness.missing.length} of ${needed} parts fitted</span></b></div>
          <div class="sa-ready-item ${readiness.solved ? 'is-ok' : ''}"><span class="sa-ready-icon">${uiIcon(readiness.solved ? 'check' : 'puzzle')}</span><small>Puzzle</small></div>
          <div class="sa-ready-item ${fuelOk ? 'is-ok' : ''}"><span class="sa-ready-icon">${uiIcon('charge')}</span><small>${readiness.known ? 'Free' : `${journey.charges} fuel`}</small></div>
        </div>
        <p data-activity-readiness>${uiIcon(readiness.solved ? 'check' : 'puzzle')} <strong>${readiness.solved ? 'Puzzle complete!' : 'Solve the puzzle.'}</strong> <span class="sa-nowrap">${readiness.known ? 'Free revisit.' : `${journey.charges} fuel.`}</span></p>
      </aside>
    </div>` : `<div class="sa-campaign-complete"><span class="sa-pill">ALL DONE</span><h3>All ${campaign.stages.length} worlds found!</h3><p>Your ${e(craft.noun)} found them all. Time for a new trip!</p><div class="sa-actions">${button('Keep playing', 'view', 'data-view="missions"', 'sa-button--quiet')}</div></div>`}
    <details class="sa-campaign-route"><summary>Worlds on this trip</summary>${collectionTiles(campaign.destinations.map(id => DESTINATIONS.find(world => world.id === id)), collected, 'Grade expedition route', stage?.destination)}</details>
  </section>`;
}

function collectionTiles(worlds, collected, label, nextId = null) {
  const wrap = worlds.length === 4 ? 2 : Math.min(worlds.length, 3);
  return `<div class="sa-world-grid" role="group" aria-label="${e(label)}" style="--n:${worlds.length};--wrap:${wrap}">${worlds.map((world, index) => {
    const discovered = collected.some(item => item.id === world.id);
    const upNext = !discovered && world.id === nextId;
    const caption = discovered ? e(world.name) : upNext ? 'Next world' : '';
    return `<button type="button" class="sa-world-tile ${discovered ? 'is-discovered' : ''} ${upNext ? 'is-next' : ''} ${selectedWorld === world.id ? 'is-selected' : ''}" data-action="world" data-world="${world.id}" ${discovered ? '' : 'disabled'} aria-label="${discovered ? e(world.name) : `Undiscovered signal ${index + 1}${upNext ? ', next world' : ''}`}"><span class="sa-world-orbit"><span class="sa-world-disc">${discovered ? `<img src="${ART_ROOT}${world.id}.webp" alt="" width="96" height="96" loading="lazy">` : '<span class="sa-signal" aria-hidden="true">?</span>'}</span></span>${caption ? `<strong>${caption}</strong>` : ''}</button>`;
  }).join('')}</div>`;
}

function passportScreen() {
  const explorer = currentExplorer(save);
  const collected = universePassport(save);
  const total = DESTINATIONS.length;
  const visits = currentJourney(save).expedition.visits.length;
  return `<section class="sa-passport">
    <header class="sa-passport-head">
      <div><h2 id="sa-focus" tabindex="-1">My worlds</h2><p class="sa-passport-caption">Seven adventures. One collection.</p></div>
      <div class="sa-passport-ring" style="--p:${Math.round(collected.length / total * 100)}" role="img" aria-label="${collected.length} of ${total} collected"><span><b>${collected.length}</b> / ${total}</span></div>
    </header>
    ${collected.length === total ? '<p class="sa-report-note"><strong>All 30 discoveries are yours!</strong> Visit any world again for free.</p>' : ''}
    <div class="sa-passport-atlas" role="group" aria-label="Shared Universe Passport">${GRADES.map(grade => {
      const campaign = getCampaign(grade.id);
      const current = grade.id === explorer.grade;
      const worlds = campaign.destinations.map(id => DESTINATIONS.find(world => world.id === id));
      const count = worlds.filter(world => collected.some(item => item.id === world.id)).length;
      return `<article class="sa-passport-region ${current ? 'is-current' : ''}" data-campaign-grade="${grade.id}" style="--campaign-accent:${campaign.accent};--accent-soft:${campaign.accent}38">
        <h3 class="sa-region-head"><button type="button" class="sa-region-open" data-action="campaign-grade" data-grade="${grade.id}" ${current ? 'aria-current="true"' : ''} aria-label="Open ${e(grade.label)}: ${e(campaign.title)}, ${count} of ${worlds.length} collected"><span class="sa-region-name"><span class="sa-region-meta"><span class="sa-region-chip">${e(grade.label)}</span>${current ? '<span class="sa-here" aria-hidden="true">You are here</span>' : ''}</span><span class="sa-region-title">${e(campaign.title)}</span></span><span class="sa-region-count" aria-hidden="true"><b>${count}</b>/${worlds.length}</span><span class="sa-region-go" aria-hidden="true">${uiIcon('next')}</span></button></h3>
        ${collectionTiles(worlds, collected, `${grade.label} discoveries`, current ? campaign.stages[visits]?.destination : null)}
      </article>`;
    }).join('')}</div>
  </section>`;
}

function discoveryScreen() {
  const world = universePassport(save).find(world => world.id === selectedWorld);
  if (!world) return discoveryReturn === 'passport' ? passportScreen() : mapScreen();
  return `<section class="sa-discovery">
    <div class="sa-section-title"><div><p class="sa-eyebrow">${uiIcon('mix')} DISCOVERY COLLECTED!</p><h2 id="sa-focus" tabindex="-1">${e(world.name)}</h2></div><span class="sa-pill">${universePassport(save).length} / 30</span></div>
    <div class="sa-discovery-feature">${worldArt(world)}<div><h3>${e(world.subtitle)}</h3><p>${e(world.fact)}</p>${discoveryReturn === 'passport' ? `<div class="sa-actions">${button('Back to my worlds', 'view', 'data-view="passport"', 'sa-button--quiet')}</div>` : ''}<details><summary>More about this discovery</summary><p>Make-believe travel and original artistic illustrations, not a scale map. We observe stars, gas giants and black holes from a safe distance.</p><a href="${world.source}" target="_blank" rel="noopener noreferrer">NASA reference for grown-ups &rarr;</a></details></div></div>
  </section>`;
}

// Display-only look for each report status; the status itself still comes from skillReport.
const SKILL_LOOKS = {
  'Practise next': { tone: 'next', icon: 'charge', rank: 0 },
  'Building confidence': { tone: 'building', icon: 'progress', rank: 1 },
  'Going well': { tone: 'going', icon: 'check', rank: 2 },
  'Gathering evidence': { tone: 'gathering', icon: 'mix', rank: 3, label: 'Getting started' },
};

function skillCard(grade, journey, level, skill) {
  const report = skillReport(journey, skill, level);
  const focus = coachingFocus(report.practiceFocus);
  const chapter = grade.chapters.find(item => item.skills.includes(skill));
  const look = SKILL_LOOKS[report.status] ?? SKILL_LOOKS['Gathering evidence'];
  const gathering = report.status === 'Gathering evidence';
  const fill = !report.count ? 0 : gathering ? report.count / 5 : report.correct / report.count;
  const score = !report.count ? 'Play a game to start.'
    : gathering ? `<strong>${5 - report.count} more</strong> ${5 - report.count === 1 ? 'answer' : 'answers'} to see how you're doing`
      : `<strong>${report.correct}/${report.count}</strong> correct on your own`;
  const notes = [
    `<p>${e(report.tip)}</p>`,
    report.helped ? `<p>${countLabel(report.helped, 'question')} tried with a hint, counted separately.</p>` : '',
    report.trend ? `<p>Latest five: ${report.trend.recent}/5. Previous five: ${report.trend.previous}/5. Same challenge, small sample.</p>` : '',
    focus ? `<p class="sa-practice-focus"><strong>${e(focus.title)}.</strong> ${e(focus.message)} This is a practice suggestion, not a diagnosis.</p>` : '',
  ].join('');
  return {
    rank: look.rank,
    html: `<details class="sa-skill-card sa-skill-card--${look.tone}">
      <summary><span class="sa-skill-ring" style="--p:${Math.round(fill * 100)}" aria-hidden="true"><span class="sa-skill-face">${uiIcon(look.icon)}</span></span>
        <span class="sa-skill-main"><h3>${e(report.title)}</h3><span class="sa-skill-line"><span class="sa-pill">${e(look.label ?? report.status)}</span><span class="sa-skill-score">${score}</span></span></span></summary>
      <div class="sa-skill-detail">${report.count ? `<progress value="${report.correct}" max="${report.count}" aria-label="${e(report.title)} independent correct answers"></progress>` : ''}${notes}${button(`${uiIcon('play')} Practise`, 'start', `data-chapter="${chapter.id}" aria-label="Practise ${e(report.title)}"`, 'sa-skill-go')}</div>
    </details>`,
  };
}

function progressScreen() {
  const explorer = currentExplorer(save);
  const grade = getGrade(explorer.grade);
  const journey = currentJourney(save);
  const skills = [...new Set(grade.chapters.flatMap(chapter => chapter.skills))];
  const cards = skills.map(skill => skillCard(grade, journey, explorer.level, skill)).sort((a, b) => a.rank - b.rank);
  const next = recommendChapter(grade.id, journey, explorer.level);
  const goal = repairGoal(grade.id, next.chapter.id);
  const earns = Boolean(goal && !journey.earned.includes(goal.id));
  const boost = next.chapter.skills.map(skill => skillReport(journey, skill, explorer.level)).find(report => report.status === 'Practise next');
  const reward = boost ? `Boost ${e(boost.title)}` : earns ? `Win your ${e(goal.name)}` : 'Win some fuel';
  return `<section class="sa-progress">
    <div class="sa-section-title"><div><h2 id="sa-focus" tabindex="-1">My stars</h2><p class="sa-progress-caption">${e(grade.label)} &middot; ${countLabel(journey.completed.length, 'game')} played</p></div>
      <label>Challenge<select id="sa-level" aria-label="Challenge level">${LEVELS.map(level => `<option value="${level.id}" ${level.id === explorer.level ? 'selected' : ''}>${level.name}</option>`).join('')}</select></label>
    </div>
    <div class="sa-next-win">
      <span class="sa-node-ring sa-next-ring" style="--p:100" aria-hidden="true"><span class="sa-node-face">${earns ? renderCraftPart(grade.id, goal.id, journey.paint) : uiIcon('explore')}</span></span>
      <div class="sa-next-copy"><p class="sa-eyebrow">Try this next</p><h3>${e(next.chapter.title)}</h3><p>${reward}</p></div>
      ${button(`${uiIcon('play')} Play`, 'start', `data-chapter="${next.chapter.id}" aria-label="Play ${e(next.chapter.title)} now"`, 'sa-next-go')}
    </div>
    <div class="sa-skill-grid">${cards.map(card => card.html).join('')}</div>
    <details class="sa-report-method"><summary>For grown-ups: how these reports work</summary><p>Suggestions use up to 20 recent different questions at the same challenge level. At least five independent, unhinted questions are needed before a practice suggestion. Repeating a question updates its record rather than adding evidence. Earlier saved missions keep their rewards but are not mixed with newer practice evidence.</p><p>These are small practice observations, not IQ scores, diagnoses, standardised tests or national rankings. Difficulty has not been independently calibrated.</p></details>
    <details class="sa-history"><summary>Games I played</summary>${journey.history.length ? `<ol>${[...journey.history].reverse().map(result =>
      `<li><div><strong>${e(result.title)}</strong><small>${e(LEVELS.find(level => level.id === result.level).name)} &middot; ${e(new Date(result.at).toLocaleDateString())}</small></div><span>${result.correct}/${result.count} correct &middot; ${countLabel(result.helped, 'hint')}</span></li>`).join('')}</ol>` : '<p>Your first finished game will show here.</p>'}</details>
    ${journey.lastResult ? button('Review latest completed set', 'view', 'data-view="result"', 'sa-review-latest') : ''}
  </section>`;
}

// Wrap the chapter shelf into even rows instead of leaving one or two orphans.
function balanceShelf() {
  const list = root.querySelector('.sa-chapter-section .sa-nodes:not(.sa-nodes--modes)');
  if (!list || !list.firstElementChild) return;
  list.style.maxWidth = '';
  const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
  const cell = list.firstElementChild.getBoundingClientRect().width + gap;
  const count = list.children.length;
  const rows = Math.ceil(count / Math.max(1, Math.floor((list.getBoundingClientRect().width + gap) / cell + 0.01)));
  if (rows > 1) list.style.maxWidth = `${Math.ceil(count / rows) * cell - gap + 1}px`;
}

// Crop a question's picture answers to one shared box, so the artwork fills its tile and the options stay comparable.
function fitPictureAnswers() {
  const art = [...root.querySelectorAll('.sa-answers--pictures .sa-picture > svg')];
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  try {
    for (const svg of art) {
      const box = svg.getBBox();
      if (!box.width && !box.height) continue;
      x1 = Math.min(x1, box.x);
      y1 = Math.min(y1, box.y);
      x2 = Math.max(x2, box.x + box.width);
      y2 = Math.max(y2, box.y + box.height);
    }
  } catch {
    return;
  }
  if (!Number.isFinite(x1)) return;
  const pad = 6;
  const x = Math.floor(x1 - pad);
  const y = Math.floor(y1 - pad);
  const width = Math.ceil(x2 - x1 + pad * 2);
  const height = Math.ceil(y2 - y1 + pad * 2);
  for (const svg of art) {
    svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
  }
}

function render(position = null, focusSelector = '#sa-focus') {
  // Opening Explore with a solved puzzle puts the next-step panel first on narrow screens; live board moves keep
  // the order they found so the board never shifts under the child's hands.
  panelLeads = position ? root.querySelector('.sa-expedition-checklist.is-lead') !== null : null;
  destroyScene();
  root.removeAttribute('aria-busy');
  if (screen !== 'missions') moreOpen = false;
  const builders = {
    missions: missionHome, mission: missionScreen, result: resultScreen, workshop: workshopScreen,
    map: mapScreen, passport: passportScreen, discovery: discoveryScreen, progress: progressScreen,
  };
  root.dataset.screen = screen;
  root.dataset.campaign = getCampaign(currentExplorer(save).grade).id;
  root.style.setProperty('--campaign-accent', getCampaign(currentExplorer(save).grade).accent);
  root.innerHTML = chrome(builders[screen]());
  balanceShelf();
  fitPictureAnswers();
  if (['map', 'passport', 'discovery'].includes(screen)) {
    scene = new SpaceScene(root, {
      isVisible: () => visible,
      onError: text => { const node = root.querySelector('#sa-art-notice'); if (node) node.textContent = text; else status(text); },
      onArrival: async () => {
        const flight = currentJourney(save).flight;
        if (flight) await commit({ type: 'arrive', flightId: flight.id, destination: flight.destination }, () => {
          selectedWorld = flight.destination;
          discoveryReturn = 'map';
          screen = 'discovery';
          notice = DISCOVERY_NOTICE;
          pendingFx = { arrival: true };
        });
      },
    });
    scene.paused = manualPause;
    void scene.start();
  }
  if (position) {
    const keys = ['action', 'activityOp', 'activityValue', 'part', 'slot', 'paint'];
    const previous = [...root.querySelectorAll('button[data-action]')].find(node =>
      !node.disabled && keys.every(key => node.dataset[key] === position.data[key]));
    const target = previous ?? root.querySelector('.sa-activity h3,.sa-fit-control');
    if (target) {
      if (!previous) target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
    root.scrollTop = position.top;
    root.scrollLeft = position.left;
    root.querySelector('.sa-content').scrollTop = position.contentTop;
    window.scrollTo({ left: position.x, top: position.y, behavior: 'instant' });
  } else focusContent(focusSelector);
  if (screen === 'passport' && !position) revealPassportRegion();
  pendingFx = runFx(root, pendingFx);
}

// Open Worlds on the adventure being played so a recent trophy is not buried below earlier grades.
function revealPassportRegion() {
  const grade = passportAnchor ?? currentExplorer(save).grade;
  passportAnchor = null;
  const content = root.querySelector('.sa-content');
  const region = root.querySelector(`.sa-passport-region[data-campaign-grade="${grade}"]`);
  if (!content || !region) return;
  const view = content.getBoundingClientRect();
  const box = region.getBoundingClientRect();
  if (box.bottom > view.bottom) content.scrollTop += box.top - view.top - 8;
}

function closeDialog() {
  const dialog = root.querySelector('dialog');
  dialog?.close();
  dialog?.remove();
  if (scene) { scene.paused = manualPause; scene.refresh(); }
}

function openDialog(title, body) {
  closeDialog();
  stopSpeech();
  if (scene) { scene.paused = true; scene.refresh(); }
  const dialog = document.createElement('dialog');
  dialog.className = 'sa-dialog';
  dialog.setAttribute('aria-labelledby', 'sa-dialog-title');
  dialog.innerHTML = `<div class="sa-dialog-heading"><h2 id="sa-dialog-title">${e(title)}</h2>${button('Close', 'close-dialog', 'aria-label="Close dialog"')}</div>${body}`;
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
  root.append(dialog);
  dialog.showModal();
}

function help() {
  openDialog('How to play', `
    ${howTo()}
    <h3>Keep your journey</h3><p>Saved on this device, not in a cloud account. Clearing browser data or closing a private session can remove progress. Backups contain all three explorers; keep them privately.</p>
    <div class="sa-actions">${button('Download progress backup', 'backup', '', 'sa-button--primary')}<label class="sa-button sa-file-label">Choose backup to restore<input type="file" id="sa-restore-file" accept=".json,application/json" aria-label="Choose Academy backup to restore"></label></div>
    <p id="sa-import-error" class="sa-notice" role="status"></p>
    <details><summary>For grown-ups: questions &amp; reports</summary><p>These are independently authored practice questions, not copied past papers or provider-endorsed material. Class 1-5 chapter maps reference public SOF IMO topic syllabi. Independent educator review is still needed to calibrate difficulty and coverage. Picture-led PP1/PP2 activities are not formal Olympiad papers.</p>
    <p>Reports use up to 20 recent different current-bank questions per skill and challenge level. Original-bank saves and rewards are kept, but their questions are not mixed into the new reports. Hinted answers are separate. At least five unhinted examples are needed for a practice suggestion. A repeated answer pattern can suggest a practice focus, not explain a child's thinking or provide a diagnosis. Repeating an identical question updates its record, not its evidence count. There are no IQ scores or national ranks.</p>
    <p>Use the three fictional crew call signs for separate learners. Each explorer has separate learning reports and one collection across grades. Earlier parts, unfinished missions and flights are retained. An earlier discovery can be revisited without another collection charge. No names, school details or dates of birth are needed.</p>
    <p>Each chapter goal counts different questions in finished sets. Hints and wrong answers count as participation, not mastery. Some systems need more than one chapter. Start with three core systems; later flights need more. Restoring a backup replaces only Academy progress, never other games.</p>
    <p>Read-aloud uses your browser/device speech service and may not be available on every device. It stops when you leave the question or hide the game.</p>
    <p><a href="/learn/olympiad/#content">Question sources &amp; examples</a> / <a href="/privacy.html">Privacy</a> / <a href="/contact.html">Report a question issue</a></p></details>
    <details><summary>Start this explorer again</summary><p>This resets all grades for ${e(explorerName())}, not other explorers or other games.</p>${button(`Reset ${e(explorerName())}...`, 'ask-reset')}</details>
    <p><a href="/play/">Back to Otterly Games &rarr;</a></p>
  `);
}

function freshSeed() {
  if (!globalThis.crypto?.getRandomValues) throw new Error('A fresh question seed could not be created. Reopen a supplied chapter sample link or try a browser with secure randomness; the current mission has not changed.');
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);
  return `flight-${values[0].toString(36)}-${values[1].toString(36)}`;
}

async function startMission(chapter, mode = 'chapter', request = null, replace = false) {
  const explorer = currentExplorer(save);
  const args = request ?? { grade: explorer.grade, chapter, mode, level: explorer.level, contentVersion: CONTENT_VERSION };
  let mission;
  try { mission = createMission({ ...args, seed: args.seed ?? freshSeed() }); }
  catch (error) { status(`The set could not be started: ${error.message}`); return; }
  if (currentJourney(save).active && !replace) {
    pendingStart = mission;
    openDialog('A saved game is waiting', `<p>Pick up where you left off, or replace it with a new game. Your parts stay safe.</p><div class="sa-actions">${button('Resume', 'resume', 'aria-label="Resume saved mission"', 'sa-button--primary')}${button('Replace unfinished set', 'replace-mission')}</div>`);
    return;
  }
  closeDialog();
  await commit({ type: 'start', mission, replace }, () => {
    screen = 'mission'; notice = ''; linkRequest = null;
    history.replaceState(null, '', gameLink(mission));
  });
}
let pendingStart = null;

async function backup() {
  try {
    save = await storage.read();
    const text = JSON.stringify(save, null, 2);
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `otterly-space-academy-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    const note = root.querySelector('#sa-import-error');
    if (note) note.textContent = 'Backup download requested. Keep the file privately; it contains only Space Academy progress, not other games.';
  } catch (error) { storageError(error); }
}

async function handle(action, node) {
  if (action === 'open' || action === 'retry') return boot();
  if (!save || busy) return;
  switch (action) {
    case 'view':
      if (screen !== 'discovery') passportAnchor = null;
      closeDialog(); screen = node.dataset.view; notice = ''; manualPause = false; selectedPart = screen === 'workshop' ? node.dataset.part ?? null : null; render(); return;
    case 'resume':
      closeDialog(); screen = 'mission'; render(); return;
    case 'help': help(); return;
    case 'share': {
      const { mission, index } = currentJourney(save).active;
      openDialog('Share or report this question', `<p>Question ${index + 1} of ${mission.questions.length}. This link shares the questions, not your answers.</p><label class="sa-share-label">Mission link<input readonly value="${e(new URL(gameLink(mission), location.origin).href)}" aria-label="Share this mission link"></label><p><a href="/contact.html">Report a question issue</a>. Please do not include personal information.</p>`);
      return;
    }
    case 'close-dialog': closeDialog(); return;
    case 'start': return startMission(node.dataset.chapter);
    case 'start-mode': return startMission(null, node.dataset.mode);
    case 'start-linked': return startMission(linkRequest?.chapter, linkRequest?.mode, linkRequest);
    case 'replace-mission': {
      const mission = pendingStart;
      pendingStart = null;
      if (!mission) throw new Error('Choose the replacement set again.');
      return startMission(mission.chapter, mission.mode, mission, true);
    }
    case 'hint': return commit({ type: 'hint', missionId: currentJourney(save).active.mission.id });
    case 'answer': return commit({ type: 'answer', missionId: currentJourney(save).active.mission.id, choice: Number(node.dataset.choice) });
    case 'next': return commit({ type: 'next', missionId: currentJourney(save).active.mission.id });
    case 'complete': return commit({ type: 'complete', missionId: currentJourney(save).active.mission.id }, () => { screen = 'result'; });
    case 'select-part': {
      const position = interactionPosition(node);
      selectedPart = node.dataset.part; notice = ''; render(position); return;
    }
    case 'fit-selected':
      selectedPart = node.dataset.part ?? selectedPart;
      return fitPart(selectedPart, selectedPart);
    case 'fit': return fitPart(selectedPart, node.dataset.slot);
    case 'remove-part': return commit({ type: 'remove', part: node.dataset.slot }, () => { selectedPart = node.dataset.slot; });
    case 'paint': return commit({ type: 'paint', id: node.dataset.paint });
    case 'world':
      if (!universePassport(save).some(world => world.id === node.dataset.world)) throw new Error('This signal has not been discovered yet.');
      discoveryReturn = screen === 'passport' ? 'passport' : 'map';
      passportAnchor = discoveryReturn === 'passport' ? node.closest('.sa-passport-region')?.dataset.campaignGrade ?? null : null;
      selectedWorld = node.dataset.world; screen = 'discovery'; render(); return;
    case 'activity':
      return commit({ type: 'activity', move: { type: node.dataset.activityOp, value: node.dataset.activityValue ?? null } }, () => { notice = ''; });
    case 'campaign-grade':
      return commit({ type: 'grade', id: node.dataset.grade }, () => {
        screen = 'missions'; selectedWorld = null; selectedPart = null; linkRequest = null; notice = '';
        history.replaceState(null, '', gameLink({ grade: currentExplorer(save).grade, chapter: getGrade(currentExplorer(save).grade).chapters[0].id, level: currentExplorer(save).level }));
      });
    case 'launch': return commit({ type: 'launch' }, () => { manualPause = false; notice = ''; screen = 'map'; });
    case 'puzzle': {
      if (screen !== 'map') { closeDialog(); screen = 'map'; notice = ''; manualPause = false; selectedPart = null; render(); }
      const first = root.querySelector('.sa-activity button:not(:disabled)');
      first?.focus({ preventScroll: true });
      first?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      return;
    }
    case 'pause-flight':
      manualPause = !manualPause;
      node.textContent = manualPause ? 'Resume flight' : 'Pause flight';
      node.setAttribute('aria-pressed', String(manualPause));
      root.querySelector('[data-flight]')?.toggleAttribute('data-paused', manualPause);
      scene.paused = manualPause;
      scene.refresh(); return;
    case 'skip-flight':
      scene?.skip(); return;
    case 'speak': {
      if (!('speechSynthesis' in window)) { status('Read-aloud is not available in this browser. A grown-up can read the question with you.'); return; }
      const active = currentJourney(save).active;
      const question = active.mission.questions[active.index];
      stopSpeech();
      const request = speechRequest;
      const utterance = new SpeechSynthesisUtterance(questionReadAloud(question));
      utterance.rate = 0.85;
      const stop = root.querySelector('[data-action="stop-speech"]');
      if (stop) stop.hidden = false;
      utterance.onend = () => { if (request === speechRequest && stop) stop.hidden = true; };
      utterance.onerror = event => {
        if (request !== speechRequest) return;
        if (stop) stop.hidden = true;
        if (!['interrupted', 'canceled'].includes(event.error)) status('Read-aloud could not finish. Check your device voice settings or read together.');
      };
      try { speechSynthesis.speak(utterance); }
      catch (error) { stopSpeech(); throw error; }
      return;
    }
    case 'stop-speech': stopSpeech(); return;
    case 'fullscreen':
      try { if (document.fullscreenElement) await document.exitFullscreen(); else await root.requestFullscreen(); }
      catch (error) { status(`Full screen is unavailable: ${error.message} You can continue in the normal page.`); }
      return;
    case 'backup': return backup();
    case 'ask-reset':
      openDialog(`Reset ${explorerName()}?`, `<p>All Academy grades, answers, parts and discoveries for this explorer will be removed from this browser. Other explorers and other games will not change. Download a backup first if you want to keep this journey.</p><div class="sa-actions">${button('Keep my progress', 'close-dialog', '', 'sa-button--primary')}${button(`Reset ${e(explorerName())}`, 'reset')}</div>`); return;
    case 'reset':
      closeDialog(); return commit({ type: 'reset-explorer' }, () => { screen = 'missions'; selectedWorld = null; notice = 'Only this explorer has been reset. Other explorers and other games were not changed.'; linkRequest = null; });
    case 'restore': {
      if (!pendingRestore) throw new Error('Choose and validate a backup before restoring.');
      const restore = pendingRestore;
      pendingRestore = null;
      closeDialog();
      busy = true;
      try {
        save = await storage.update(save.revision, current => ({ ...restore, revision: current.revision + 1 }));
        busy = false; screen = currentJourney(save).active ? 'mission' : 'missions'; notice = 'Space Academy backup restored. Other games were not changed.'; linkRequest = null; render();
      } catch (error) { storageError(error); }
      return;
    }
    default: throw new Error('This game control is not recognised.');
  }
}

async function fitPart(part, slot) {
  if (!part) { status('Select an earned part first, then choose its matching slot.'); return; }
  if (part !== slot) { status('Try the matching labelled slot. You have not lost the part.'); return; }
  await commit({ type: 'fit', part, slot }, () => {
    selectedPart = null;
    pendingFx = { grade: currentExplorer(save).grade, part, complete: currentJourney(save).fitted.length === 6 };
    notice = currentJourney(save).fitted.length === 6 ? 'All six parts fitted! Your craft is ready.' : 'Fitted! Your craft is coming together.';
  });
}

root.addEventListener('click', event => {
  if (suppressClick && event.detail > 0) { suppressClick = false; event.preventDefault(); return; }
  suppressClick = false;
  const control = event.target.closest('[data-action]');
  if (!control || !root.contains(control) || control.disabled) return;
  void handle(control.dataset.action, control).catch(error => {
    if (save) status(`That action could not be completed: ${error.message}`);
    else storageError(error);
  });
});

root.addEventListener('toggle', event => {
  const node = event.target;
  if (!node.classList?.contains('sa-more') || node.open === moreOpen) return;
  moreOpen = node.open;
  if (moreOpen) node.scrollIntoView({ block: 'nearest' });
}, true);

root.addEventListener('change', async event => {
  const node = event.target;
  if (busy || !save) return;
  if (node.id === 'sa-explorer' || node.id === 'sa-grade' || node.id === 'sa-level') {
    const action = node.id === 'sa-explorer' ? { type: 'explorer', id: node.value } : node.id === 'sa-grade' ? { type: 'grade', id: node.value } : { type: 'level', level: Number(node.value) };
    await commit(action, () => {
      linkRequest = null; notice = ''; selectedPart = null; selectedWorld = null; moreOpen = node.id === 'sa-level';
      if (screen === 'mission' || screen === 'result') screen = 'missions';
      history.replaceState(null, '', gameLink({ grade: currentExplorer(save).grade, chapter: getGrade(currentExplorer(save).grade).chapters[0].id, level: currentExplorer(save).level }));
    });
  }
  if (node.id === 'sa-restore-file' && node.files.length) {
    try {
      if (node.files[0].size > 8 * 1024 * 1024) throw new Error('This file is larger than the 8 MB backup limit.');
      const data = validateSave(JSON.parse(await node.files[0].text()));
      pendingRestore = data;
      openDialog('Replace Academy progress with this backup?', `<p>The file has been checked. Restoring replaces all three Space Academy explorer slots in this browser. Other games are not affected. Keep a backup of your current progress if you want to return to it.</p><div class="sa-actions">${button('Keep current progress', 'close-dialog', '', 'sa-button--primary')}${button('Replace Academy saves', 'restore')}</div>`);
    } catch (error) {
      const message = root.querySelector('#sa-import-error');
      if (message) message.textContent = `Backup was not imported: ${error.message} Your current progress has not changed.`;
    }
  }
});

root.addEventListener('pointerdown', event => {
  suppressClick = false;
  const part = event.target.closest('[data-action="select-part"]');
  if (!part || part.disabled || busy || event.button !== 0) return;
  gesture = { part: part.dataset.part, target: part, pointer: event.pointerId, x: event.clientX, y: event.clientY, ghost: null };
  part.setPointerCapture(event.pointerId);
});
root.addEventListener('pointermove', event => {
  if (!gesture || event.pointerId !== gesture.pointer) return;
  if (!gesture.ghost && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 8) {
    const ghost = document.createElement('div');
    ghost.className = 'sa-drag-ghost';
    ghost.innerHTML = renderCraftPart(currentExplorer(save).grade, gesture.part, currentJourney(save).paint);
    root.append(ghost);
    gesture.ghost = ghost;
  }
  if (gesture.ghost) {
    gesture.ghost.style.left = `${event.clientX}px`;
    gesture.ghost.style.top = `${event.clientY}px`;
  }
});
root.addEventListener('pointerup', event => {
  if (!gesture || event.pointerId !== gesture.pointer) return;
  const { ghost, part } = gesture;
  if (ghost) {
    suppressClick = true;
    ghost.remove();
    const slot = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-slot]');
    clearGesture();
    if (slot) void fitPart(part, slot.dataset.slot);
    else status('Drop the part on its matching labelled slot, or select it and use the Fit button.');
  } else clearGesture();
});
root.addEventListener('pointercancel', clearGesture);
root.addEventListener('lostpointercapture', event => {
  if (gesture?.pointer === event.pointerId) clearGesture();
});

new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  if (!visible) { stopSpeech(); clearGesture(); }
  scene?.refresh();
}).observe(root);

function refreshSavedGame(restored = false) {
  if (!document.hidden && save && !busy && root.dataset.screen !== 'storage-error') {
    return storage.read().then(latest => {
      const changed = latest.revision !== save.revision;
      if (changed || restored) {
        save = latest;
        if (changed) {
          screen = currentJourney(save).active ? 'mission' : 'missions';
          notice = 'The latest saved progress was loaded after returning to the game.';
        }
        render();
      }
    }).catch(storageError);
  }
}

document.addEventListener('visibilitychange', () => {
  stopSpeech();
  clearGesture();
  scene?.refresh();
  void refreshSavedGame();
});
window.addEventListener('pageshow', event => {
  if (event.persisted) void refreshSavedGame(true);
});
window.addEventListener('resize', () => requestAnimationFrame(balanceShelf));
window.addEventListener('pagehide', destroyScene);
