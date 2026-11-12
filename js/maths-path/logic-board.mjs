import { esc, liveRegion, button } from './core.mjs';

export const type = 'logicBoard';

// Coding and direction board: build a short program, press Run, and watch the marker follow it.
// config: { rows, cols, start: { r, c, dir: 'N'|'E'|'S'|'W' }, goal: { r, c }, walls?: [[r,c]...], commands?: 'turtle' | 'compass', maxCommands?, caption? }
//   turtle  = Forward, Turn left, Turn right      compass = North, East, South, West (one square each)
// target: { reach: true, maxCommands?: n }
export const sample = {
  config: { rows: 3, cols: 3, start: { r: 2, c: 0, dir: 'E' }, goal: { r: 0, c: 2 }, walls: [[1, 1]], commands: 'compass', maxCommands: 6 },
  target: { reach: true },
};

const DIRS = ['N', 'E', 'S', 'W'];
const STEP = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
const NAME = { N: 'north', E: 'east', S: 'south', W: 'west' };
const ARROW = { N: '▲', E: '▶', S: '▼', W: '◀' };
const LABEL = { forward: 'Forward', left: 'Turn left', right: 'Turn right', N: 'North', E: 'East', S: 'South', W: 'West' };

// Pure and exported so tests and authors can check a program without a DOM.
export function runProgram(config, program) {
  let { r, c, dir } = config.start;
  const walls = new Set((config.walls ?? []).map(([a, b]) => `${a},${b}`));
  const path = [[r, c]];
  for (const cmd of program) {
    if (cmd === 'left') dir = DIRS[(DIRS.indexOf(dir) + 3) % 4];
    else if (cmd === 'right') dir = DIRS[(DIRS.indexOf(dir) + 1) % 4];
    else {
      const move = cmd === 'forward' ? dir : cmd;
      if (!STEP[move]) throw new Error(`Unknown logicBoard command: ${cmd}`);
      if (cmd !== 'forward') dir = move;
      const nr = r + STEP[move][0]; const nc = c + STEP[move][1];
      if (nr < 0 || nc < 0 || nr >= config.rows || nc >= config.cols) return { r, c, dir, path, stopped: `Stopped at the edge of the board.` };
      if (walls.has(`${nr},${nc}`)) return { r, c, dir, path, stopped: 'Stopped at a wall.' };
      r = nr; c = nc; path.push([r, c]);
    }
  }
  return { r, c, dir, path, stopped: null, atGoal: r === config.goal.r && c === config.goal.c };
}

function board(config, state) {
  const walls = new Set((config.walls ?? []).map(([a, b]) => `${a},${b}`));
  const trail = new Set((state.path ?? []).map(([a, b]) => `${a},${b}`));
  const cells = [];
  for (let r = 0; r < config.rows; r += 1) for (let c = 0; c < config.cols; c += 1) {
    const k = `${r},${c}`;
    const here = state.r === r && state.c === c;
    const goal = config.goal.r === r && config.goal.c === c;
    const cls = ['mp-lcell', walls.has(k) && 'is-wall', goal && 'is-goal', trail.has(k) && 'is-trail', here && 'is-here'].filter(Boolean).join(' ');
    cells.push(`<span class="${cls}">${here ? `<b>${ARROW[state.dir]}</b>` : goal ? '<em>GOAL</em>' : walls.has(k) ? '<em>wall</em>' : ''}</span>`);
  }
  return `<div class="mp-lboard" style="--cols:${config.cols};--rows:${config.rows}" role="img" aria-label="${esc(describe(config, state))}">${cells.join('')}</div>`;
}
const describe = (config, state) => `Board of ${config.rows} rows and ${config.cols} columns. The marker is in row ${state.r + 1}, column ${state.c + 1}, facing ${NAME[state.dir]}. The goal is in row ${config.goal.r + 1}, column ${config.goal.c + 1}.${(config.walls ?? []).length ? ` Walls: ${config.walls.map(([a, b]) => `row ${a + 1} column ${b + 1}`).join('; ')}.` : ''}`;

export function render(config) {
  return `<figure class="mp-w mp-logic">${board(config, { ...config.start })}${config.caption ? `<figcaption>${esc(config.caption)}</figcaption>` : ''}</figure>`;
}

export function mount(root, config, hooks = {}) {
  const doc = root.ownerDocument;
  const commands = config.commands === 'compass' ? ['N', 'E', 'S', 'W'] : ['forward', 'left', 'right'];
  const maxCommands = config.maxCommands ?? 12;
  let program = [];
  let state = { ...config.start, path: [[config.start.r, config.start.c]] };
  let ran = false;
  root.classList.add('mp-w', 'mp-logic');
  root.innerHTML = '<div data-board></div><div class="mp-controls" data-commands></div><p class="mp-tray-title">Your program</p><ol class="mp-program" data-program></ol><div class="mp-controls" data-actions></div><p class="mp-readout" data-readout></p>';
  const say = liveRegion(root);
  const message = () => (ran
    ? (state.stopped ?? (state.atGoal ? `Done! The marker reached the goal in ${program.length} ${program.length === 1 ? 'step' : 'steps'}.` : 'The program ended before the goal. Change it and run again.'))
    : program.length ? `${program.length} of ${maxCommands} steps in the program.` : 'Add steps, then press Run.');
  const draw = () => {
    root.querySelector('[data-board]').innerHTML = board(config, state);
    root.querySelector('[data-program]').innerHTML = program.map((p) => `<li>${LABEL[p]}</li>`).join('');
    root.querySelector('[data-readout]').textContent = message();
  };
  const changed = () => { ran = false; state = { ...config.start, path: [[config.start.r, config.start.c]] }; draw(); say(message()); hooks.onChange?.(api.getState()); };
  const cmdBar = root.querySelector('[data-commands]');
  for (const cmd of commands) cmdBar.append(button(doc, { text: LABEL[cmd], onClick: () => { if (program.length < maxCommands) { program.push(cmd); changed(); } else say(`The program is full (${maxCommands} steps).`); } }));
  root.querySelector('[data-actions]').append(
    button(doc, { text: 'Run', className: 'mp-btn mp-btn--primary', onClick: () => { state = runProgram(config, program); ran = true; draw(); say(message()); hooks.onChange?.(api.getState()); } }),
    button(doc, { text: 'Undo last', onClick: () => { program.pop(); changed(); } }),
    button(doc, { text: 'Clear', className: 'mp-btn mp-btn--ghost', onClick: () => api.reset() }),
  );
  draw();
  const api = {
    getState: () => ({ program: [...program], ran, atGoal: Boolean(ran && state.atGoal), steps: program.length }),
    matches: (target) => {
      const result = runProgram(config, program);
      const short = target.maxCommands === undefined || program.length <= target.maxCommands;
      const ok = Boolean(result.atGoal) && short;
      return { ok, message: ok ? 'Yes! Your program reaches the goal.' : result.atGoal ? `It reaches the goal, but try it in ${target.maxCommands} steps or fewer.` : 'Not yet. Press Run and watch where the marker stops.' };
    },
    reset: () => { program = []; changed(); },
  };
  return api;
}
