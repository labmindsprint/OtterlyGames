// Shared helpers for the question-bank gap families (Class 2 to 5 reasoning and geometry, Class 4 numbers, PP2 time).
// Everything here is data-driven: a figure is a list of unit line segments on a dot lattice, and every answer is recomputed from it.
import { QuestionRetry, answerChoices, wrong } from './bank-shared.mjs';
import { INK, circle, line, text } from './diagram-kit.mjs';

export const retrying = draft => (family, grade, level, r) => {
  let last;
  for (let tries = 0; tries < 60; tries++) {
    try {
      return draft(family, grade, level, r);
    } catch (error) {
      if (!(error instanceof QuestionRetry)) throw error;
      last = error;
    }
  }
  throw last;
};

export const ordinal = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
export const pluralOf = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const sentence = text => text.charAt(0).toUpperCase() + text.slice(1);

// Builds a question object in the shape every bank-3 engine returns.
export function build({ family, known, count, prompt, answer, wrongs, hint, explanation, givens, visual = null, correctVisual = null }) {
  return {
    family, prompt, answer: String(answer), hint, explanation,
    proof: { family, givens }, ...(visual ? { visual } : {}),
    choices: answerChoices(answer, wrongs.map(item => wrong(item.value, item.code, item.visual ?? null)), count, correctVisual, known),
  };
}

// ---------------------------------------------------------------------------
// Line figures on a dot lattice. "h3,1" is the unit line from dot (3,1) to (4,1); "v3,1" runs from (3,1) down to (3,2).
// ---------------------------------------------------------------------------
export const hEdge = (x, y) => `h${x},${y}`;
export const vEdge = (x, y) => `v${x},${y}`;
const parse = edge => {
  const [x, y] = edge.slice(1).split(',').map(Number);
  return { kind: edge[0], x, y };
};
const make = (kind, x, y) => (kind === 'h' ? hEdge(x, y) : vEdge(x, y));

export function walk(...points) {
  const edges = [];
  for (let index = 1; index < points.length; index++) {
    const [x1, y1] = points[index - 1];
    const [x2, y2] = points[index];
    for (let x = Math.min(x1, x2); x < Math.max(x1, x2); x++) edges.push(hEdge(x, y1));
    for (let y = Math.min(y1, y2); y < Math.max(y1, y2); y++) edges.push(vEdge(x1, y));
  }
  return edges;
}
export const boxEdges = (x, y, w, h) => walk([x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]);
export const union = (...lists) => [...new Set(lists.flat())];

export function shift(edges, dx, dy) {
  return edges.map(edge => {
    const p = parse(edge);
    return make(p.kind, p.x + dx, p.y + dy);
  });
}
export function normalise(edges) {
  const points = edges.map(parse);
  return shift(edges, -Math.min(...points.map(p => p.x)), -Math.min(...points.map(p => p.y)));
}
export const canon = edges => [...new Set(normalise(edges))].sort().join(' ');
export function extent(edges) {
  const points = edges.map(parse);
  return {
    width: Math.max(...points.map(p => p.x + (p.kind === 'h' ? 1 : 0))) - Math.min(...points.map(p => p.x)),
    height: Math.max(...points.map(p => p.y + (p.kind === 'v' ? 1 : 0))) - Math.min(...points.map(p => p.y)),
  };
}

const turnEdge = edge => {
  const p = parse(edge);
  return p.kind === 'h' ? vEdge(-p.y, p.x) : hEdge(-p.y - 1, p.x);
};
const flipEdge = edge => {
  const p = parse(edge);
  return p.kind === 'h' ? hEdge(-p.x - 1, p.y) : vEdge(-p.x, p.y);
};
export const turnedCopy = edges => normalise(edges.map(turnEdge));
export const flippedCopy = edges => normalise(edges.map(flipEdge));
export function turnedCopies(edges) {
  const copies = [];
  let current = edges;
  for (let index = 0; index < 4; index++) {
    current = turnedCopy(current);
    copies.push(current);
  }
  return copies;
}

export function fitsPlain(small, big) {
  const bigSet = new Set(big);
  const first = parse(small[0]);
  return big.some(edge => {
    const target = parse(edge);
    if (target.kind !== first.kind) return false;
    const dx = target.x - first.x;
    const dy = target.y - first.y;
    return small.every(item => {
      const p = parse(item);
      return bigSet.has(make(p.kind, p.x + dx, p.y + dy));
    });
  });
}
// A small figure is hidden when some copy of it sits exactly on lines of the big figure.
export const fits = (small, big, turning = false) =>
  fitsPlain(small, big) || (turning && turnedCopies(small).some(copy => fitsPlain(copy, big)));

export function countRectangles(edges, cols, rows) {
  const set = new Set(edges);
  let squares = 0;
  let others = 0;
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      for (let w = 1; x + w <= cols; w++) {
        for (let h = 1; y + h <= rows; h++) {
          let whole = true;
          for (let i = 0; i < w && whole; i++) whole = set.has(hEdge(x + i, y)) && set.has(hEdge(x + i, y + h));
          for (let j = 0; j < h && whole; j++) whole = set.has(vEdge(x, y + j)) && set.has(vEdge(x + w, y + j));
          if (whole) {
            if (w === h) squares++;
            else others++;
          }
        }
      }
    }
  }
  return { squares, others };
}

export function describeEdges(edges) {
  const lines = [...new Set(edges)].sort().map(edge => {
    const p = parse(edge);
    return p.kind === 'h' ? `(${p.x},${p.y}) to (${p.x + 1},${p.y})` : `(${p.x},${p.y}) to (${p.x},${p.y + 1})`;
  });
  return `${lines.length} short lines on dots, as (across, down): ${lines.join('; ')}`;
}

export function drawEdges(edges, { x = 0, y = 0, cell = 40, cols, rows, stroke = INK, width = 5, dot = 3 } = {}) {
  let body = '';
  for (let i = 0; i <= cols; i++) for (let j = 0; j <= rows; j++) body += circle(x + i * cell, y + j * cell, dot, { fill: '#9a9283', stroke: '#9a9283', strokeWidth: 0 });
  for (const edge of [...new Set(edges)].sort()) {
    const p = parse(edge);
    body += p.kind === 'h'
      ? line(x + p.x * cell, y + p.y * cell, x + (p.x + 1) * cell, y + p.y * cell, { stroke, width })
      : line(x + p.x * cell, y + p.y * cell, x + p.x * cell, y + (p.y + 1) * cell, { stroke, width });
  }
  return body;
}

// A figure is centred in a width by height picture; the cell size shrinks so it always fits.
export function drawCentred(edges, { width, height, maxCell = 60, margin = 20, strokeWidth = 5 } = {}) {
  const size = extent(edges);
  const cell = Math.min(maxCell, Math.floor((width - margin * 2) / Math.max(size.width, 1)), Math.floor((height - margin * 2) / Math.max(size.height, 1)));
  const normal = normalise(edges);
  return drawEdges(normal, {
    x: Math.round((width - size.width * cell) / 2), y: Math.round((height - size.height * cell) / 2),
    cell, cols: size.width, rows: size.height, width: strokeWidth,
  });
}

export const label = (x, y, value, size = 18) => text(x, y, value, { size });

// ---------------------------------------------------------------------------
// Small figures to hide. Each is a list of unit lines; the numbers are lattice dots.
// ---------------------------------------------------------------------------
export const TEMPLATES = {
  step: { edges: walk([0, 0], [1, 0], [1, 1], [2, 1], [2, 2]), size: 1 },
  hook: { edges: walk([0, 0], [2, 0], [2, 1]), size: 1 },
  cup: { edges: walk([0, 0], [0, 1], [2, 1], [2, 0]), size: 1 },
  flag: { edges: union(walk([0, 0], [0, 2]), boxEdges(0, 0, 1, 1)), size: 2 },
  tee: { edges: union(walk([0, 0], [3, 0]), walk([1, 0], [1, 2])), size: 2 },
  plus: { edges: union(walk([0, 1], [2, 1]), walk([1, 0], [1, 2])), size: 2 },
  box: { edges: boxEdges(0, 0, 1, 1), size: 1 },
  domino: { edges: boxEdges(0, 0, 2, 1), size: 2 },
  zigzag: { edges: walk([0, 0], [1, 0], [1, 1], [2, 1], [2, 0], [3, 0]), size: 2 },
  ell: { edges: walk([0, 0], [0, 2], [2, 2]), size: 1 },
  corner: { edges: union(boxEdges(0, 0, 1, 1), walk([1, 1], [2, 1], [2, 2])), size: 3 },
  gate: { edges: union(walk([0, 2], [0, 0], [2, 0], [2, 2]), walk([1, 0], [1, 1])), size: 3 },
  stairs: { edges: walk([0, 2], [1, 2], [1, 1], [2, 1], [2, 0], [3, 0]), size: 2 },
  bracket: { edges: walk([0, 0], [1, 0], [1, 2], [0, 2]), size: 1 },
};
export const TEMPLATE_NAMES = Object.keys(TEMPLATES);

// Grows a connected figure by random steps along lattice lines inside a cols by rows frame.
export function growFigure(r, base, cols, rows, extra) {
  const edges = new Set(base);
  const dots = () => [...edges].flatMap(edge => {
    const p = parse(edge);
    return p.kind === 'h' ? [[p.x, p.y], [p.x + 1, p.y]] : [[p.x, p.y], [p.x, p.y + 1]];
  });
  for (let tries = 0, added = 0; added < extra && tries < 80; tries++) {
    const [x, y] = r.pick(dots());
    const options = [
      x < cols ? hEdge(x, y) : null, x > 0 ? hEdge(x - 1, y) : null,
      y < rows ? vEdge(x, y) : null, y > 0 ? vEdge(x, y - 1) : null,
    ].filter(edge => edge && !edges.has(edge));
    if (!options.length) continue;
    edges.add(r.pick(options));
    added++;
  }
  return [...edges];
}

export function placeFigure(r, template, cols, rows) {
  const size = extent(template);
  if (size.width > cols || size.height > rows) throw new QuestionRetry('The figure does not fit the frame.');
  return shift(normalise(template), r.int(0, cols - size.width), r.int(0, rows - size.height));
}

// One question that asks which small figure is hidden in a big one (or which is not). Every wrong choice is checked by search.
export function embedQuestion({ family, known, count, r, level, cols, rows, extra, mode, turning, kindPrefix, names, codes, prompt, hint, explanation, contexts }) {
  const pool = names.filter(name => TEMPLATES[name].size <= level + 1);
  const library = pool.length >= 6 ? pool : names;
  let big;
  let correct;
  let wrongFigures;
  if (mode === 'find') {
    const name = r.pick(library);
    let template = TEMPLATES[name].edges;
    if (turning) template = turnedCopy(template);
    const base = placeFigure(r, template, cols, rows);
    big = growFigure(r, base, cols, rows, extra);
    correct = normalise(template);
    const candidates = [];
    for (const other of library) if (other !== name) candidates.push({ edges: normalise(TEMPLATES[other].edges), code: codes.other });
    const mirror = flippedCopy(template);
    candidates.push({ edges: mirror, code: codes.turned });
    for (const copy of turnedCopies(template)) candidates.push({ edges: copy, code: codes.turned });
    for (let tries = 0; tries < 12; tries++) {
      const moved = [...template];
      moved.splice(r.int(0, moved.length - 1), 1);
      const free = [];
      for (let x = 0; x <= extent(template).width; x++) for (let y = 0; y <= extent(template).height; y++) free.push(hEdge(x, y), vEdge(x, y));
      const added = r.pick(free.filter(edge => !moved.includes(edge) && !template.includes(edge)));
      candidates.push({ edges: normalise([...moved, added]), code: codes.near });
    }
    wrongFigures = [];
    const seen = new Set([canon(correct)]);
    for (const candidate of r.shuffle(candidates)) {
      const key = canon(candidate.edges);
      if (seen.has(key) || fits(candidate.edges, big, turning) || candidate.edges.length < 3) continue;
      seen.add(key);
      wrongFigures.push(candidate);
      if (wrongFigures.length === count - 1) break;
    }
  } else {
    const chosen = r.shuffle(library).slice(0, count);
    const hidden = chosen.slice(0, count - 1);
    const absent = chosen[count - 1];
    let figure = [];
    for (const name of hidden) figure = union(figure, placeFigure(r, TEMPLATES[name].edges, cols, rows));
    big = growFigure(r, figure, cols, rows, extra);
    correct = normalise(TEMPLATES[absent].edges);
    if (fits(correct, big, false)) throw new QuestionRetry('The odd figure is hidden too.');
    wrongFigures = hidden.map(name => ({ edges: normalise(TEMPLATES[name].edges), code: codes.found }));
    if (wrongFigures.some(item => !fits(item.edges, big, false))) throw new QuestionRetry('A hidden figure was lost.');
  }
  if (wrongFigures.length !== count - 1) throw new QuestionRetry('Not enough checked wrong figures.');
  const small = edges => ({ kind: `${kindPrefix}-small`, edges, description: describeEdges(edges) });
  const view = { kind: `${kindPrefix}-big`, edges: big, cols, rows, turn: turning, description: `Big figure. ${describeEdges(big)}` };
  const correctVisual = small(correct);
  const result = build({
    family, known, count,
    prompt: prompt(r.pick(contexts)),
    answer: canon(correct), hint, explanation,
    givens: { mode },
    visual: view, correctVisual,
    wrongs: wrongFigures.map(item => ({ value: canon(item.edges), code: item.code, visual: small(item.edges) })),
  });
  return result;
}

export function solveEmbed(question) {
  const { mode } = question.proof.givens;
  const big = question.visual.edges;
  const hits = question.optionVisuals.map((visual, index) => (fits(visual.edges, big, question.visual.turn) ? index : -1)).filter(index => index >= 0);
  if (mode === 'find') {
    if (hits.length !== 1) throw new Error('Exactly one figure must be hidden.');
    return question.options[hits[0]];
  }
  if (hits.length !== question.options.length - 1) throw new Error('Exactly one figure must be missing.');
  return question.options.find((_, index) => !hits.includes(index));
}

export function renderEmbed(visual, svg, maxBig = { width: 520, height: 300 }) {
  if (visual.kind.endsWith('-big')) {
    const cell = Math.min(60, Math.floor(440 / visual.cols), Math.floor(240 / visual.rows));
    const x = Math.round((maxBig.width - cell * visual.cols) / 2);
    const y = Math.round((maxBig.height - cell * visual.rows) / 2);
    return svg(drawEdges(visual.edges, { x, y, cell, cols: visual.cols, rows: visual.rows, width: 6 }), visual.description, maxBig.width, maxBig.height);
  }
  return svg(drawCentred(visual.edges, { width: 220, height: 220 }), visual.description, 220, 220);
}
