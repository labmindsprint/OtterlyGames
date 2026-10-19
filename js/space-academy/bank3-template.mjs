// Reference shape for a question bank 3 grade module. A real grade copies this file to bank3-<grade>.mjs.
// A module imports only bank-shared.mjs, diagram-kit.mjs and its own helpers: never curriculum, questions, art or app.
// This template is not part of the game; it only demonstrates the contract and exercises the shared battery.
import { MISCONCEPTIONS as SHARED, QuestionRetry, answerChoices, choiceCount, wrong } from './bank-shared.mjs';
import { GREEN, ORANGE, PAPER, circle, line, rect, svg, text } from './diagram-kit.mjs';

// Family ids start with the grade id. Each needs an existing skill key and a short title shown on the discovery pages.
export const FAMILIES = {
  'class-2-shelf-rows': { skill: 'groups', title: 'Equal shelves of books' },
  'class-2-bar-gap': { skill: 'chart', title: 'Compare two bars in a graph' },
  'class-2-dot-groups': { skill: 'groups', title: 'Pick the picture with matching groups' },
};

// Feedback codes also start with the grade id; the module may use the shared version 2 codes as well.
export const MISCONCEPTIONS = {
  'class-2-added-groups': { title: 'Equal groups', message: 'Equal groups are multiplied: the number of groups times the size of each group.' },
  'class-2-read-height': { title: 'Reading a bar', message: 'Read how high each bar reaches, not where it sits in the row.' },
  'class-2-extra-group': { title: 'Counting the groups', message: 'Count the groups first, then count the dots inside one group.' },
};
const KNOWN = { ...SHARED, ...MISCONCEPTIONS };

// Exactly the grade's chapters; each has an Explore, a Reason and a Stretch row of space-separated family ids.
export const PLAN = {
  numbers: ['abacus-read number-build', 'abacus-change number-compare', 'number-clues abacus-combine'],
  operations: ['equal-groups class-2-shelf-rows class-2-dot-groups', 'bar-unknown two-stage', 'symbol-equations two-stage'],
  patterns: ['number-pattern code-key', 'pattern-gap code-key', 'alternating-pattern code-infer'],
  geometry: ['solid-properties mirror-grid', 'embedded-grid rotate-grid', 'scene-statements figure-analogy'],
  measurement: ['ruler-read instrument-read', 'balance-missing unit-combine', 'measure-change balance-missing'],
  time: ['clock-read calendar', 'clock-options time-chain', 'time-chain calendar'],
  money: ['coin-value shopping-pair', 'shopping-change', 'shopping-budget'],
  data: ['pictograph class-2-bar-gap', 'chart-compare', 'chart-update'],
};

// A picture is plain data plus an accessible description; render() draws it later and solve() reads it.
const dots = (groups, size) => ({
  kind: 'v3-class-2-dots', groups, size,
  description: `${groups} groups with ${size} dots in each group.`,
});
const groupKey = (groups, size) => `${groups} groups of ${size}`;

// Variable data and the theme sit in the prompt: the game avoids repeating a prompt inside one mission.
const HOLDERS = [['shelves', 'books'], ['trays', 'buns'], ['boxes', 'pens'], ['baskets', 'apples'], ['jars', 'marbles']];

export function draft(family, grade, level, r) {
  const count = choiceCount(grade);
  if (family === 'class-2-shelf-rows') {
    const [holder, thing] = r.pick(HOLDERS);
    const groups = r.int(3, level === 1 ? 6 : 9);
    const each = r.int(2, level === 1 ? 6 : 9);
    const total = groups * each;
    return {
      family, prompt: `${groups} ${holder} hold ${each} ${thing} each. How many ${thing} are there?`, answer: String(total),
      hint: `Equal ${holder} mean equal groups.`,
      explanation: `${groups} groups of ${each}: ${groups} x ${each} = ${total}.`,
      proof: { family, givens: { groups, each } },
      choices: answerChoices(total, [
        wrong(groups + each, 'class-2-added-groups'), wrong(total + each, 'missing-step'),
        wrong(total - groups, 'wrong-operation'), wrong(total + groups, 'missing-step'),
      ], count, null, KNOWN),
    };
  }
  if (family === 'class-2-bar-gap') {
    const labels = r.shuffle(['Cats', 'Dogs', 'Fish', 'Birds', 'Frogs']).slice(0, 4);
    const values = r.shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 4);
    const [high, low] = r.shuffle([0, 1, 2, 3]).slice(0, 2).sort((a, b) => values[b] - values[a]);
    const answer = values[high] - values[low];
    return {
      family, prompt: `How many more children chose ${labels[high]} than ${labels[low]}?`, answer: String(answer),
      hint: 'Find both bars, then compare the heights.',
      explanation: `${labels[high]} is ${values[high]} and ${labels[low]} is ${values[low]}: ${values[high]} - ${values[low]} = ${answer}.`,
      proof: { family, givens: { high, low } },
      visual: {
        kind: 'v3-class-2-bars', labels, values,
        description: `Bar graph of favourite pets. ${labels.map((label, index) => `${label} ${values[index]}`).join(', ')}.`,
      },
      choices: answerChoices(answer, [
        wrong(values[high] + values[low], 'graph-difference'), wrong(values[high], 'class-2-read-height'),
        wrong(values[low], 'class-2-read-height'), wrong(answer + 1, 'missing-step'),
      ], count, null, KNOWN),
    };
  }
  if (family === 'class-2-dot-groups') {
    const groups = r.int(2, 4);
    const size = r.int(2, 7);
    // A QuestionRetry asks the game to draw this family again with new numbers.
    if (size === groups) throw new QuestionRetry('The groups and the dots would look alike.');
    return {
      family, prompt: `Which picture shows ${groups} groups with ${size} dots in each group?`, answer: groupKey(groups, size),
      hint: 'Count the groups, then the dots in one group.',
      explanation: `${groups} groups, each with ${size} dots.`,
      proof: { family, givens: { groups, size } },
      choices: answerChoices(groupKey(groups, size), [
        wrong(groupKey(groups + 1, size), 'class-2-extra-group', dots(groups + 1, size)),
        wrong(groupKey(groups - 1, size), 'class-2-extra-group', dots(groups - 1, size)),
        wrong(groupKey(groups, size + 1), 'included-extra', dots(groups, size + 1)),
        wrong(groupKey(groups, size - 1), 'missed-object', dots(groups, size - 1)),
      ], count, dots(groups, size), KNOWN),
    };
  }
  throw new Error(`Unknown class-2 family: ${family}`);
}

// solve() must recompute the answer from the picture or the givens alone, never from question.answer.
export function solve(question) {
  const { givens } = question.proof;
  if (question.family === 'class-2-shelf-rows') return String(givens.groups * givens.each);
  if (question.family === 'class-2-bar-gap') {
    if (question.visual?.kind !== 'v3-class-2-bars') throw new Error('The bar question lost its graph.');
    return String(question.visual.values[givens.high] - question.visual.values[givens.low]);
  }
  if (question.family === 'class-2-dot-groups') {
    // Every picture choice has to match its own label, or a wrong claim could pass unnoticed.
    question.optionVisuals.forEach((visual, index) => {
      if (visual?.kind !== 'v3-class-2-dots' || groupKey(visual.groups, visual.size) !== question.options[index]) throw new Error('A picture choice does not match its label.');
    });
    return groupKey(givens.groups, givens.size);
  }
  throw new Error(`Unknown class-2 family: ${question.family}`);
}

// render() returns the svg() wrapper from diagram-kit. Keep text at 16+ units in main pictures and 14+ in choices.
export function render(visual) {
  if (visual.kind === 'v3-class-2-bars') {
    let body = line(50, 200, 360, 200) + line(50, 30, 50, 200);
    for (let tick = 2; tick <= 10; tick += 2) {
      body += line(46, 200 - tick * 16, 360, 200 - tick * 16, { stroke: '#d8d3c4', width: 1 }) + text(38, 206 - tick * 16, String(tick), { size: 16, anchor: 'end' });
    }
    visual.labels.forEach((label, index) => {
      const x = 66 + index * 74;
      body += rect(x, 200 - visual.values[index] * 16, 46, visual.values[index] * 16, { fill: index % 2 ? ORANGE : GREEN, rx: 3 }) + text(x + 23, 226, label, { size: 16 });
    });
    return svg(body, visual.description, 380, 240);
  }
  if (visual.kind === 'v3-class-2-dots') {
    let body = '';
    for (let group = 0; group < visual.groups; group++) {
      const x = 28 + group * 40;
      body += circle(x, 40, 18, { fill: PAPER });
      for (let dot = 0; dot < visual.size; dot++) {
        const angle = dot / visual.size * Math.PI * 2 - Math.PI / 2;
        body += circle((x + Math.cos(angle) * 9).toFixed(1), (40 + Math.sin(angle) * 9).toFixed(1), 3, { fill: ORANGE, strokeWidth: 1 });
      }
    }
    return svg(body, visual.description, 210, 80);
  }
  throw new Error(`Unsupported class-2 diagram: ${visual.kind}`);
}
