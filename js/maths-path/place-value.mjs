import { esc, liveRegion, button, plural, clamp, numberWords } from './core.mjs';

export const type = 'placeValue';

const rods = (n) => Array.from({ length: n }, () => '<span class="mp-rod"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>').join('');
const cubes = (n) => Array.from({ length: n }, () => '<span class="mp-cube"></span>').join('');

function describe(tens, ones) {
  return `${plural(tens, 'ten rod')} and ${plural(ones, 'one cube')}. That makes ${tens * 10 + ones}.`;
}

export function render(config) {
  const { tens = 0, ones = 0 } = config;
  const value = tens * 10 + ones;
  return `<figure class="mp-w mp-place" role="img" aria-label="${esc(config.alt ?? describe(tens, ones))}">` +
    `<div class="mp-place-board" aria-hidden="true"><div class="mp-place-col"><span class="mp-place-head">Tens</span><div class="mp-place-stack mp-place-stack--tens">${rods(tens)}</div><strong class="mp-place-num">${tens}</strong></div>` +
    `<div class="mp-place-col"><span class="mp-place-head">Ones</span><div class="mp-place-stack mp-place-stack--ones">${cubes(ones)}</div><strong class="mp-place-num">${ones}</strong></div></div>` +
    `<figcaption>${config.caption ? esc(config.caption) : `${tens} tens + ${ones} ones = <strong>${value}</strong>`}</figcaption></figure>`;
}

export function mount(root, config, hooks = {}) {
  const doc = root.ownerDocument;
  let tens = clamp(config.tens ?? 0, 0, 9);
  let ones = clamp(config.ones ?? 0, 0, 19);
  root.classList.add('mp-w', 'mp-place');
  root.innerHTML = `<div class="mp-place-board">
    <div class="mp-place-col"><span class="mp-place-head">Tens</span><button type="button" class="mp-place-stack mp-place-stack--tens" data-tens aria-label="Tens. Tap to pick one up."></button><strong class="mp-place-num" data-tens-num></strong></div>
    <div class="mp-place-col"><span class="mp-place-head">Ones</span><button type="button" class="mp-place-stack mp-place-stack--ones" data-ones aria-label="Ones. Tap to pick one up."></button><strong class="mp-place-num" data-ones-num></strong></div></div>
    <p class="mp-readout" data-readout></p><div class="mp-controls" data-controls></div>`;
  const q = (s) => root.querySelector(s);
  const say = liveRegion(root);
  const controls = q('[data-controls]');
  const swap = button(doc, { text: 'Swap 10 ones for 1 ten', className: 'mp-btn mp-btn--accent', onClick: () => { ones -= 10; tens += 1; update('10 ones swapped for 1 ten.'); } });
  const buttons = {
    tenUp: button(doc, { text: '+ 1 ten', onClick: () => { tens += 1; update(); } }),
    tenDown: button(doc, { text: '− 1 ten', onClick: () => { tens -= 1; update(); } }),
    oneUp: button(doc, { text: '+ 1 one', onClick: () => { ones += 1; update(); } }),
    oneDown: button(doc, { text: '− 1 one', onClick: () => { ones -= 1; update(); } }),
  };
  controls.append(...Object.values(buttons), swap);

  const value = () => tens * 10 + ones;
  function update(extra) {
    tens = clamp(tens, 0, 9);
    ones = clamp(ones, 0, 19);
    q('[data-tens]').innerHTML = rods(tens);
    q('[data-ones]').innerHTML = cubes(ones);
    q('[data-tens-num]').textContent = tens;
    q('[data-ones-num]').textContent = ones;
    buttons.tenUp.disabled = tens >= 9;
    buttons.tenDown.disabled = tens <= 0;
    buttons.oneUp.disabled = ones >= 19;
    buttons.oneDown.disabled = ones <= 0;
    swap.hidden = ones < 10 || tens >= 9;
    const text = `${tens} ${tens === 1 ? 'ten' : 'tens'} and ${ones} ${ones === 1 ? 'one' : 'ones'} make ${value()} (${numberWords(Math.min(value(), 100))}).`;
    q('[data-readout]').textContent = text;
    say(`${extra ? `${extra} ` : ''}${text}`);
    hooks.onChange?.(api.getState());
  }
  // Tapping the tens or ones pile picks one up, like taking a block off the table.
  q('[data-tens]').addEventListener('click', () => { if (tens) { tens -= 1; update(); } });
  q('[data-ones]').addEventListener('click', () => { if (ones) { ones -= 1; update(); } });
  update();

  const api = {
    getState: () => ({ tens, ones, value: value() }),
    matches: (target) => {
      const ok = target.tens !== undefined ? tens === target.tens && ones === target.ones : value() === target.value;
      return {
        ok,
        message: ok ? `Yes! ${tens} tens and ${ones} ones make ${value()}.`
          : ones >= 10 ? 'You have 10 or more ones. Swap 10 ones for 1 ten, then look again.'
            : `You made ${value()}. Check the tens and the ones again.`,
      };
    },
    reset: () => { tens = config.tens ?? 0; ones = config.ones ?? 0; update(); },
  };
  return api;
}
