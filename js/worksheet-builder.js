import {
  clockHandEndpoints,
  generateWorksheet,
  parseSettings,
  settingsToSearch,
} from './worksheet-generator.mjs';

const form = document.getElementById('worksheet-settings');
const activityControl = document.getElementById('activity');
const tableControl = document.getElementById('table');
const clockControl = document.getElementById('clock-step');
const countControl = document.getElementById('question-count');
const seedControl = document.getElementById('sheet-seed');
const printButton = document.getElementById('print-worksheet');
const copyButton = document.getElementById('copy-sheet-link');
const freshButton = document.getElementById('fresh-sheet');
const buildButton = document.getElementById('build-sheet');
const includeKey = document.getElementById('include-answer-key');
const answerKey = document.getElementById('answer-key');
const shareFallback = document.getElementById('share-fallback');
const shareLink = document.getElementById('share-link');
const copyFeedback = document.getElementById('copy-feedback');
const worksheet = document.getElementById('worksheet');
let currentLink = '';

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function feedback(message, warnings = []) {
  const content = [element('p', message)];
  if (warnings.length) {
    const list = element('ul');
    for (const warning of warnings) list.append(element('li', warning));
    content.push(list);
  }
  document.getElementById('builder-feedback').replaceChildren(...content);
}

function updateActivityControls() {
  const clocks = activityControl.value === 'clock';
  document.getElementById('table-field').hidden = clocks;
  document.getElementById('clock-field').hidden = !clocks;
  tableControl.disabled = clocks;
  clockControl.disabled = !clocks;
  document.getElementById('table-label').textContent =
    activityControl.value === 'division' ? 'Divide by' : 'Times table';
  document.getElementById('count-help').textContent = clocks && clockControl.value === 'five-minutes'
    ? 'Up to 20 different times, with no repeated clock on a sheet.'
    : 'There are 12 different questions. A request for 20 is reduced to 12, without repeats.';
}

function setControls(settings) {
  activityControl.value = settings.activity;
  tableControl.value = String(settings.table);
  clockControl.value = settings.clock;
  countControl.value = String(settings.count);
  seedControl.value = settings.seed;
  updateActivityControls();
}

function readControls() {
  return {
    activity: activityControl.value,
    ...(activityControl.value === 'clock' ? { clock: clockControl.value } : { table: tableControl.value }),
    count: countControl.value,
    seed: seedControl.value,
  };
}

function svgElement(tag, attributes) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
  return node;
}

function clockGraphic(question, index) {
  const titleId = `clock-question-${index}-title`;
  const descriptionId = `clock-question-${index}-description`;
  const svg = svgElement('svg', {
    viewBox: '0 0 200 200',
    class: 'worksheet-clock',
    role: 'img',
    'aria-labelledby': `${titleId} ${descriptionId}`,
  });
  const title = svgElement('title', { id: titleId });
  title.textContent = `Clock for question ${index}`;
  const description = svgElement('desc', { id: descriptionId });
  const minuteNumber = question.minute === 0 ? 12 : question.minute / 5;
  const hourDescription = question.minute === 0
    ? `points to ${question.hour}`
    : `is between ${question.hour} and ${question.hour % 12 + 1}`;
  description.textContent = `The long minute hand points to ${minuteNumber}. The short hour hand ${hourDescription}. Write the time.`;
  svg.append(title, description, svgElement('circle', { cx: 100, cy: 100, r: 94, class: 'clock-face' }));
  for (let tick = 0; tick < 60; tick += 1) {
    const angle = tick * Math.PI / 30;
    const inside = tick % 5 === 0 ? 83 : 88;
    svg.append(svgElement('line', {
      x1: 100 + Math.sin(angle) * inside,
      y1: 100 - Math.cos(angle) * inside,
      x2: 100 + Math.sin(angle) * 92,
      y2: 100 - Math.cos(angle) * 92,
      class: tick % 5 === 0 ? 'clock-hour-tick' : 'clock-minute-tick',
    }));
  }
  for (let hour = 1; hour <= 12; hour += 1) {
    const angle = hour * Math.PI / 6;
    const number = svgElement('text', {
      x: 100 + Math.sin(angle) * 74,
      y: 100 - Math.cos(angle) * 74,
      dy: '0.35em',
      'text-anchor': 'middle',
      class: 'clock-number',
    });
    number.textContent = String(hour);
    svg.append(number);
  }
  const hands = clockHandEndpoints(question.hour, question.minute);
  for (const kind of ['hour', 'minute']) {
    const { x1, y1, x2, y2 } = hands[kind];
    svg.append(svgElement('line', { x1, y1, x2, y2, class: `clock-${kind}-hand` }));
  }
  svg.append(svgElement('circle', { cx: 100, cy: 100, r: 4, class: 'clock-pin' }));
  return svg;
}

function sheetTitle(settings) {
  if (settings.activity === 'clock') {
    return settings.clock === 'hours' ? 'Read the clock: whole hours' : 'Read the clock: five-minute steps';
  }
  return settings.activity === 'division'
    ? `Exact division: divide by ${settings.table}`
    : `Multiplication: ${settings.table} times table`;
}

function renderSheet(sheet) {
  const { settings, questions } = sheet;
  worksheet.hidden = false;
  worksheet.dataset.activity = settings.activity;
  worksheet.dataset.count = String(questions.length);
  document.getElementById('worksheet-title').textContent = sheetTitle(settings);
  document.getElementById('worksheet-code').textContent =
    `${questions.length} questions · Sheet seed: ${settings.seed}`;
  document.getElementById('worksheet-instructions').textContent = settings.activity === 'clock'
    ? 'Write each time as hour:minutes. The short hand shows the hour; the long hand shows the minutes. No AM or PM is needed.'
    : settings.activity === 'division'
      ? 'Find each whole-number answer. There are no remainders. Check by multiplying your answer by the divisor.'
      : 'Find each product. Use equal groups, a drawing or a known fact if it helps.';

  const questionList = document.getElementById('worksheet-questions');
  const keyList = document.getElementById('answer-key-list');
  questionList.replaceChildren();
  keyList.replaceChildren();
  questions.forEach((question, index) => {
    const item = element('li', undefined, 'worksheet-question');
    item.append(element('span', `${index + 1}.`, 'worksheet-question-number'));
    if (question.kind === 'clock') item.append(clockGraphic(question, index + 1));
    else item.append(element('span', question.prompt, 'worksheet-equation'));
    const blank = element('span', undefined, 'worksheet-answer-space');
    blank.setAttribute('aria-label', 'Blank answer space');
    item.append(blank);
    questionList.append(item);
    keyList.append(element('li', question.kind === 'clock' ? question.answer : `${question.prompt} ${question.answer}`));
  });

  document.getElementById('answer-key-code').textContent =
    `${sheetTitle(settings)} · ${questions.length} questions · Sheet seed: ${settings.seed}`;
  answerKey.hidden = !includeKey.checked;
  document.getElementById('sheet-tools').hidden = false;
  printButton.disabled = false;
  copyButton.disabled = false;
  buildButton.disabled = false;
  freshButton.disabled = false;
  shareFallback.hidden = true;
  copyFeedback.textContent = '';
}

function applySettings(input, initialWarnings = []) {
  const sheet = generateWorksheet(input);
  const warnings = [...initialWarnings, ...sheet.warnings];
  setControls(sheet.settings);
  renderSheet(sheet);
  const query = settingsToSearch(sheet.settings);
  currentLink = `${location.origin}${location.pathname}?${query}`;
  shareLink.value = currentLink;
  try {
    if (location.search !== `?${query}` || location.hash) history.replaceState(null, '', `?${query}`);
  } catch {
    warnings.push('The address bar could not be updated. Use Copy sheet link to share the settings shown here.');
  }
  feedback(`${sheet.questions.length} unique questions ready. Take your time; there is no timer.`, warnings);
}

function markDirty() {
  updateActivityControls();
  printButton.disabled = true;
  copyButton.disabled = true;
  shareFallback.hidden = true;
  copyFeedback.textContent = '';
  feedback('Settings changed. Choose Build this sheet or Generate fresh sheet before printing or sharing.');
}

function freshSeed() {
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);
  return `sheet-${values[0].toString(36)}-${values[1].toString(36)}`;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  applySettings(readControls());
});
form.addEventListener('input', markDirty);
form.addEventListener('change', markDirty);
freshButton.addEventListener('click', () => {
  let seed;
  try {
    seed = freshSeed();
  } catch {
    feedback('A fresh sheet could not be generated because this browser could not create a random seed. Your existing sheet has not changed. Edit the Sheet seed and choose Build this sheet to make another worksheet.');
    return;
  }
  const settings = readControls();
  settings.seed = seed;
  applySettings(settings);
});
includeKey.addEventListener('change', () => {
  answerKey.hidden = !includeKey.checked;
});
printButton.addEventListener('click', () => window.print());
copyButton.addEventListener('click', async () => {
  const linkToCopy = currentLink;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(linkToCopy);
    if (linkToCopy !== currentLink) return;
    shareFallback.hidden = true;
    copyFeedback.textContent = 'Sheet link copied. It contains activity settings and the seed, not answers or learner information.';
  } catch {
    if (linkToCopy !== currentLink) return;
    copyFeedback.textContent = 'The link could not be copied automatically. Select the link below and copy it yourself.';
    shareFallback.hidden = false;
    shareLink.focus();
    shareLink.select();
  }
});
window.addEventListener('popstate', () => {
  const parsed = parseSettings(location.search);
  applySettings(parsed.settings, parsed.warnings);
});

const parsed = parseSettings(location.search);
applySettings(parsed.settings, parsed.warnings);
