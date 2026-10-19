import { GRADES as ORIGINAL_GRADES, SKILLS as ORIGINAL_SKILLS } from './curriculum-v1.mjs';
import { MISCONCEPTIONS } from './bank-shared.mjs';
import { BANK3_MODULES } from './bank3-index.mjs';

export const CONTENT_VERSION = 3;
export const CONTENT_VERSIONS = [1, 2, 3];
// Banks 2 and 3 share one skill taxonomy and one feedback vocabulary, so their practice evidence is combined.
export const EVIDENCE_VERSIONS = [2, 3];
export const LEVELS = [
  { id: 1, name: 'Explore', description: 'Foundations: read a representation and practise the underlying idea.' },
  { id: 2, name: 'Reason', description: 'Paper-style reasoning: connect clues, interpret a diagram or work backwards.' },
  { id: 3, name: 'Stretch', description: 'Higher-order practice: link conditions, test statements and avoid a tempting wrong method.' },
];

export const SKILLS = {
  ...ORIGINAL_SKILLS,
  area: ['Area and composite shapes', 'Find the area of the whole and subtract missing parts. Boundary lengths and square units answer different questions.'],
  visual: ['Visual reasoning', 'Track the position, orientation and markings, not just the outline. Check every part of a picture.'],
  solids: ['Solids and nets', 'Follow which faces meet when folded. A face touching another in the net cannot be opposite it.'],
  calendar: ['Calendars', 'Read the weekday headings. A week has seven days; count intervals, not both endpoints.'],
  factors: ['Factors and multiples', 'Factors divide an amount exactly; multiples are repeated totals. Choose which idea the situation needs.'],
  routes: ['Routes and constraints', 'Follow only the allowed paths. At a junction, add the ways arriving from its incoming paths.'],
};

const family = (skill, title) => ({ skill, title });
export const FAMILIES_V2 = {
  count: family('count', 'Count a collection'),
  'count-target': family('count', 'Count selected objects in a mixed scene'),
  'collection-change': family('subtraction', 'Use a picture before and after a change'),
  'compare-groups': family('compare', 'Compare pictured groups'),
  'compare-after': family('compare', 'Compare groups after different changes'),
  'pattern-next': family('repeat', 'Continue a picture rule'),
  'pattern-gap': family('repeat', 'Find an internal missing picture'),
  'picture-analogy': family('visual', 'Transfer a picture transformation'),
  'odd-picture': family('odd', 'Find the exception to a stated rule'),
  'attribute-match': family('odd', 'Combine two picture properties'),
  'position-row': family('position', 'Locate an object in a row'),
  'position-swap': family('position', 'Track a swap and a neighbour'),
  'shape-match': family('shape', 'Match sides and corners'),
  'shape-count': family('shape', 'Count a shape within a scene'),
  'scene-statements': family('shape', 'Evaluate two picture statements'),
  'solid-properties': family('solids', 'Use properties of solid objects'),
  'abacus-read': family('place', 'Read an original abacus'),
  'abacus-change': family('place', 'Move a bead between place-value rods'),
  'abacus-combine': family('expand', 'Combine two abacus numbers'),
  'number-clues': family('place', 'Solve linked digit clues'),
  'number-build': family('expand', 'Build a number under a constraint'),
  'number-compare': family('compare', 'Compare number expressions'),
  'roman-number': family('expand', 'Interpret Roman numerals in a calculation'),
  'picture-add': family('addition', 'Translate a pictured addition'),
  'bar-unknown': family('mystery', 'Find an unknown part of a bar model'),
  'equal-groups': family('groups', 'Use equal groups and a change'),
  'sharing-remainder': family('sharing', 'Share with a stated remainder rule'),
  'two-stage': family('mystery', 'Reverse a two-stage story'),
  'symbol-equations': family('mystery', 'Link two pictorial equations'),
  'digit-algorithm': family('groups', 'Recover a digit in a written calculation'),
  'number-pattern': family('sequence', 'Find a number-rule gap'),
  'alternating-pattern': family('sequence', 'Separate two interleaved number rules'),
  'code-key': family('coding', 'Translate using a shown code key'),
  'code-infer': family('coding', 'Infer a code from matched words'),
  'mirror-grid': family('symmetry', 'Choose a reflected tile picture'),
  'rotate-grid': family('visual', 'Choose a rotated tile picture'),
  'figure-analogy': family('visual', 'Transfer an orientation rule'),
  'embedded-grid': family('visual', 'Locate a smaller pattern inside a larger one'),
  'symmetry-grid': family('symmetry', 'Check symmetry of a marked grid'),
  'cube-net': family('solids', 'Find opposite faces from a cube net'),
  'grid-boundary': family('perimeter', 'Count only exposed edges of a composite shape'),
  'rectangle-constraint': family('perimeter', 'Find an unknown length from a perimeter relation'),
  'shaded-area': family('area', 'Subtract an unshaded cut-out'),
  'area-inference': family('area', 'Infer a dimension before finding an area'),
  'angle-reason': family('angles', 'Use a straight angle or parallel-line relation'),
  'ruler-read': family('measure', 'Measure from a non-zero ruler mark'),
  'instrument-read': family('measure', 'Interpret graduated container marks'),
  'balance-missing': family('measure', 'Infer an unknown mass from a balanced scale'),
  'measure-change': family('measure', 'Combine measurements after a change'),
  'unit-combine': family('measure', 'Convert units before comparing or combining'),
  temperature: family('measure', 'Read a scale and follow temperature changes'),
  'clock-read': family('time', 'Read hour and minute hands'),
  'clock-options': family('time', 'Choose a clock after an elapsed time'),
  'time-chain': family('time', 'Link travel, a stop and an arrival'),
  'clock-error': family('time', 'Correct a fast or slow clock'),
  calendar: family('calendar', 'Reason with an original month calendar'),
  'coin-value': family('money', 'Combine pictured coin values'),
  'shopping-pair': family('money', 'Compare purchases on a price board'),
  'shopping-change': family('money', 'Find change after a linked purchase'),
  'shopping-budget': family('money', 'Choose a purchase satisfying a budget condition'),
  'fraction-picture': family('fraction-read', 'Read equal parts of a shaded grid'),
  'fraction-change': family('fraction-read', 'Work backwards from a shading condition'),
  'fraction-group': family('fraction-of', 'Find a fraction of a collection'),
  'fraction-left': family('fraction-of', 'Apply a second fraction to what remains'),
  'fraction-compare': family('fraction-compare', 'Compare fractions of equal wholes'),
  'fraction-statements': family('fraction-compare', 'Evaluate two statements about fraction pictures'),
  'decimal-model': family('decimals', 'Read a hundredths model'),
  'decimal-context': family('decimals', 'Use decimal quantities in a multi-stage situation'),
  'decimal-statements': family('decimals', 'Test decimal place-value and calculation statements'),
  pictograph: family('chart', 'Apply a pictograph key'),
  'chart-compare': family('chart', 'Compare information in a scaled graph'),
  'chart-update': family('chart', 'Transfer or change values before comparing'),
  'graph-parts': family('chart', 'Use two related results from a graph'),
  ranking: family('ranking', 'Combine ranks from opposite ends'),
  'ranking-change': family('ranking', 'Track a swap or a change in a queue'),
  directions: family('directions', 'Use a labelled map and compass'),
  'turn-route': family('directions', 'Track a route and relative turns'),
  'path-count': family('routes', 'Count directed routes through junctions'),
  'path-condition': family('routes', 'Count only routes passing a checkpoint'),
  combinations: family('combinations', 'Count pairs with an excluded combination'),
  'factor-compare': family('factors', 'Compare common factors and multiples'),
  'factor-application': family('factors', 'Choose HCF or LCM from a situation'),
};

// Each row is Explore / Reason / Stretch. Chapter IDs remain stable for old links.
const PLANS = {
  pp1: {
    counting: ['count', 'count-target', 'count-target collection-change'],
    patterns: ['pattern-next', 'pattern-gap', 'picture-analogy'],
    shapes: ['shape-match shape-count', 'shape-count', 'attribute-match'],
    sorting: ['odd-picture', 'attribute-match', 'picture-analogy'],
    position: ['position-row', 'position-row', 'position-swap'],
    comparing: ['compare-groups', 'compare-groups count-target', 'compare-after'],
  },
  pp2: {
    numbers: ['count-target number-pattern', 'abacus-read number-pattern', 'number-clues compare-after'],
    operations: ['picture-add collection-change', 'bar-unknown', 'two-stage'],
    patterns: ['pattern-next number-pattern', 'pattern-gap', 'picture-analogy alternating-pattern'],
    shapes: ['shape-match position-row', 'shape-count', 'scene-statements'],
    measurement: ['ruler-read compare-groups', 'instrument-read', 'balance-missing compare-after'],
    reasoning: ['odd-picture position-row', 'attribute-match position-swap', 'picture-analogy'],
  },
  'class-1': {
    numbers: ['abacus-read number-build', 'abacus-change number-compare', 'number-clues abacus-combine'],
    operations: ['picture-add collection-change', 'bar-unknown', 'two-stage symbol-equations'],
    patterns: ['pattern-next number-pattern', 'pattern-gap', 'alternating-pattern picture-analogy'],
    geometry: ['shape-match solid-properties', 'shape-count', 'scene-statements embedded-grid'],
    measurement: ['ruler-read', 'instrument-read measure-change', 'balance-missing measure-change'],
    time: ['clock-read', 'clock-options calendar', 'clock-options calendar'],
    money: ['coin-value', 'shopping-pair', 'shopping-change'],
    reasoning: ['odd-picture position-row', 'attribute-match ranking', 'position-swap picture-analogy'],
  },
  'class-2': {
    numbers: ['abacus-read number-build', 'abacus-change number-compare', 'number-clues abacus-combine'],
    operations: ['equal-groups sharing-remainder', 'bar-unknown two-stage', 'symbol-equations two-stage'],
    patterns: ['number-pattern code-key', 'pattern-gap code-key', 'alternating-pattern code-infer'],
    geometry: ['solid-properties mirror-grid', 'embedded-grid rotate-grid', 'scene-statements figure-analogy'],
    measurement: ['ruler-read instrument-read', 'balance-missing unit-combine', 'measure-change balance-missing'],
    time: ['clock-read calendar', 'clock-options time-chain', 'time-chain calendar'],
    money: ['coin-value shopping-pair', 'shopping-change', 'shopping-budget'],
    data: ['pictograph', 'chart-compare', 'chart-update'],
  },
  'class-3': {
    numbers: ['abacus-read number-build', 'abacus-change number-compare', 'number-clues number-build'],
    operations: ['equal-groups sharing-remainder', 'bar-unknown two-stage', 'symbol-equations digit-algorithm'],
    fractions: ['fraction-picture fraction-group', 'fraction-compare fraction-change', 'fraction-statements fraction-group'],
    geometry: ['solid-properties mirror-grid', 'embedded-grid grid-boundary', 'figure-analogy rectangle-constraint'],
    measurement: ['ruler-read instrument-read', 'unit-combine balance-missing', 'measure-change unit-combine'],
    time: ['clock-read calendar', 'clock-options time-chain', 'time-chain calendar'],
    money: ['shopping-pair coin-value', 'shopping-change', 'shopping-budget'],
    data: ['pictograph chart-compare', 'chart-update', 'graph-parts'],
    reasoning: ['ranking code-key directions', 'code-infer path-count mirror-grid turn-route', 'ranking-change path-condition combinations'],
  },
  'class-4': {
    numbers: ['number-build roman-number', 'number-clues abacus-change', 'number-clues number-compare'],
    operations: ['equal-groups sharing-remainder', 'two-stage digit-algorithm', 'symbol-equations digit-algorithm'],
    fractions: ['fraction-picture fraction-group', 'fraction-compare fraction-change', 'fraction-statements fraction-left'],
    geometry: ['grid-boundary symmetry-grid', 'rectangle-constraint figure-analogy', 'cube-net scene-statements rectangle-constraint'],
    measurement: ['ruler-read instrument-read', 'unit-combine balance-missing', 'temperature measure-change'],
    time: ['clock-read calendar', 'clock-options time-chain', 'time-chain calendar'],
    money: ['shopping-pair', 'shopping-change', 'shopping-budget'],
    data: ['chart-compare pictograph', 'chart-update', 'graph-parts'],
    reasoning: ['ranking code-key directions', 'code-infer figure-analogy path-count turn-route', 'ranking-change path-condition combinations'],
  },
  'class-5': {
    numbers: ['number-build roman-number', 'number-clues number-compare', 'number-clues abacus-change'],
    operations: ['equal-groups factor-compare', 'sharing-remainder factor-application', 'symbol-equations digit-algorithm factor-application'],
    fractions: ['fraction-picture fraction-group', 'fraction-compare fraction-change', 'fraction-left fraction-statements'],
    decimals: ['decimal-model', 'decimal-context', 'decimal-statements decimal-context'],
    geometry: ['grid-boundary shaded-area', 'rectangle-constraint angle-reason cube-net', 'area-inference embedded-grid angle-reason'],
    measurement: ['instrument-read unit-combine', 'balance-missing measure-change', 'temperature unit-combine'],
    time: ['clock-read calendar', 'time-chain clock-options', 'clock-error calendar'],
    money: ['shopping-pair', 'shopping-change', 'shopping-budget'],
    data: ['pictograph chart-compare', 'chart-update', 'graph-parts'],
    reasoning: ['ranking code-key directions', 'code-infer figure-analogy path-count turn-route', 'ranking-change path-condition combinations'],
  },
};

const DESCRIPTIONS = {
  counting: 'Read a picture carefully, select the objects that match, and track small changes.',
  patterns: 'Use repeating groups, internal gaps and picture rules; older grades also separate linked number rules.',
  shapes: 'Match sides and corners, find shapes in scenes and combine picture clues.',
  sorting: 'Sort by a stated property, then combine properties or transfer a picture rule.',
  position: 'Read a row from the stated end, track a swap and locate a neighbour.',
  comparing: 'Compare actual quantities, including what remains after a change.',
  numbers: 'Translate representations, use place value and solve constrained number clues.',
  operations: 'Interpret models, find unknown amounts and link operations instead of only calculating a total.',
  geometry: 'Read original figures, distinguish their properties and use the conditions shown in a diagram.',
  measurement: 'Read scales and rulers, compare like units and infer unknown measurements.',
  time: 'Connect clock hands, calendars and elapsed-time clues at the selected challenge level.',
  money: 'Use pictured values and price boards to compare purchases, change and budgets.',
  fractions: 'Read equal parts, compare the same whole and reason about a changed or remaining quantity.',
  decimals: 'Connect hundredths models to decimal quantities and check multi-part statements.',
  data: 'Read keys and axes, update a data set and connect more than one result.',
  reasoning: 'Use visual rules, codes, order or routes, with every stated condition applied.',
};

function buildGrades(plans, families, extra = () => ({})) {
  return ORIGINAL_GRADES.map(grade => ({
    ...grade,
    ...extra(grade),
    description: grade.year < 1 ? grade.description : `${grade.label} foundations, paper-style reasoning and higher-order challenges, with original diagrams and picture choices.`,
    chapters: grade.chapters.map(chapter => {
      const levels = plans[grade.id][chapter.id].map(row => row.split(' '));
      for (const id of levels.flat()) if (!families[id]) throw new Error(`Unknown Academy question family: ${id}`);
      return {
        ...chapter, description: DESCRIPTIONS[chapter.id],
        skills: [...new Set(levels.flat().map(id => families[id].skill))], families: levels,
      };
    }),
    paperReferences: grade.year < 1 ? [{
      title: `CREST ${grade.id === 'pp1' ? 'Junior' : 'Senior'} KG sample (readiness reference, not a SOF level)`,
      kind: 'sample',
      url: `https://www.crestolympiads.com/maths-olympiad-cmo-sample-papers-${grade.id === 'pp1' ? 'junior' : 'senior'}-kg`,
    }] : [{
      title: `SOF IMO Class ${grade.year} sample, 2026-27`,
      kind: 'sample',
      url: `https://sofworld.org/imo/class-${grade.year}/sample-model-test-papers/imo-sample-papers-class-${grade.year}`,
    }, {
      title: `CREST CMO Class ${grade.year} previous-year paper, 2023-24 Set A`,
      kind: 'past-paper',
      url: `https://www.crestolympiads.com/maths-olympiad-cmo-previous-year-class-${grade.year}`,
    }],
  }));
}

export const GRADES_V2 = buildGrades(PLANS, FAMILIES_V2);

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const filled = value => typeof value === 'string' && value.trim().length > 0;

// Merges grade modules into version 2's families, plans and feedback codes. A grade without a module keeps its version 2 plan.
export function assembleBank3(modules = BANK3_MODULES) {
  const families = { ...FAMILIES_V2 };
  const misconceptions = { ...MISCONCEPTIONS };
  const plans = { ...PLANS };
  for (const [gradeId, module] of Object.entries(modules)) {
    const original = ORIGINAL_GRADES.find(grade => grade.id === gradeId);
    if (!original) throw new Error(`Question bank 3 has no grade ${gradeId}.`);
    for (const name of ['draft', 'solve', 'render']) {
      if (typeof module[name] !== 'function') throw new Error(`Bank 3 ${gradeId} must export ${name}().`);
    }
    for (const [id, entry] of Object.entries(module.FAMILIES ?? {})) {
      if (!id.startsWith(`${gradeId}-`) || !NAME.test(id) || families[id]) throw new Error(`Bank 3 family id is invalid or repeated: ${id}`);
      if (!SKILLS[entry?.skill] || !filled(entry.title)) throw new Error(`Bank 3 family ${id} needs an existing skill and a title.`);
      families[id] = { skill: entry.skill, title: entry.title };
    }
    for (const [code, entry] of Object.entries(module.MISCONCEPTIONS ?? {})) {
      if (!code.startsWith(`${gradeId}-`) || !NAME.test(code) || misconceptions[code]) throw new Error(`Bank 3 feedback code is invalid or repeated: ${code}`);
      if (!filled(entry?.title) || !filled(entry.message)) throw new Error(`Bank 3 feedback code ${code} needs a title and a message.`);
      misconceptions[code] = { title: entry.title, message: entry.message };
    }
    const plan = module.PLAN;
    if (!plan || Object.keys(plan).length !== original.chapters.length) throw new Error(`Bank 3 ${gradeId} must plan exactly the grade's chapters.`);
    for (const chapter of original.chapters) {
      const rows = plan[chapter.id];
      if (!Array.isArray(rows) || rows.length !== 3 || !rows.every(filled)) throw new Error(`Bank 3 ${gradeId}/${chapter.id} needs Explore, Reason and Stretch rows.`);
      for (const row of rows) {
        const ids = row.split(' ');
        if (new Set(ids).size !== ids.length) throw new Error(`Bank 3 ${gradeId}/${chapter.id} repeats a family within one row.`);
        for (const id of ids) {
          if (!FAMILIES_V2[id] && !module.FAMILIES?.[id]) throw new Error(`Bank 3 ${gradeId}/${chapter.id} uses an unknown family: ${id}`);
        }
      }
    }
    plans[gradeId] = plan;
  }
  const grades = buildGrades(plans, families, grade => modules[grade.id] && grade.year < 0 ? { choices: 3 } : {});
  return { families, misconceptions, plans, grades, modules };
}

export const BANK3 = assembleBank3();
export const FAMILIES = BANK3.families;
export const GRADES = BANK3.grades;
export const ALL_MISCONCEPTIONS = BANK3.misconceptions;

export function getGrade(id, contentVersion = CONTENT_VERSION) {
  if (!CONTENT_VERSIONS.includes(contentVersion)) throw new RangeError(`Unsupported Academy question-bank version: ${contentVersion}`);
  const grade = (contentVersion === 1 ? ORIGINAL_GRADES : contentVersion === 2 ? GRADES_V2 : GRADES).find(item => item.id === id);
  if (!grade) throw new RangeError(`Unknown Academy grade: ${id}`);
  return grade;
}

export function getChapter(gradeId, chapterId, contentVersion = CONTENT_VERSION) {
  const chapter = getGrade(gradeId, contentVersion).chapters.find(item => item.id === chapterId);
  if (!chapter) throw new RangeError(`Unknown Academy chapter: ${gradeId}/${chapterId}`);
  return chapter;
}

export function chapterRoute(gradeId, chapterId) {
  getChapter(gradeId, chapterId);
  return `/learn/olympiad/${gradeId}/${chapterId}.html`;
}

export function gameLink({ grade = 'class-1', chapter, level = 1, mode = 'chapter', seed, contentVersion = CONTENT_VERSION } = {}) {
  const chosen = getGrade(grade, contentVersion);
  if (!LEVELS.some(item => item.id === level)) throw new RangeError('Choose an Academy challenge level from 1 to 3.');
  if (!['chapter', 'mixed', 'paper'].includes(mode)) throw new RangeError('Unknown Academy mission mode.');
  if (mode !== 'chapter' && chapter != null) throw new RangeError('Mixed missions and practice papers do not use a chapter setting.');
  if (mode === 'paper' && chosen.year < 1) throw new RangeError('Pre-primary missions are not exam papers.');
  const query = new URLSearchParams({ grade, mode, level: String(level), bank: String(contentVersion) });
  if (mode === 'chapter') {
    const selected = getChapter(grade, chapter ?? chosen.chapters[0].id, contentVersion);
    query.set('chapter', selected.id);
  }
  if (seed !== undefined) {
    if (typeof seed !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(seed)) throw new RangeError('A mission seed needs 1-40 letters, numbers, hyphens or underscores.');
    query.set('seed', seed);
  }
  return `/play/space-academy.html?${query}`;
}
