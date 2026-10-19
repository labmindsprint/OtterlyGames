import { clockHandEndpoints } from '../worksheet-generator.mjs';
import { ART_ROOT, PAINTS, PARTS } from './destinations.mjs';
import { renderNumbers } from './bank-numbers.mjs';
import { renderReasoning } from './bank-reasoning.mjs';
import { renderEveryday } from './bank-everyday.mjs';
import { renderBank3 } from './bank3-index.mjs';
import { choiceLabel } from './question-display.mjs';

export const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export function symbolSVG(symbol) {
  const shapes = {
    circle: '<circle cx="24" cy="24" r="17"/>',
    triangle: '<path d="M24 5 44 41H4Z"/>',
    square: '<rect x="7" y="7" width="34" height="34" rx="2"/>',
    rectangle: '<rect x="3" y="13" width="42" height="24" rx="2"/>',
    pentagon: '<path d="M24 3 45 19 37 43H11L3 19Z"/>',
    hexagon: '<path d="M13 5H35L46 24 35 43H13L2 24Z"/>',
    star: '<path d="m24 2 7 14 16 3-12 12 3 16-14-8-14 8 3-16L1 19l16-3Z"/>',
  };
  return shapes[symbol] ? `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">${shapes[symbol]}</svg>` : `<span>${escapeHTML(symbol)}</span>`;
}

export function diagram(visual) {
  if (!visual) return '';
  const sized = artwork => artwork.replace(/<svg viewBox="0 0 ([\d.]+) ([\d.]+)"/,
    '<svg width="$1" height="$2" viewBox="0 0 $1 $2"');
  if (visual.kind.startsWith('v2-number-')) return sized(renderNumbers(visual));
  if (visual.kind.startsWith('v2-reasoning-')) return sized(renderReasoning(visual));
  if (visual.kind.startsWith('v2-everyday-')) return sized(renderEveryday(visual));
  if (visual.kind.startsWith('v3-')) return sized(renderBank3(visual));
  const token = item => `<span class="sa-token" role="img" aria-label="${escapeHTML(item)}">${symbolSVG(String(item))}</span>`;
  switch (visual.kind) {
    case 'objects': return `<div class="sa-picture sa-object-groups">${visual.groups.map(group =>
      `<div><span class="sa-picture-label">${escapeHTML(group.label)}</span><div class="sa-objects">${Array.from({ length: group.count }, () => token(group.symbol)).join('')}</div></div>`).join('')}</div>`;
    case 'sequence': return `<div class="sa-picture sa-sequence" aria-label="Read the pictures from left to right">${visual.items.map((item, index) =>
      `<span class="sa-sequence-cell">${token(item)}${visual.numbered ? `<small>Picture ${index + 1}</small>` : ''}</span>`).join('')}</div>`;
    case 'shape': return `<div class="sa-picture sa-single-shape" role="img" aria-label="${escapeHTML(visual.shape)}">${symbolSVG(visual.shape)}</div>`;
    case 'bars': return `<div class="sa-picture sa-chart" style="--max-blocks:${Math.max(...visual.rows.map(row => row.value))}"><p>Each block is the same length.</p>${visual.rows.map(row =>
      `<div class="sa-chart-row"><strong>Strip ${escapeHTML(row.label)}</strong><div class="sa-blocks" role="img" aria-label="${row.value} equal-length blocks">${Array.from({ length: row.value }, () => '<span></span>').join('')}</div></div>`).join('')}</div>`;
    case 'pictograph': return `<div class="sa-picture sa-chart"><p class="sa-key">${symbolSVG('star')} = ${visual.scale} samples</p>${visual.rows.map(row =>
      `<div class="sa-chart-row"><strong>${escapeHTML(row.label)}</strong><div class="sa-pictograph">${Array.from({ length: row.value }, () => token('star')).join('')}</div></div>`).join('')}</div>`;
    case 'fraction': return `<div class="sa-picture"><div class="sa-fraction" role="img" aria-label="${visual.denominator} equal parts, with ${visual.numerator} shaded" style="--fraction-columns:${visual.denominator > 6 ? visual.denominator / 2 : visual.denominator}">${Array.from({ length: visual.denominator }, (_, index) =>
      `<span class="${index < visual.numerator ? 'shaded' : ''}"></span>`).join('')}</div></div>`;
    case 'clock': {
      const hands = clockHandEndpoints(visual.hour, visual.minute);
      const hourPosition = visual.minute ? `between ${visual.hour} and ${visual.hour % 12 + 1}` : `at ${visual.hour}`;
      return `<div class="sa-picture sa-clock"><svg viewBox="0 0 200 200" role="img" aria-label="Analogue clock: short hour hand ${hourPosition}; long minute hand points to ${visual.minute / 5 || 12}">
        <circle cx="100" cy="100" r="94" fill="#fffaf0" stroke="#344c71" stroke-width="6"/>
        ${Array.from({ length: 12 }, (_, index) => {
          const hour = index + 1;
          const angle = hour * Math.PI / 6;
          return `<text x="${100 + Math.sin(angle) * 73}" y="${106 - Math.cos(angle) * 73}" text-anchor="middle">${hour}</text>`;
        }).join('')}
        <line x1="100" y1="100" x2="${hands.hour.x2}" y2="${hands.hour.y2}" stroke="#514093" stroke-width="9" stroke-linecap="round"/>
        <line x1="100" y1="100" x2="${hands.minute.x2}" y2="${hands.minute.y2}" stroke="#a84d2f" stroke-width="5" stroke-linecap="round"/>
        <circle cx="100" cy="100" r="6" fill="#344c71"/>
      </svg></div>`;
    }
    case 'arrows': return `<div class="sa-picture sa-arrows">${visual.items.map(direction =>
      `<svg viewBox="0 0 80 80" role="img" aria-label="Arrow pointing ${direction}"><g transform="rotate(${{ right: 0, down: 90, left: 180, up: 270 }[direction]} 40 40)"><path d="M8 28h35V10l30 30-30 30V52H8Z"/></g></svg>`).join('')}${visual.mirror ? '<span class="sa-mirror">Mirror</span>' : ''}</div>`;
    default: throw new Error(`Unsupported question diagram: ${visual.kind}`);
  }
}

export function answerChoice(question, index) {
  const label = `<span class="sa-choice-label">${escapeHTML(choiceLabel(question, index))}</span>`;
  const visual = question.optionVisuals?.[index];
  if (visual) {
    // Button content stays phrasing content; the bank renderer's outer picture is otherwise unchanged.
    const artwork = diagram(visual).replace(/^<div(?=[ >])/, '<span').replace(/<\/div>$/, '</span>');
    return `<span class="sa-choice sa-choice--picture">${label}${artwork}</span>`;
  }
  const shape = question.optionKind === 'shape'
    ? `<span class="sa-option-picture" aria-hidden="true">${symbolSVG(question.options[index])}</span>` : '';
  return `<span class="sa-choice">${shape}${label}</span>`;
}

const PART_ART = {
  engine: '<path d="M102 246h36l6 31H96Z" fill="#60718d"/><path d="M106 277h28l-14 31Z" fill="#ffd077"/><path d="M113 277h14l-7 19Z" fill="#fff3d3"/>',
  body: '<path d="M90 105h60v143a18 18 0 0 1-18 18h-24a18 18 0 0 1-18-18Z" fill="var(--rocket-paint)"/><path d="M102 150h8v86h-8Z" fill="#fff" opacity=".3"/><path d="M90 226h60v14H90Z" fill="#364967"/>',
  cockpit: '<path d="M90 105h60v40H90Z" fill="#fff5e5"/><circle cx="120" cy="122" r="18" fill="#344c71"/><circle cx="120" cy="122" r="12" fill="#8fe5df"/><path d="m113 118 11-6" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
  nose: '<path d="M90 105Q91 68 120 28q29 40 30 77Z" fill="var(--rocket-paint)"/><path d="M99 91q5-22 14-37" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".4"/>',
  'left-fin': '<path d="M90 190q-31 22-43 72l43-18Z" fill="#77ddcc"/><path d="m58 246 25-33" stroke="#b9f6e4" stroke-width="4" stroke-linecap="round"/>',
  'right-fin': '<path d="M150 190q31 22 43 72l-43-18Z" fill="#77ddcc"/><path d="m182 246-25-33" stroke="#b9f6e4" stroke-width="4" stroke-linecap="round"/>',
};
const PART_BOXES = {
  engine: '88 239 64 74', body: '80 98 80 176', cockpit: '82 96 76 58',
  nose: '80 18 80 94', 'left-fin': '36 182 62 90', 'right-fin': '142 182 62 90',
};

export function partSVG(id, paint = 'coral') {
  const color = PAINTS.find(item => item.id === paint)?.color;
  if (!PART_ART[id] || !color) throw new Error('Unknown rocket part or paint.');
  return `<svg class="sa-part-art" viewBox="${PART_BOXES[id]}" style="--rocket-paint:${color}" aria-hidden="true" focusable="false">${PART_ART[id]}</svg>`;
}

export function rocketSVG(fitted = [], paint = 'coral', preview = false) {
  const color = PAINTS.find(item => item.id === paint)?.color;
  if (!color) throw new Error('Unknown rocket paint.');
  return `<svg class="sa-rocket" viewBox="0 0 240 340" style="--rocket-paint:${color}" aria-hidden="true" focusable="false">
    <ellipse cx="120" cy="321" rx="76" ry="9" fill="#000" opacity=".13"/>
    ${['left-fin', 'right-fin', 'body', 'cockpit', 'nose', 'engine'].map(id =>
      `<g data-rocket-part="${id}" class="${fitted.includes(id) || preview ? 'is-fitted' : 'is-blueprint'}">${PART_ART[id]}</g>`).join('')}
  </svg>`;
}

export class ActiveClock {
  constructor() { this.elapsed = 0; this.previous = null; }
  tick(now, running) {
    if (running && this.previous !== null) this.elapsed += Math.max(0, now - this.previous);
    this.previous = running ? now : null;
    return this.elapsed;
  }
  pause() { this.previous = null; }
}

let manifestPromise;
const atlasManifest = () => {
  manifestPromise ??= fetch(`${ART_ROOT}atlas.json`).then(response => {
    if (!response.ok) throw new Error(`Space artwork manifest returned HTTP ${response.status}.`);
    return response.json();
  }).catch(error => { manifestPromise = null; throw error; });
  return manifestPromise;
};

export const FLIGHT_MS = 8500;
export const FLIGHT_REDUCED_MS = 450;

/**
 * The launch picture is a pure function of ACTIVE flight time (the ActiveClock already stops while the page is
 * hidden, offscreen or paused), so what is drawn can never run ahead of the saved flight. Phases: countdown 3-2-1
 * (0-2250 ms), ignite, liftoff, cruise, arrive (ends at FLIGHT_MS). `vars` are the CSS custom properties the stage
 * reads; reduced motion gets one calm static cruise frame for FLIGHT_REDUCED_MS.
 */
export function flightFrame(elapsed, reduced = false) {
  const total = reduced ? FLIGHT_REDUCED_MS : FLIGHT_MS;
  const time = Math.min(total, Math.max(0, Number(elapsed) || 0));
  const progress = time / total;
  const round = value => Math.round(value * 1e4) / 1e4;
  if (reduced) {
    return { phase: 'cruise', digit: 0, progress, vars: { 'flight-progress': round(progress), lift: 1, climb: 1, thrust: .7, travel: 0, scroll: 0, bank: .6, world: .5, flash: 0 } };
  }
  const span = (from, to) => Math.min(1, Math.max(0, (time - from) / (to - from)));
  const smooth = value => value * value * (3 - 2 * value);
  const up = span(3350, 5350);
  const arrive = span(7250, 8500);
  const speed = 420;
  let thrust = 0;
  if (time >= 2250) {
    thrust = time < 2750 ? 1.3 * Math.sin(span(2250, 2750) * Math.PI / 2)
      : time < 3350 ? 1.3 - .3 * span(2750, 3350)
        : time < 5350 ? 1 + .15 * up
          : time < 7250 ? 1.15 - .25 * span(5350, 7250)
            : .9 - .75 * smooth(arrive);
  }
  const travel = time < 3350 ? 0
    : time < 5350 ? speed * 2 * up ** 3 / 3
      : time < 7250 ? speed * (2 / 3 + (time - 5350) / 1000)
        : speed * (2 / 3 + 1.9 + 1.25 * (arrive - .35 * arrive * arrive));
  const world = time < 5350 ? 0 : time < 7250 ? .03 + .09 * span(5350, 7250) : .12 + .88 * span(7250, 8350) ** 1.8;
  return {
    phase: time < 2250 ? 'countdown' : time < 3350 ? 'ignite' : time < 5350 ? 'liftoff' : time < 7250 ? 'cruise' : 'arrive',
    digit: time < 750 ? 3 : time < 1500 ? 2 : time < 2250 ? 1 : 0,
    progress,
    vars: {
      'flight-progress': round(progress), lift: round(up ** 2.2), climb: round(smooth(span(3350, 5000))), thrust: round(thrust),
      travel: round(travel), scroll: round(travel / 512 % 1), bank: round(smooth(span(5350, 6500))),
      world: round(world), flash: round(smooth(span(8000, 8500))),
    },
  };
}

export class SpaceScene {
  constructor(root, { onArrival, onError, isVisible = () => true } = {}) {
    this.root = root;
    this.onArrival = onArrival;
    this.onError = onError;
    this.isVisible = isVisible;
    this.clock = new ActiveClock();
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
    this.paused = false;
    this.destroyed = false;
    this.frame = null;
    this.art = null;
    this.done = false;
    this.inView = true;
    this.motionChanged = () => this.refresh();
    this.reduced.addEventListener('change', this.motionChanged);
    this.observer = new IntersectionObserver(entries => {
      this.inView = entries[0].isIntersecting;
      this.refresh();
    });
    const target = root.querySelector('[data-flight], [data-celestial]');
    if (target) this.observer.observe(target);
  }

  async start() {
    const canvas = this.root.querySelector('[data-celestial]');
    if (canvas) {
      try {
        const key = canvas.dataset.celestial;
        const manifest = await atlasManifest();
        const entry = manifest[key];
        if (!entry) throw new Error(`Space artwork is missing for ${key}.`);
        const image = new Image();
        image.src = `${ART_ROOT}${key}-atlas.webp`;
        await image.decode();
        if (this.destroyed) return;
        if (image.naturalWidth !== entry.width * entry.columns ||
            image.naturalHeight !== entry.height * Math.ceil(entry.frames / entry.columns)) {
          throw new Error(`The ${key} animation atlas has unexpected dimensions.`);
        }
        canvas.width = entry.width;
        canvas.height = entry.height;
        this.art = { canvas, entry, image, context: canvas.getContext('2d') };
        if (!this.art.context) throw new Error('This browser could not draw the space artwork.');
        canvas.dataset.ready = 'true';
      } catch (error) {
        if (!this.destroyed) this.onError?.(`Space animation could not load. The still illustration is shown instead. ${error.message}`);
      }
    }
    if (!this.destroyed) this.refresh();
  }

  refresh() {
    cancelAnimationFrame(this.frame);
    this.clock.pause();
    if (!this.destroyed) this.frame = requestAnimationFrame(now => this.tick(now));
  }

  tick(now) {
    if (this.destroyed) return;
    const running = !this.paused && !document.hidden && this.isVisible() && this.inView;
    const elapsed = this.clock.tick(now, running);
    if (this.art) {
      const { context, canvas, entry, image } = this.art;
      const position = this.reduced.matches ? 0 : (elapsed % 72000) / 72000 * entry.frames;
      const index = Math.floor(position);
      const draw = (frame, alpha) => {
        context.globalAlpha = alpha;
        context.drawImage(image, frame % entry.columns * entry.width,
          Math.floor(frame / entry.columns) * entry.height, entry.width, entry.height, 0, 0, canvas.width, canvas.height);
      };
      context.clearRect(0, 0, canvas.width, canvas.height);
      draw(index, 1 - (position % 1));
      context.globalCompositeOperation = 'lighter';
      draw((index + 1) % entry.frames, position % 1);
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
    }
    const flight = this.root.querySelector('[data-flight]');
    if (flight && !this.done) {
      const frame = flightFrame(elapsed, this.reduced.matches);
      const { progress } = frame;
      flight.dataset.elapsed = String(Math.round(elapsed));
      const marks = { phase: frame.phase, digit: String(frame.digit), live: String(running) };
      for (const [name, value] of Object.entries(marks)) if (flight.dataset[name] !== value) flight.dataset[name] = value;
      this.drawn ??= {};
      for (const [name, value] of Object.entries(frame.vars)) {
        if (this.drawn[name] !== value) { this.drawn[name] = value; flight.style.setProperty(`--${name}`, value); }
      }
      const meter = flight.querySelector('progress');
      if (meter) meter.value = progress;
      if (progress === 1) {
        this.done = true;
        this.onArrival?.();
        return;
      }
    }
    if (running && (flight || (this.art && !this.reduced.matches))) {
      this.frame = requestAnimationFrame(time => this.tick(time));
    }
  }

  skip() {
    if (this.done || this.destroyed) return;
    this.clock.elapsed = Math.max(this.clock.elapsed, FLIGHT_MS);
    this.refresh();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.reduced.removeEventListener('change', this.motionChanged);
    this.art = null;
    this.clock.pause();
  }
}
