import {
  QUESTION_COUNTS,
  clockHandEndpoints,
  generateWorksheet,
  isAcademyPaper,
  parseSettings,
  settingsToSearch,
} from './worksheet-generator.mjs';

const form = document.getElementById('worksheet-settings');
const activityControl = document.getElementById('activity');
const tableControl = document.getElementById('table');
const clockControl = document.getElementById('clock-step');
const levelControl = document.getElementById('level');
const gradeControl = document.getElementById('academy-grade');
const chapterControl = document.getElementById('academy-chapter');
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
const sourceNote = document.getElementById('sheet-source');
const ARITHMETIC_LEVEL_LABELS = {
  1: 'Level 1: numbers within 20',
  2: 'Level 2: two-digit numbers within 100',
  3: 'Level 3: three-digit numbers within 1,000',
};
const ACADEMY_LEVEL_LABELS = {
  1: 'Level 1: Explore',
  2: 'Level 2: Reason',
  3: 'Level 3: Stretch',
  all: 'All three levels mixed',
};
let currentLink = '';
let academyModule = null;
let academyLoading = null;
let latestBuild = 0;
let chapterGrade = null;

let styleLoading = null;

function loadAcademyStyle() {
  styleLoading ??= new Promise((resolve, reject) => {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = '/css/space-academy.css';
    style.addEventListener('load', resolve);
    style.addEventListener('error', () => {
      style.remove();
      reject(new Error('The Space Academy picture styles could not be loaded.'));
    });
    document.head.append(style);
  });
  styleLoading.catch(() => { styleLoading = null; });
  return styleLoading;
}

let importAttempts = 0;

function loadAcademy() {
  academyLoading ??= (async () => {
    // The question banks and diagram art are large, so they load only when a Space Academy sheet is chosen.
    // Browsers can remember a failed module URL, so a retry asks for a distinct URL.
    const target = importAttempts ? `./worksheet-academy.mjs?retry=${importAttempts}` : './worksheet-academy.mjs';
    importAttempts += 1;
    const [module] = await Promise.all([import(target), loadAcademyStyle()]);
    academyModule = module;
    return module;
  })();
  academyLoading.catch(() => { academyLoading = null; });
  return academyLoading;
}

function fillChapters(selected) {
  if (!academyModule) return;
  const grade = academyModule.academyCatalog().find(item => item.id === gradeControl.value);
  const options = [new Option('Mixed chapters', 'mixed')];
  if (grade.paper) {
    options.push(new Option(`Full practice paper (${grade.id === 'class-5' ? 50 : 35} questions)`, 'paper'));
  }
  for (const chapter of grade.chapters) options.push(new Option(chapter.title, chapter.id));
  chapterControl.replaceChildren(...options);
  chapterControl.value = options.some(option => option.value === selected) ? selected : 'mixed';
}

function fillLevels(academy) {
  const labels = academy ? ACADEMY_LEVEL_LABELS : ARITHMETIC_LEVEL_LABELS;
  const options = Object.entries(labels).map(([value, text]) => new Option(text, value));
  const selected = levelControl.value;
  levelControl.replaceChildren(...options);
  levelControl.value = options.some(option => option.value === selected) ? selected : '1';
}

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
  const activity = activityControl.value;
  const academy = activity === 'academy';
  const arithmetic = activity === 'addition' || activity === 'subtraction';
  const tables = activity === 'multiplication' || activity === 'division';
  const clocks = activity === 'clock';
  const show = (id, control, visible) => {
    document.getElementById(id).hidden = !visible;
    control.disabled = !visible;
  };
  show('table-field', tableControl, tables);
  show('clock-field', clockControl, clocks);
  show('level-field', levelControl, arithmetic || academy);
  show('grade-field', gradeControl, academy);
  show('chapter-field', chapterControl, academy);
  fillLevels(academy);
  if (academy && !academyModule) {
    loadAcademy().then(() => {
      if (activityControl.value !== 'academy') return;
      fillChapters(chapterControl.value);
      chapterGrade = gradeControl.value;
      updateActivityControls();
    }, error => {
      if (activityControl.value !== 'academy') return;
      buildButton.disabled = false;
      feedback(`Space Academy options could not be loaded. ${error.message} Check your connection, then choose Build this sheet to try again. Your existing sheet has not changed.`);
    });
  } else if (academy && chapterGrade !== gradeControl.value) {
    fillChapters(chapterControl.value);
    chapterGrade = gradeControl.value;
  }
  const paper = academy && chapterControl.value === 'paper';
  document.getElementById('count-field').hidden = paper;
  countControl.disabled = paper;
  document.getElementById('table-label').textContent = activity === 'division' ? 'Divide by' : 'Times table';
  document.getElementById('level-label').textContent = academy ? 'Challenge level' : 'Number size';
  document.getElementById('level-help').textContent = academy
    ? 'Explore builds an idea, Reason connects clues and Stretch asks for higher-order thinking. All levels mixes them.'
    : 'About half of the questions need carrying or borrowing. Level 2 uses the 10 to 50 numbers of our Math Speed Quiz.';
  document.getElementById('count-help').textContent = {
    'multiplication-array': 'There are 16 different pictured questions. A request for 20 is reduced to 12, without repeats.',
    'division-groups': 'There are 25 different pictured sharing questions, so every count up to 20 avoids repeats.',
    addition: 'Each sheet seed makes new questions without repeats.',
    subtraction: 'Each sheet seed makes new questions without repeats.',
    academy: 'Different questions from the chosen grade, chapter and level. A full practice paper has a fixed length.',
  }[activity] ?? (clocks && clockControl.value === 'five-minutes'
    ? 'Up to 20 different times, with no repeated clock on a sheet.'
    : 'There are 12 different questions. A request for 20 is reduced to 12, without repeats.');
}

function setControls(settings) {
  activityControl.value = settings.activity;
  gradeControl.value = settings.grade;
  fillLevels(settings.activity === 'academy');
  levelControl.value = String(settings.level);
  if (academyModule) {
    fillChapters(settings.chapter);
    chapterGrade = gradeControl.value;
  }
  tableControl.value = String(settings.table);
  clockControl.value = settings.clock;
  if (QUESTION_COUNTS.includes(settings.count)) countControl.value = String(settings.count);
  seedControl.value = settings.seed;
  updateActivityControls();
}

function readControls() {
  const activity = activityControl.value;
  const input = { activity, count: countControl.value, seed: seedControl.value };
  if (activity === 'clock') input.clock = clockControl.value;
  if (activity === 'multiplication' || activity === 'division') input.table = tableControl.value;
  if (['addition', 'subtraction', 'academy'].includes(activity)) input.level = levelControl.value;
  if (activity === 'academy') Object.assign(input, { grade: gradeControl.value, chapter: chapterControl.value });
  return input;
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

function counterRow(parent, count, left, top, columns, spacing) {
  for (let index = 0; index < count; index += 1) {
    parent.append(svgElement('circle', {
      cx: left + (index % columns) * spacing + spacing / 2,
      cy: top + Math.floor(index / columns) * spacing + spacing / 2,
      r: 6.5,
      class: 'picture-counter',
    }));
  }
}

function groupsGraphic(question, index) {
  const { groups, each } = question.visual;
  const spacing = 18;
  const width = each * spacing + 12;
  const height = groups * (spacing + 10);
  const svg = svgElement('svg', {
    viewBox: `0 0 ${width} ${height}`,
    width,
    class: 'worksheet-picture-art',
    role: 'img',
    'aria-label': `Question ${index}: ${groups} groups with ${each} counters in each group.`,
  });
  for (let row = 0; row < groups; row += 1) {
    svg.append(svgElement('rect', {
      x: 1, y: row * (spacing + 10) + 1, width: width - 2, height: spacing + 6, rx: 9, class: 'picture-group',
    }));
    counterRow(svg, each, 6, row * (spacing + 10) + 4, each, spacing);
  }
  return svg;
}

function sharingGraphic(question, index) {
  const { total, friends } = question.visual;
  const spacing = 18;
  const columns = 10;
  const pileRows = Math.ceil(total / columns);
  const plateTop = pileRows * spacing + 16;
  const plateWidth = 44;
  const width = Math.max(columns * spacing, friends * (plateWidth + 8));
  const svg = svgElement('svg', {
    viewBox: `0 0 ${width} ${plateTop + 38}`,
    width,
    class: 'worksheet-picture-art',
    role: 'img',
    'aria-label': `Question ${index}: ${total} counters in one pile and ${friends} empty plates for ${friends} friends.`,
  });
  counterRow(svg, total, 0, 0, columns, spacing);
  for (let friend = 0; friend < friends; friend += 1) {
    svg.append(svgElement('ellipse', {
      cx: friend * (plateWidth + 8) + plateWidth / 2 + 2, cy: plateTop + 18, rx: plateWidth / 2, ry: 16, class: 'picture-plate',
    }));
  }
  return svg;
}

const ARITHMETIC_TITLES = { 1: 'numbers within 20', 2: 'numbers within 100', 3: 'numbers within 1,000' };

function sheetTitle(sheet) {
  const { settings } = sheet;
  if (settings.activity === 'clock') {
    return settings.clock === 'hours' ? 'Read the clock: whole hours' : 'Read the clock: five-minute steps';
  }
  if (settings.activity === 'academy') {
    const { grade, title, paper, readiness } = sheet.heading;
    return paper ? `${grade} Olympiad-style practice paper` : `${grade} ${readiness ? 'picture practice' : 'practice'}: ${title}`;
  }
  if (settings.activity === 'addition' || settings.activity === 'subtraction') {
    return `${settings.activity === 'addition' ? 'Addition' : 'Subtraction'}: ${ARITHMETIC_TITLES[settings.level]}`;
  }
  if (settings.activity === 'multiplication-array') return 'Multiplication with equal-group pictures';
  if (settings.activity === 'division-groups') return 'Division with sharing pictures';
  return settings.activity === 'division'
    ? `Exact division: divide by ${settings.table}`
    : `Multiplication: ${settings.table} times table`;
}

const INSTRUCTIONS = {
  clock: 'Write each time as hour:minutes. The short hand shows the hour; the long hand shows the minutes. No AM or PM is needed.',
  division: 'Find each whole-number answer. There are no remainders. Check by multiplying your answer by the divisor.',
  multiplication: 'Find each product. Use equal groups, a drawing or a known fact if it helps.',
  addition: 'Add the numbers. Use a number line, objects or a column on paper if it helps.',
  subtraction: 'Subtract to find the difference. Check by adding your answer to the smaller number.',
  'multiplication-array': 'Each picture shows equal groups. Count how many are in each group and find how many counters there are altogether.',
  'division-groups': 'Share the counters equally between the plates. Write how many counters each friend gets. Nothing is left over.',
};

function academyInstructions(sheet) {
  if (sheet.heading.readiness) {
    return 'Look carefully at each picture and circle the letter of the best answer. This is readiness practice, not an exam.';
  }
  return sheet.heading.paper
    ? 'Choose the best answer for every question and circle its letter. Original Otterly practice in an Olympiad style; it is not an official paper from any competition organiser.'
    : 'Circle the letter of the best answer. The questions are original Space Academy practice.';
}

function levelText(settings) {
  if (settings.activity === 'academy') return ACADEMY_LEVEL_LABELS[settings.level];
  return ['addition', 'subtraction'].includes(settings.activity) ? ARITHMETIC_LEVEL_LABELS[settings.level] : '';
}

function pictureQuestion(question, index) {
  const caption = question.kind === 'groups'
    ? `${question.left} groups of counters`
    : `Share ${question.left} counters equally among ${question.right} friends`;
  const body = element('div', undefined, 'worksheet-picture-body');
  body.append(element('span', caption, 'worksheet-picture-caption'),
    question.kind === 'groups' ? groupsGraphic(question, index) : sharingGraphic(question, index));
  return body;
}

function renderSource(sheet) {
  const { settings } = sheet;
  const note = element('p');
  const link = (text, href) => {
    const anchor = element('a', text);
    anchor.href = href;
    return anchor;
  };
  if (settings.activity === 'academy') {
    note.append(sheet.heading.readiness
      ? 'Picture readiness practice from Space Academy. It is not an exam and not an official paper. '
      : 'Original Space Academy practice with diagrams and picture choices. It is not an official paper from any competition organiser and not complete exam preparation. ',
    link('Open Space Academy', '/play/space-academy.html'), `. Choose ${sheet.heading.grade} and the matching topic in the game.`);
  } else if (['multiplication-array', 'division-groups'].includes(settings.activity)) {
    note.append('These pictures follow the equal-groups and sharing pictures in ', link('Math Tank', '/play/math-tank.html'), '.');
  } else if (['addition', 'subtraction'].includes(settings.activity)) {
    note.append('Ranges follow our ', link('Math Speed Quiz', '/tools/math-quiz.html'),
      '. Math Tank practises multiplication and division, so this sheet is Otterly practice, not a Math Tank mode.');
  } else if (settings.activity === 'clock') {
    note.append('Practise the same skill in ', link('Clock Master', '/play/clock-master.html'), '.');
  } else {
    note.append('Facts follow the questions in ', link('Math Tank', '/play/math-tank.html'), '.');
  }
  sourceNote.replaceChildren(note);
  sourceNote.hidden = false;
}

function renderSheet(sheet) {
  const { settings, questions } = sheet;
  const academy = settings.activity === 'academy';
  worksheet.hidden = false;
  worksheet.dataset.activity = settings.activity;
  worksheet.dataset.count = String(questions.length);
  worksheet.dataset.paper = String(isAcademyPaper(settings));
  document.getElementById('worksheet-title').textContent = sheetTitle(sheet);
  const level = levelText(settings);
  document.getElementById('worksheet-code').textContent =
    `${questions.length} questions${level ? ` · ${level}` : ''} · Sheet seed: ${settings.seed}`;
  document.getElementById('worksheet-instructions').textContent =
    academy ? academyInstructions(sheet) : INSTRUCTIONS[settings.activity];

  const questionList = document.getElementById('worksheet-questions');
  const keyList = document.getElementById('answer-key-list');
  questionList.replaceChildren();
  keyList.replaceChildren();
  let section = null;
  questions.forEach((question, index) => {
    if (academy && sheet.heading.paper && question.section !== section) {
      section = question.section;
      questionList.append(element('li', academyModule.SECTION_TITLES[section], 'worksheet-section-heading'));
    }
    const item = element('li', undefined, academy ? 'worksheet-question worksheet-mcq' : 'worksheet-question');
    const keyItem = element('li');
    if (academy) {
      item.innerHTML = academyModule.questionMarkup(question, index + 1);
      keyItem.innerHTML = `<span class="worksheet-key-number">${index + 1}.</span>${academyModule.answerMarkup(question)}`;
    } else {
      item.append(element('span', `${index + 1}.`, 'worksheet-question-number'));
      if (question.kind === 'clock') item.append(clockGraphic(question, index + 1));
      else if (question.visual) item.append(pictureQuestion(question, index + 1));
      if (question.kind !== 'clock') item.append(element('span', question.prompt, 'worksheet-equation'));
      const blank = element('span', undefined, 'worksheet-answer-space');
      blank.setAttribute('aria-label', 'Blank answer space');
      item.append(blank);
      keyItem.textContent = question.kind === 'clock' ? question.answer : `${question.prompt} ${question.answer}`;
    }
    questionList.append(item);
    keyList.append(keyItem);
  });

  document.getElementById('answer-key-code').textContent =
    `${sheetTitle(sheet)} · ${questions.length} questions · Sheet seed: ${settings.seed}`;
  answerKey.hidden = !includeKey.checked;
  document.getElementById('sheet-tools').hidden = false;
  printButton.disabled = false;
  copyButton.disabled = false;
  buildButton.disabled = false;
  freshButton.disabled = false;
  shareFallback.hidden = true;
  copyFeedback.textContent = '';
  renderSource(sheet);
}

function showSheet(sheet, initialWarnings) {
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

function applySettings(input, initialWarnings = []) {
  const build = latestBuild += 1;
  if (input.activity !== 'academy') {
    try {
      showSheet(generateWorksheet(input), initialWarnings);
    } catch (error) {
      feedback(`This sheet could not be built. ${error.message} Your existing sheet has not changed.`);
    }
    return undefined;
  }
  feedback('Loading Space Academy questions. No sheet has changed yet.');
  return loadAcademy().then(module => {
    if (build === latestBuild) showSheet(module.generateAcademyWorksheet(input), initialWarnings);
  }).catch(error => {
    if (build === latestBuild) {
      buildButton.disabled = false;
      feedback(`The Space Academy sheet could not be built. ${error.message} Choose Build this sheet to try again. Your existing sheet has not changed.`);
    }
  });
}

function markDirty() {
  latestBuild += 1;
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
