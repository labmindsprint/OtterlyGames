// Free roam: the layer that turns the flight world into a playground.
// Enemies drift in, the installed turrets shoot, the shield blocks, and schematics (gear, stickers, paint) float by.
// Nothing can fail: when the hearts run out the ship simply reboots.
import { play } from './audio.mjs';
import { gearById, gearIcon, projectileSVG, shieldSprite, turretSprite } from './gear.mjs';
import { PAINTS } from './data.mjs';
import { schematicLabel } from './schematics.mjs';
import { factText, readMs } from './steer.mjs';

const INK = '#2b2b2b';
const HEARTS = 5;
const HURT_GRACE = 1.2;
const REBOOT_GRACE = 3;
const PICKUP_RADIUS = 60;
const LOSE_DISTANCE = 1700;
const SHOT_LIFE = 1.5;
const BEAM_RANGE = 340;
const DROP_EVERY = 5;
const ORE = 'ore';
const ORE_ART = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M8 24 14 10 28 8 34 22 26 34 12 32Z" fill="#8a93a8" stroke="#2b2b2b" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 10 20 20 28 8M20 20 26 34M20 20 8 24" fill="none" stroke="#cfe6ff" stroke-width="2"/></svg>';
const FIRE_RANGE = 560;

const el = (tag, className, parent) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (parent) parent.appendChild(node);
  return node;
};
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const outline = `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
export const ENEMY_ART = {
  drone: `<svg viewBox="0 0 60 60" aria-hidden="true" focusable="false"><path d="M30 6V14" fill="none" ${outline}/><circle cx="30" cy="5" r="3.5" fill="#ff6a6a" ${outline}/><circle cx="30" cy="34" r="22" fill="#8fd694" ${outline}/><circle cx="30" cy="31" r="10" fill="#fffdf8" ${outline}/><circle cx="32" cy="32" r="4.5" fill="${INK}"/><path d="M12 48 5 54M48 48 55 54" fill="none" ${outline}/></svg>`,
  zig: `<svg viewBox="0 0 60 60" aria-hidden="true" focusable="false"><path d="M30 3 38 20 57 18 44 32 54 50 34 44 30 57 26 44 6 50 16 32 3 18 22 20Z" fill="#b57cff" ${outline}/><circle cx="23" cy="29" r="4.5" fill="#fffdf8" ${outline}/><circle cx="37" cy="29" r="4.5" fill="#fffdf8" ${outline}/><circle cx="24" cy="30" r="1.8" fill="${INK}"/><circle cx="36" cy="30" r="1.8" fill="${INK}"/></svg>`,
  saucer: `<svg viewBox="0 0 60 60" aria-hidden="true" focusable="false"><path d="M18 30C18 16 42 16 42 30Z" fill="#cfe7ff" ${outline}/><ellipse cx="30" cy="34" rx="26" ry="11" fill="#b9c2d6" ${outline}/><circle cx="14" cy="35" r="3.2" fill="#ffd166" ${outline}/><circle cx="30" cy="40" r="3.2" fill="#ff6a6a" ${outline}/><circle cx="46" cy="35" r="3.2" fill="#ffd166" ${outline}/><circle cx="30" cy="24" r="4" fill="${INK}"/></svg>`,
};
const KINDS = {
  drone: { hp: 30, r: 22, speed: 72, fire: 0, tier: 0 },
  zig: { hp: 44, r: 22, speed: 96, fire: 0, tier: 2 },
  saucer: { hp: 64, r: 27, speed: 58, fire: 2.8, tier: 3 },
};

const hearts = count => Array.from({ length: HEARTS }, (_, i) =>
  `<svg viewBox="0 0 24 24" class="${i < count ? 'is-on' : ''}" aria-hidden="true" focusable="false"><path d="M12 21C4 15 2 10 2 7a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 3-2 8-10 14Z" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/></svg>`).join('');

export const pickupArt = (reward, stickerArt) => {
  if (reward.kind === 'gear') {
    return `<svg viewBox="0 0 60 60" aria-hidden="true" focusable="false"><rect x="6" y="8" width="48" height="44" rx="6" fill="#2f6fd6" ${outline}/><path d="M12 18H48M12 26H48M12 34H48M12 42H48M20 12V48M40 12V48" fill="none" stroke="#bcd6ff" stroke-width="1.4"/>${gearIcon(reward.id).replace('<svg ', '<svg x="14" y="14" width="32" height="32" ')}</svg>`;
  }
  if (reward.kind === 'paint') {
    const color = PAINTS.find(item => item.id === reward.id)?.color ?? '#ff8a65';
    return `<svg viewBox="0 0 60 60" aria-hidden="true" focusable="false"><rect x="8" y="12" width="44" height="36" rx="5" fill="#2f6fd6" ${outline}/><path d="M14 22H46M14 30H46M14 38H46M22 16V44M38 16V44" fill="none" stroke="#bcd6ff" stroke-width="1.6"/><circle cx="30" cy="30" r="9" fill="${color}" ${outline}/></svg>`;
  }
  return `<svg viewBox="0 0 60 60" aria-hidden="true" focusable="false"><circle cx="30" cy="30" r="27" fill="#fffdf8" ${outline}/>${stickerArt?.[reward.id] ? `<g transform="translate(9 9) scale(.7)">${stickerArt[reward.id]}</g>` : ''}</svg>`;
};

export function mountRoam(ctx) {
  const {
    stage, world, shipEl, ship, shipW, shipH, shipR, W, H, rng, rm, classIndex, stickerArt, live,
    loadout, getReward, takeReward, kick, onFly,
  } = ctx;

  const layer = el('div', 'ps-roam-layer', world);
  const turrets = (loadout.turrets.length ? loadout.turrets : [gearById('pulse-blaster')]).filter(Boolean).slice(0, 2)
    .map((item, slot, all) => ({ item, cool: 0.2 + slot * 0.15, side: all.length === 1 ? 0 : slot ? 1 : -1 }));
  const shieldItem = loadout.shield ?? null;

  // ---------- ship fittings ----------
  for (const mount of turrets) {
    const node = el('span', `ps-roam-turret ps-roam-turret--${mount.side < 0 ? 'l' : mount.side > 0 ? 'r' : 'c'}`, shipEl);
    node.innerHTML = turretSprite(mount.item.id);
  }
  const bubble = shieldItem ? el('div', 'ps-roam-shield', layer) : null;
  const bubbleSize = Math.round(shipW * 2.1);
  if (bubble) {
    bubble.style.cssText = `width:${bubbleSize}px;height:${bubbleSize}px;left:${-bubbleSize / 2}px;top:${-bubbleSize / 2}px`;
    bubble.innerHTML = shieldSprite(shieldItem.id);
  }

  // ---------- hud ----------
  const kinds = Object.keys(KINDS).filter(name => KINDS[name].tier <= classIndex);
  const hud = el('div', 'ps-roam-hud', stage);
  hud.innerHTML = `<span class="ps-roam-hearts" role="img" aria-label=""></span>
    <span class="ps-roam-shieldbar" hidden><i></i></span>
    <span class="ps-roam-quota" role="img" aria-label="">${[...kinds.map(name => `<span data-kind="${name}"><span class="ps-roam-quota-art">${ENEMY_ART[name]}</span><b>0</b>/${DROP_EVERY}</span>`), `<span data-kind="${ORE}"><span class="ps-roam-quota-art">${ORE_ART}</span><b>0</b>/${DROP_EVERY}</span>`].join('')}</span>
    <span class="ps-roam-count"><b data-seen>0</b> discovered · <b data-cargo>0</b> found</span>`;
  const heartsEl = hud.querySelector('.ps-roam-hearts');
  const barEl = hud.querySelector('.ps-roam-shieldbar');
  const cargoEl = hud.querySelector('[data-cargo]');
  const seenEl = hud.querySelector('[data-seen]');
  const discovered = new Set();
  const quotaEl = hud.querySelector('.ps-roam-quota');
  const banner = el('p', 'ps-roam-banner', stage);
  banner.setAttribute('role', 'status');
  const card = el('aside', 'ps-roam-card', stage);
  card.setAttribute('role', 'group');
  card.setAttribute('aria-label', 'About this space object');
  card.innerHTML = '<b class="ps-roam-card-name"></b><span class="ps-roam-card-fact"></span><span class="ps-roam-card-acts"><button type="button" data-act="hear">Hear it</button><button type="button" data-act="go">Fly there</button></span>';
  const cardName = card.querySelector('.ps-roam-card-name');
  const cardFact = card.querySelector('.ps-roam-card-fact');
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function';
  if (!canSpeak) card.querySelector('[data-act="hear"]').hidden = true;
  let cardBody = null;
  let cardTimer = 0;

  // ---------- state ----------
  let hp = HEARTS;
  let grace = 0;
  let shieldHits = shieldItem ? shieldItem.hits : 0;
  let shieldRegen = 0;
  let kills = 0;
  let found = 0;
  let bannerTimer = 0;
  let spawnIn = 1.2;
  const chips = [...kinds, ORE];
  const quota = Object.fromEntries(chips.map(name => [name, 0]));
  const enemies = [];
  const shots = [];
  const bolts = [];
  const pickups = [];
  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
  };

  const showHearts = () => {
    heartsEl.innerHTML = hearts(hp);
    heartsEl.setAttribute('aria-label', `${hp} of ${HEARTS} hearts`);
  };
  const showBar = () => {
    if (!shieldItem) return;
    barEl.hidden = false;
    barEl.style.setProperty('--hits', shieldItem.hits);
    barEl.firstElementChild.style.width = `${Math.round(shieldHits / shieldItem.hits * 100)}%`;
    barEl.setAttribute('aria-label', `${shieldItem.name}: ${shieldHits} of ${shieldItem.hits} hits left`);
    barEl.setAttribute('role', 'img');
    barEl.style.setProperty('--shield', shieldItem.color);
  };
  const say = (text, ms = 1800) => {
    banner.textContent = text;
    banner.classList.add('is-on');
    live.textContent = text;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => banner.classList.remove('is-on'), ms);
  };

  // The name-and-fact card for a science object: shown when first approached and again every time the child taps it.
  const hideCard = () => {
    clearTimeout(cardTimer);
    card.classList.remove('is-on');
    stage.classList.remove('has-card');
    cardBody = null;
  };
  const armCard = ms => {
    clearTimeout(cardTimer);
    cardTimer = setTimeout(hideCard, ms);
  };
  const showCard = body => {
    if (!body?.name) return;
    const text = factText(body);
    cardBody = body;
    cardName.textContent = body.name;
    cardFact.textContent = body.fact;
    card.classList.add('is-on');
    stage.classList.add('has-card');
    banner.classList.remove('is-on');
    live.textContent = '';
    later(() => { live.textContent = text; }, 40);
    armCard(readMs(text));
  };
  const speak = body => {
    if (!canSpeak || !body) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const talk = new SpeechSynthesisUtterance(`${body.name.replace('*', ' star')}. ${body.fact}`);
    talk.rate = 0.9;
    synth.speak(talk);
  };
  card.addEventListener('click', e => {
    const act = e.target.closest('button')?.dataset.act;
    if (act === 'hear' && cardBody) { speak(cardBody); armCard(readMs(factText(cardBody))); }
    if (act === 'go') { const body = cardBody; hideCard(); if (body) onFly?.(body); }
  });
  card.addEventListener('pointerenter', () => clearTimeout(cardTimer));
  card.addEventListener('pointerleave', () => { if (cardBody) armCard(3000); });
  card.addEventListener('focusin', () => clearTimeout(cardTimer));
  card.addEventListener('focusout', () => { if (cardBody) armCard(3000); });
  const showQuota = () => {
    for (const name of chips) quotaEl.querySelector(`[data-kind="${name}"] b`).textContent = Math.min(quota[name], DROP_EVERY);
    quotaEl.setAttribute('aria-label', `Zap or mine ${DROP_EVERY} of one kind for a find. ${chips.map(name => `${name} ${quota[name]} of ${DROP_EVERY}`).join(', ')}`);
  };
  showHearts();
  showBar();
  showQuota();

  // ---------- effects ----------
  const pop = (x, y, color, word) => {
    if (layer.childElementCount > 160) return;
    const node = el('div', 'ps-roam-pop', layer);
    node.style.cssText = `transform:translate3d(${x}px,${y}px,0);--c:${color}`;
    node.innerHTML = Array.from({ length: 8 }, (_, i) => `<i style="--a:${i * 45}deg"></i>`).join('') + (word ? `<b>${word}</b>` : '');
    later(() => node.remove(), 700);
  };
  const ring = (x, y, radius, color) => {
    const node = el('div', 'ps-roam-ring', layer);
    node.style.cssText = `transform:translate3d(${x}px,${y}px,0);--r:${radius}px;--c:${color}`;
    later(() => node.remove(), 600);
  };

  // ---------- enemies ----------
  const spawnEnemy = () => {
    const kinds = Object.keys(KINDS).filter(name => KINDS[name].tier <= classIndex);
    const name = kinds[Math.floor(rng() * kinds.length)];
    const spec = KINDS[name];
    const angle = rng() * Math.PI * 2;
    const far = Math.max(stage.clientWidth, stage.clientHeight) * 0.55 + 100;
    const x = clamp(ship.x + Math.cos(angle) * far, 60, W - 60);
    const y = clamp(ship.y + Math.sin(angle) * far, 60, H - 60);
    const hpMax = Math.round(spec.hp * (1 + classIndex * 0.1));
    const node = el('div', `ps-roam-enemy ps-roam-enemy--${name}`, layer);
    node.style.cssText = `width:${spec.r * 2}px;height:${spec.r * 2}px;left:${-spec.r}px;top:${-spec.r}px`;
    node.innerHTML = `${ENEMY_ART[name]}<i class="ps-roam-hp"><b></b></i>`;
    enemies.push({ name, spec, x, y, vx: 0, vy: 0, hp: hpMax, hpMax, phase: rng() * 6, fire: spec.fire * (0.5 + rng()), push: 0, node, bar: node.querySelector('.ps-roam-hp b'), barBox: node.querySelector('.ps-roam-hp') });
  };

  const removeEnemy = enemy => {
    enemy.node.remove();
    enemies.splice(enemies.indexOf(enemy), 1);
  };

  const hurtEnemy = (enemy, damage) => {
    enemy.hp -= damage;
    enemy.node.classList.add('is-hit');
    later(() => enemy.node.classList.remove('is-hit'), 90);
    if (enemy.hp > 0) return;
    kills += 1;
    pop(enemy.x, enemy.y, '#ffd166', 'POW!');
    play('boom');
    earn(enemy.name, enemy.x, enemy.y, `${DROP_EVERY} ${enemy.name}s zapped! Something dropped. Grab it!`);
    removeEnemy(enemy);
  };

  // Every 5 of one kind (zapped or mined) turns into a drop, if there is room in the cargo.
  const earn = (key, x, y, message) => {
    quota[key] += 1;
    if (quota[key] >= DROP_EVERY && getReward()) {
      quota[key] -= DROP_EVERY;
      dropPickup(x, y);
      say(message, 2200);
    }
    showQuota();
  };
  const mine = (x, y) => {
    pop(x, y, '#9fd8ff', 'ORE');
    earn(ORE, x, y, `${DROP_EVERY} ore mined! Something dropped. Grab it!`);
  };

  const spawnShot = ({ x, y, angle, speed, damage, pierce, kind, color, friendly = true, homing = false, scale = 1 }) => {
    const node = el('div', `ps-roam-shot${friendly ? '' : ' is-enemy'}`, layer);
    if (friendly && kind) node.innerHTML = projectileSVG(kind);
    else node.style.background = '#ff5c5c';
    shots.push({
      x, y, vx: Math.sin(angle) * speed, vy: -Math.cos(angle) * speed, damage, pierce, friendly, homing, scale,
      life: SHOT_LIFE, hit: new Set(), node, color, speed,
    });
  };

  // ---------- pickups ----------
  const dropPickup = (x, y) => {
    const reward = getReward();
    if (!reward) return;
    const node = el('div', `ps-roam-pickup ps-roam-pickup--${reward.kind}`, layer);
    node.innerHTML = pickupArt(reward, stickerArt);
    node.setAttribute('aria-hidden', 'true');
    pickups.push({ x, y, node, t: rng() * 6 });
  };

  // ---------- ship hits ----------
  const hitShip = (from) => {
    if (grace > 0) return;
    if (shieldHits > 0) {
      shieldHits -= 1;
      shieldRegen = shieldItem.regenSec;
      showBar();
      play('block');
      bubble.classList.add('is-block');
      later(() => bubble.classList.remove('is-block'), 160);
      pop(ship.x, ship.y - shipH * 0.3, shieldItem.color);
      if (shieldItem.effect === 'absorb' && hp < HEARTS) { hp += 1; showHearts(); say('Healed! +1 heart', 900); }
      if (shieldItem.effect === 'nova') {
        ring(ship.x, ship.y, 190, shieldItem.color);
        for (const enemy of [...enemies]) if (Math.hypot(enemy.x - ship.x, enemy.y - ship.y) < 190) hurtEnemy(enemy, 30);
      }
      if (from) grace = 0.25;
      return;
    }
    hp -= 1;
    grace = HURT_GRACE;
    kick(7);
    play('hurt');
    pop(ship.x, ship.y, '#ff6a6a', 'OUCH!');
    if (hp <= 0) {
      hp = HEARTS;
      grace = REBOOT_GRACE;
      shieldHits = shieldItem ? shieldItem.hits : 0;
      showBar();
      say('Systems rebooted! Back in the fight.');
    }
    showHearts();
  };

  // ---------- firing ----------
  const nearestEnemy = (x, y, range) => {
    let best = null;
    let bestD = range;
    for (const enemy of enemies) {
      const d = Math.hypot(enemy.x - x, enemy.y - y);
      if (d < bestD) { best = enemy; bestD = d; }
    }
    return best;
  };

  // Turrets always aim at the nearest enemy; the ship's heading only moves the muzzle.
  const fireTurret = (mount, foe) => {
    const { item } = mount;
    const heading = ship.heading ?? 0;
    const fx = Math.sin(heading);
    const fy = -Math.cos(heading);
    const x = ship.x + Math.cos(heading) * mount.side * shipW * 0.34 + fx * shipH * 0.12;
    const y = ship.y + Math.sin(heading) * mount.side * shipW * 0.34 + fy * shipH * 0.12;
    const aim = Math.atan2(foe.x - x, -(foe.y - y));
    const base = { x, y, speed: item.speed, damage: item.damage, pierce: item.pierce, kind: item.id, color: item.color };
    const px = Math.cos(aim) * 7;
    const py = Math.sin(aim) * 7;
    play('shoot', item.pattern === 'homing' ? 'missile' : item.pattern === 'beam' ? 'beam' : item.damage >= 50 ? 'big' : 'single');
    if (item.pattern === 'single') spawnShot({ ...base, angle: aim, scale: item.damage >= 50 ? 1.7 : 1 });
    else if (item.pattern === 'twin') { spawnShot({ ...base, x: x - px, y: y - py, angle: aim }); spawnShot({ ...base, x: x + px, y: y + py, angle: aim }); }
    else if (item.pattern === 'spread3') for (const deg of [-15, 0, 15]) spawnShot({ ...base, angle: aim + deg * Math.PI / 180 });
    else if (item.pattern === 'homing') spawnShot({ ...base, angle: aim + mount.side * 0.25, homing: true, scale: 1.2 });
    else if (item.pattern === 'beam') {
      const dirX = Math.sin(aim);
      const dirY = -Math.cos(aim);
      const hits = enemies.map(enemy => {
        const ax = enemy.x - x;
        const ay = enemy.y - y;
        return { enemy, along: ax * dirX + ay * dirY, side: Math.abs(ax * dirY - ay * dirX) };
      }).filter(h => h.along > 0 && h.along < BEAM_RANGE && h.side < h.enemy.spec.r + 30)
        .sort((a, b) => a.along - b.along).slice(0, item.pierce + 1);
      const reach = hits.length ? hits[hits.length - 1].along : BEAM_RANGE;
      const endX = x + dirX * reach;
      const endY = y + dirY * reach;
      const jag = Array.from({ length: 7 }, (_, i) => {
        const t = i / 6;
        const jit = i && i < 6 ? (rng() - 0.5) * 24 : 0;
        return `${(x + (endX - x) * t - dirY * jit).toFixed(0)},${(y + (endY - y) * t + dirX * jit).toFixed(0)}`;
      }).join(' ');
      const minX = Math.min(x, endX) - 40;
      const minY = Math.min(y, endY) - 40;
      const boxW = Math.abs(endX - x) + 80;
      const boxH = Math.abs(endY - y) + 80;
      const bolt = el('div', 'ps-roam-bolt', layer);
      bolt.style.cssText = `left:${minX}px;top:${minY}px;width:${boxW}px;height:${boxH}px`;
      bolt.innerHTML = `<svg viewBox="${minX} ${minY} ${boxW} ${boxH}" width="100%" height="100%" aria-hidden="true" focusable="false"><polyline points="${jag}" fill="none" stroke="${INK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${jag}" fill="none" stroke="${item.color}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${jag}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
      bolts.push({ node: bolt, life: 0.14 });
      for (const hit of hits) { hurtEnemy(hit.enemy, item.damage); pop(hit.enemy.x, hit.enemy.y, item.color); }
    }
  };

  say('Free roam! Touch and drag anywhere to fly. Tap a planet or star to learn about it. Take the wormholes!', 6200);

  const wanted = 5 + Math.floor(classIndex / 2);

  const reset = () => {
    hideCard();
    for (const enemy of [...enemies]) removeEnemy(enemy);
    for (const shot of shots) shot.node.remove();
    shots.length = 0;
    for (const item of pickups) item.node.remove();
    pickups.length = 0;
    spawnIn = 2.5;
  };

  // ---------- per frame ----------
  function update(dt, clock) {
    grace = Math.max(0, grace - dt);
    shipEl.classList.toggle('is-flicker', !rm && grace > 0 && Math.floor(clock * 14) % 2 === 0);

    spawnIn -= dt;
    if (enemies.length < wanted && spawnIn <= 0) { spawnEnemy(); spawnIn = 1.2 + rng() * 1.6; }

    if (shieldItem) {
      if (shieldHits < shieldItem.hits) {
        shieldRegen -= dt;
        if (shieldRegen <= 0) { shieldHits += 1; shieldRegen = shieldItem.regenSec; showBar(); }
      }
      bubble.style.transform = `translate3d(${ship.x}px,${ship.y}px,0)`;
      bubble.style.opacity = shieldHits > 0 ? String(0.55 + 0.45 * (shieldHits / shieldItem.hits)) : '0';
    }

    // turrets
    const target = nearestEnemy(ship.x, ship.y, FIRE_RANGE);
    for (const mount of turrets) {
      mount.cool -= dt;
      if (target && mount.cool <= 0) { fireTurret(mount, target); mount.cool = mount.item.cooldownMs / 1000; }
    }

    // enemies
    for (const enemy of [...enemies]) {
      const dx = ship.x - enemy.x;
      const dy = ship.y - enemy.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > LOSE_DISTANCE) { removeEnemy(enemy); continue; }
      enemy.phase += dt * 2.4;
      let desX = 0;
      let desY = 0;
      if (enemy.name === 'saucer') {
        const hold = 270;
        const k = d > hold ? 1 : -0.6;
        desX = (dx / d) * enemy.spec.speed * k - (dy / d) * enemy.spec.speed * 0.6;
        desY = (dy / d) * enemy.spec.speed * k + (dx / d) * enemy.spec.speed * 0.6;
        enemy.fire -= dt;
        if (enemy.fire <= 0 && d < 620) {
          enemy.fire = enemy.spec.fire;
          spawnShot({ x: enemy.x, y: enemy.y, angle: Math.atan2(dx, -dy), speed: 190, damage: 1, pierce: 0, friendly: false });
        }
      } else if (enemy.name === 'zig') {
        desX = (dx / d) * enemy.spec.speed + Math.sin(enemy.phase) * 70 * (-dy / d);
        desY = (dy / d) * enemy.spec.speed + Math.sin(enemy.phase) * 70 * (dx / d);
      } else {
        desX = (dx / d) * enemy.spec.speed;
        desY = (dy / d) * enemy.spec.speed;
      }
      enemy.vx += (desX - enemy.vx) * Math.min(1, dt * 3);
      enemy.vy += (desY - enemy.vy) * Math.min(1, dt * 3);
      enemy.x = clamp(enemy.x + enemy.vx * dt, 30, W - 30);
      enemy.y = clamp(enemy.y + enemy.vy * dt, 30, H - 30);
      if (d < enemy.spec.r + shipR + 4) {
        hitShip(enemy);
        enemy.vx = -dx / d * 260;
        enemy.vy = -dy / d * 260;
        enemy.x -= dx / d * 40;
        enemy.y -= dy / d * 40;
      }
      enemy.node.style.transform = `translate3d(${enemy.x}px,${enemy.y}px,0) rotate(${rm ? 0 : (Math.sin(enemy.phase * 0.7) * 8).toFixed(1)}deg)`;
      if (enemy.hp < enemy.hpMax) {
        enemy.barBox.classList.add('is-on');
        enemy.bar.style.width = `${Math.max(0, enemy.hp / enemy.hpMax * 100)}%`;
      }
    }

    // shots
    for (const shot of [...shots]) {
      shot.life -= dt;
      if (shot.homing) {
        const foe = nearestEnemy(shot.x, shot.y, 460);
        if (foe) {
          const want = Math.atan2(foe.x - shot.x, -(foe.y - shot.y));
          const have = Math.atan2(shot.vx, -shot.vy);
          let diff = want - have;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const turn = clamp(diff, -3.4 * dt, 3.4 * dt);
          shot.vx = Math.sin(have + turn) * shot.speed;
          shot.vy = -Math.cos(have + turn) * shot.speed;
        }
      }
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      let gone = shot.life <= 0 || shot.x < -40 || shot.x > W + 40 || shot.y < -40 || shot.y > H + 40;
      if (!gone && shot.friendly) {
        for (const enemy of [...enemies]) {
          if (shot.hit.has(enemy)) continue;
          if (Math.hypot(enemy.x - shot.x, enemy.y - shot.y) < enemy.spec.r + 10 * shot.scale) {
            shot.hit.add(enemy);
            pop(shot.x, shot.y, shot.color ?? '#ffd166');
            hurtEnemy(enemy, shot.damage);
            if (shot.hit.size > shot.pierce) { gone = true; break; }
          }
        }
      } else if (!gone) {
        if (Math.hypot(ship.x - shot.x, ship.y - shot.y) < shipR + 8) {
          if (shieldHits > 0 && shieldItem.effect === 'reflect' && grace <= 0) {
            shieldHits -= 1;
            shieldRegen = shieldItem.regenSec;
            showBar();
            play('block');
            shot.friendly = true;
            shot.damage = 30;
            shot.pierce = 1;
            shot.vx *= -1;
            shot.vy *= -1;
            shot.hit.clear();
            shot.life = SHOT_LIFE;
            shot.node.classList.remove('is-enemy');
            shot.node.style.background = shieldItem.color;
            shot.color = shieldItem.color;
            pop(ship.x, ship.y - shipH * 0.25, shieldItem.color, 'BOING!');
          } else {
            hitShip(null);
            gone = true;
          }
        }
      }
      if (gone) {
        shot.node.remove();
        shots.splice(shots.indexOf(shot), 1);
      } else {
        const rot = Math.atan2(shot.vx, -shot.vy) * 180 / Math.PI;
        shot.node.style.transform = `translate3d(${shot.x}px,${shot.y}px,0) rotate(${rot.toFixed(1)}deg) scale(${shot.scale})`;
      }
    }

    for (const bolt of [...bolts]) {
      bolt.life -= dt;
      if (bolt.life <= 0) { bolt.node.remove(); bolts.splice(bolts.indexOf(bolt), 1); }
    }

    // pickups
    for (const item of [...pickups]) {
      item.t += dt;
      item.node.style.transform = `translate3d(${item.x}px,${(item.y + Math.sin(item.t * 2.2) * 6).toFixed(1)}px,0) rotate(${(Math.sin(item.t * 1.4) * 8).toFixed(1)}deg)`;
      if (Math.hypot(ship.x - item.x, ship.y - item.y) < PICKUP_RADIUS + shipR) {
        const reward = takeReward();
        pickups.splice(pickups.indexOf(item), 1);
        item.node.remove();
        if (reward) {
          found += 1;
          cargoEl.textContent = found;
          play('pickup');
          pop(item.x, item.y, '#ffd166', 'FOUND!');
          say(`Schematic found: ${schematicLabel(reward)}. Print it with a Print test.`, 3600);
        } else {
          say('Cargo hold is full. Take a Print test to print your schematics!', 3600);
        }
      }
    }
  }

  return {
    update,
    reset,
    say,
    card: showCard,
    hideCard,
    mine,
    // A named science object found for the first time on this trip (wormholes are doors, not finds).
    discover(body) {
      if (body.kind === 'worm' || discovered.has(body.name)) return;
      discovered.add(body.name);
      seenEl.textContent = discovered.size;
    },
    stats: () => ({ kills, found, discovered: discovered.size }),
    destroy() {
      for (const id of timers) clearTimeout(id);
      timers.clear();
      clearTimeout(bannerTimer);
      clearTimeout(cardTimer);
      if (canSpeak) window.speechSynthesis.cancel();
    },
  };
}
