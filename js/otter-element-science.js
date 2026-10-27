(() => {
  const root = document.getElementById('oe-science');
  if (!root) return;

  const PERIODS = [
    [1, 'H Hydrogen|He Helium'],
    [3, 'Li Lithium|Be Beryllium|B Boron|C Carbon|N Nitrogen|O Oxygen|F Fluorine|Ne Neon'],
    [11, 'Na Sodium|Mg Magnesium|Al Aluminium|Si Silicon|P Phosphorus|S Sulfur|Cl Chlorine|Ar Argon'],
    [19, 'K Potassium|Ca Calcium|Sc Scandium|Ti Titanium|V Vanadium|Cr Chromium|Mn Manganese|Fe Iron|Co Cobalt|Ni Nickel|Cu Copper|Zn Zinc|Ga Gallium|Ge Germanium|As Arsenic|Se Selenium|Br Bromine|Kr Krypton'],
    [37, 'Rb Rubidium|Sr Strontium|Y Yttrium|Zr Zirconium|Nb Niobium|Mo Molybdenum|Tc Technetium|Ru Ruthenium|Rh Rhodium|Pd Palladium|Ag Silver|Cd Cadmium|In Indium|Sn Tin|Sb Antimony|Te Tellurium|I Iodine|Xe Xenon'],
    [55, 'Cs Caesium|Ba Barium|La Lanthanum|Ce Cerium|Pr Praseodymium|Nd Neodymium|Pm Promethium|Sm Samarium|Eu Europium|Gd Gadolinium|Tb Terbium|Dy Dysprosium|Ho Holmium|Er Erbium|Tm Thulium|Yb Ytterbium|Lu Lutetium|Hf Hafnium|Ta Tantalum|W Tungsten|Re Rhenium|Os Osmium|Ir Iridium|Pt Platinum|Au Gold|Hg Mercury|Tl Thallium|Pb Lead|Bi Bismuth|Po Polonium|At Astatine|Rn Radon'],
    [87, 'Fr Francium|Ra Radium|Ac Actinium|Th Thorium|Pa Protactinium|U Uranium|Np Neptunium|Pu Plutonium|Am Americium|Cm Curium|Bk Berkelium|Cf Californium|Es Einsteinium|Fm Fermium|Md Mendelevium|No Nobelium|Lr Lawrencium|Rf Rutherfordium|Db Dubnium|Sg Seaborgium|Bh Bohrium|Hs Hassium|Mt Meitnerium|Ds Darmstadtium|Rg Roentgenium|Cn Copernicium|Nh Nihonium|Fl Flerovium|Mc Moscovium|Lv Livermorium|Ts Tennessine|Og Oganesson'],
  ];
  const COLORS = {
    'Alkali metal': '#f0a090', 'Alkaline earth': '#f0c880', 'Transition metal': '#9cc4ec', 'Post-transition metal': '#a6c9b0',
    Metalloid: '#c5d68a', 'Non-metal': '#8fe0c0', Halogen: '#e8e07a', 'Noble gas': '#c8a8f0', Lanthanoid: '#f0a8cc', Actinoid: '#d894b0',
  };
  // Only the two elements the browser preview opens carry a power here; they are the game's own names and descriptions.
  const POWERS = {
    1: ['Healing Cloud', 'A cloud that heals the lab and hurts the enemies inside it.'],
    2: ['Calm Field', 'A cold aurora that slows and weakens every enemy and heals the lab.'],
  };

  const family = n => {
    if ([2, 10, 18, 36, 54, 86, 118].includes(n)) return 'Noble gas';
    if ([3, 11, 19, 37, 55, 87].includes(n)) return 'Alkali metal';
    if ([4, 12, 20, 38, 56, 88].includes(n)) return 'Alkaline earth';
    if ([9, 17, 35, 53, 85, 117].includes(n)) return 'Halogen';
    if (n >= 57 && n <= 71) return 'Lanthanoid';
    if (n >= 89 && n <= 103) return 'Actinoid';
    if ([5, 14, 32, 33, 51, 52].includes(n)) return 'Metalloid';
    if ([1, 6, 7, 8, 15, 16, 34].includes(n)) return 'Non-metal';
    if ((n >= 21 && n <= 30) || (n >= 39 && n <= 48) || (n >= 72 && n <= 80) || (n >= 104 && n <= 112)) return 'Transition metal';
    return 'Post-transition metal';
  };
  const place = (n, period, i) => {
    if (period === 1) return [n === 1 ? 1 : 18, 1];
    if (period === 2 || period === 3) return [i < 2 ? i + 1 : i + 11, period];
    if (n >= 57 && n <= 71) return [n - 54, 9];
    if (n >= 89 && n <= 103) return [n - 86, 10];
    return [period >= 6 && i > 16 ? i - 13 : i + 1, period];
  };

  const elements = [];
  PERIODS.forEach(([start, list], p) => list.split('|').forEach((entry, i) => {
    const [symbol, name] = entry.split(' ');
    const n = start + i;
    const [col, row] = place(n, p + 1, i);
    elements.push({ n, symbol, name, col, row, family: family(n) });
  }));

  // Table
  const grid = root.querySelector('#oe-table');
  const detail = root.querySelector('#oe-detail');
  const counter = root.querySelector('#oe-count');
  const bar = root.querySelector('#oe-count-bar');
  const revealAll = root.querySelector('#oe-reveal');
  const found = new Set();
  const cells = new Map();

  function paint(el) {
    const btn = cells.get(el.n);
    const on = found.has(el.n);
    btn.classList.toggle('is-found', on);
    btn.style.setProperty('--fam', COLORS[el.family]);
    btn.innerHTML = on
      ? `<small>${el.n}</small><b>${el.symbol}</b>`
      : `<small>${el.n}</small>`;
    btn.setAttribute('aria-label', on ? `${el.name}, element ${el.n}, discovered` : `Element ${el.n}, sealed. Tap to discover`);
  }
  function summary() {
    counter.textContent = `${found.size} / 118`;
    bar.style.width = `${(found.size / 118) * 100}%`;
    revealAll.textContent = found.size === 118 ? 'Seal them again' : 'Reveal the whole table';
  }
  function show(el) {
    const power = POWERS[el.n];
    detail.innerHTML = `<span class="oe-chip" style="--fam:${COLORS[el.family]}">${el.symbol}</span>
      <div><strong>#${el.n} ${el.name}</strong><span>${el.family}</span>
      ${power ? `<p><b>Power: ${power[0]}.</b> ${power[1]}</p>` : '<p>Every element in the game unlocks when you discover it in a battle. Its power and atom are revealed in the game.</p>'}</div>`;
  }

  elements.forEach(el => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'oe-cell';
    btn.style.gridColumn = String(el.col);
    btn.style.gridRow = String(el.row);
    btn.addEventListener('click', () => {
      found.add(el.n);
      paint(el);
      summary();
      show(el);
    });
    cells.set(el.n, btn);
    grid.appendChild(btn);
    paint(el);
  });
  revealAll.addEventListener('click', () => {
    if (found.size === 118) found.clear(); else elements.forEach(e => found.add(e.n));
    elements.forEach(paint);
    summary();
  });
  summary();

  // Legend
  const legend = root.querySelector('#oe-legend');
  Object.entries(COLORS).forEach(([name, color]) => {
    const li = document.createElement('li');
    li.innerHTML = `<i style="background:${color}"></i>${name}`;
    legend.appendChild(li);
  });

  // Atom card
  const ATOMS = [
    { symbol: 'H', name: 'Hydrogen', p: 1, n: 0, e: 1, shells: [1] },
    { symbol: 'He', name: 'Helium', p: 2, n: 2, e: 2, shells: [2] },
    { symbol: 'O', name: 'Oxygen', p: 8, n: 8, e: 8, shells: [2, 6] },
  ];
  const atomBox = root.querySelector('#oe-atom');
  const atomInfo = root.querySelector('#oe-atom-info');
  let atomIndex = 0;
  function drawAtom() {
    const a = ATOMS[atomIndex];
    let svg = '<circle cx="90" cy="90" r="14" fill="#f0a090"/>';
    a.shells.forEach((count, s) => {
      const r = 34 + s * 24;
      svg += `<circle cx="90" cy="90" r="${r}" fill="none" stroke="#5a7a6d" stroke-width="1.2"/>`;
      for (let k = 0; k < count; k++) {
        const ang = (k / count) * Math.PI * 2 - Math.PI / 2;
        svg += `<circle cx="${90 + r * Math.cos(ang)}" cy="${90 + r * Math.sin(ang)}" r="5" fill="#8fe0c0"/>`;
      }
    });
    atomBox.innerHTML = `<svg viewBox="0 0 180 180" role="img" aria-label="${a.name} atom with ${a.e} electrons">${svg}</svg>`;
    atomInfo.innerHTML = `<strong>${a.name} (${a.symbol})</strong> ${a.p} proton${a.p > 1 ? 's' : ''}, ${a.n} neutron${a.n === 1 ? '' : 's'}, ${a.e} electron${a.e > 1 ? 's' : ''}`;
  }
  root.querySelector('#oe-atom-next').addEventListener('click', () => { atomIndex = (atomIndex + 1) % ATOMS.length; drawAtom(); });
  drawAtom();

  // Lab
  const RECIPES = [
    { a: 'H', b: 'H', name: 'Hydrogen gas', formula: 'H2', bay: 'Barrel', effect: 'Fires 4% faster.', source: 'Starter schema', fact: 'Hydrogen is the lightest substance and the fuel of the Sun.' },
    { a: 'H', b: 'O', name: 'Water', formula: 'H2O', bay: 'Core', effect: '+8% tower health. Splash chill: hits slow enemies by 15% for 2 seconds.', source: 'Boss schema', fact: 'Water expands when it freezes, which is why ice floats.' },
    { a: 'C', b: 'H', name: 'Methane', formula: 'CH4', bay: 'Barrel', effect: '+8% attack.', source: 'Boss schema', fact: 'Methane is the main part of natural gas.' },
    { a: 'H', b: 'N', name: 'Ammonia', formula: 'NH3', bay: 'Core', effect: 'Restores 1.5% more health after each wave.', source: 'Boss schema', fact: 'Ammonia fertiliser from the Haber process feeds about half the world.' },
    { a: 'C', b: 'O', name: 'Carbon dioxide', formula: 'CO2', bay: 'Mount', effect: 'Power cooldowns 7% shorter. Fizz burst: hits explode on nearby enemies.', source: 'Boss schema', fact: 'Dry ice is solid carbon dioxide. It turns straight into gas.' },
    { a: 'Cl', b: 'Na', name: 'Sodium chloride', formula: 'NaCl', bay: 'Core', effect: '+2% repair, and Salt pan heals 1.5% of maximum health after each cleared wave.', source: 'Boss schema', fact: 'Table salt joins a metal that explodes in water to a gas that is poisonous.' },
  ];
  const picks = [];
  const slotA = root.querySelector('#oe-slot-a');
  const slotB = root.querySelector('#oe-slot-b');
  const fuse = root.querySelector('#oe-fuse');
  const clear = root.querySelector('#oe-clear');
  const out = root.querySelector('#oe-result');
  const atoms = [...root.querySelectorAll('[data-atom]')];

  function drawSlots() {
    slotA.textContent = picks[0] || 'A';
    slotB.textContent = picks[1] || 'B';
    slotA.classList.toggle('is-set', !!picks[0]);
    slotB.classList.toggle('is-set', !!picks[1]);
    fuse.disabled = picks.length < 2;
    atoms.forEach(b => b.setAttribute('aria-pressed', String(picks.includes(b.dataset.atom))));
  }
  atoms.forEach(btn => btn.addEventListener('click', () => {
    const s = btn.dataset.atom;
    if (picks.length < 2) picks.push(s);
    else picks[1] = s;
    out.hidden = true;
    drawSlots();
  }));
  [slotA, slotB].forEach((slot, i) => slot.addEventListener('click', () => {
    if (picks[i]) { picks.splice(i, 1); out.hidden = true; drawSlots(); }
  }));
  clear.addEventListener('click', () => { picks.length = 0; out.hidden = true; drawSlots(); });
  fuse.addEventListener('click', () => {
    const key = [...picks].sort().join('+');
    const r = RECIPES.find(x => [x.a, x.b].sort().join('+') === key);
    out.hidden = false;
    out.classList.toggle('is-miss', !r);
    if (!r) {
      out.innerHTML = `<strong>No molecule for ${picks.join(' + ')} on this practice bench</strong><p>The bench knows six molecules. Try H + O, C + H or Na + Cl. In the game you fuse only the schemas you hold, and some elements cannot bond at all.</p>`;
      return;
    }
    out.innerHTML = `<div class="oe-formula">${r.formula}</div>
      <div><strong>${r.name}</strong>
      <span class="oe-tag">Fits the ${r.bay} bay</span><span class="oe-tag">${r.source}</span>
      <p><b>Turret bonus:</b> ${r.effect}</p><p class="oe-fact">${r.fact}</p>
      <p class="oe-practice-note">Practice result. Nothing was fused or saved. In the game, you fuse a schema you hold from the Lab's Molecules tab.</p></div>`;
    out.classList.remove('oe-pop'); void out.offsetWidth; out.classList.add('oe-pop');
  });
  drawSlots();
})();
