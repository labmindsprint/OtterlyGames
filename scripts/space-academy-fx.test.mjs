import assert from 'node:assert/strict';
import test from 'node:test';
import { FLIGHT_MS, FLIGHT_REDUCED_MS, flightFrame } from '../js/space-academy/art.mjs';
import { CRAFTS } from '../js/space-academy/campaign-crafts.mjs';
import { jointsFor } from '../js/space-academy/craft-joints.mjs';
import { DESTINATIONS } from '../js/space-academy/destinations.mjs';
import {
  COMPLETE_MS, FIT_MS, IMPACT_MS, REDUCED_MS, SPARKS_PER_JOINT, STEAM_PER_JOINT, flightFit, flightStage, hashSeed, jetPlan,
  mulberry32, planFit, styleFor, worldLook,
} from '../js/space-academy/fx.mjs';

const PARTS = ['engine', 'body', 'cockpit', 'nose', 'left-fin', 'right-fin'];
const allPlans = (options = {}) => Object.keys(CRAFTS).flatMap(grade => PARTS.map(part => planFit({ grade, part, ...options })));

test('the seeded generator is reproducible and never touches Math.random', () => {
  const first = mulberry32(hashSeed('pp1:engine'));
  const again = mulberry32(hashSeed('pp1:engine'));
  const other = mulberry32(hashSeed('pp1:body'));
  const run = random => Array.from({ length: 8 }, () => random());
  const values = run(first);
  assert.deepEqual(values, run(again));
  assert.notDeepEqual(values, run(other));
  assert.ok(values.every(value => value >= 0 && value < 1));
  const original = Math.random;
  Math.random = () => { throw new Error('planFit must not use Math.random'); };
  try { assert.deepEqual(planFit({ grade: 'class-3', part: 'nose' }), planFit({ grade: 'class-3', part: 'nose' })); }
  finally { Math.random = original; }
});

test('every craft part plans 8 to 14 sparks and 3 to 5 steam puffs per joint inside the fit window', () => {
  for (const plan of allPlans()) {
    const label = `${plan.grade}/${plan.part}`;
    const points = jointsFor(plan.grade, plan.part).points;
    assert.equal(plan.flashes.length, points.length, label);
    const share = (items, index) => items.filter(item => item.x === plan.flashes[index].x && item.y === plan.flashes[index].y).length;
    points.forEach((_, index) => {
      assert.ok(share(plan.sparks, index) >= SPARKS_PER_JOINT[0] && share(plan.sparks, index) <= SPARKS_PER_JOINT[1], `${label} sparks`);
      assert.ok(share(plan.steam, index) >= STEAM_PER_JOINT[0] && share(plan.steam, index) <= STEAM_PER_JOINT[1], `${label} steam`);
    });
    assert.ok(plan.duration > IMPACT_MS && plan.duration <= FIT_MS, `${label} lasts ${plan.duration} ms`);
    for (const item of [...plan.flashes, ...plan.sparks, ...plan.steam]) {
      assert.ok(item.x >= 0 && item.x <= 100 && item.y >= 0 && item.y <= 100, `${label} stays on the craft box`);
      assert.ok(item.delay >= IMPACT_MS && item.dur > 0, `${label} starts at the impact`);
    }
    assert.ok(plan.sparks.every(spark => spark.dy < 0 || Math.abs(spark.dx) > 0), `${label} sparks leave the joint`);
    assert.ok(plan.seam && plan.seam.len > 0, `${label} has a solder seam`);
    assert.ok(plan.settle && plan.pop && plan.ring, `${label} settles, pops and rings`);
  }
});

test('fits positions are percentages of the craft box and the seam follows the joint table', () => {
  const plan = planFit({ grade: 'pp1', part: 'left-fin' });
  const craft = CRAFTS.pp1;
  const [first] = jointsFor('pp1', 'left-fin').points;
  assert.equal(plan.flashes[0].x, Math.round(first[0] / craft.width * 100000) / 1000);
  assert.equal(plan.flashes[0].y, Math.round(first[1] / craft.height * 100000) / 1000);
  assert.equal(plan.seam.len, 46);
  assert.equal(plan.seam.angle, Math.round(Math.PI / 2 * 1000) / 1000);
  assert.equal(plan.ring.x, craft.parts.find(part => part.id === 'left-fin').x.toFixed(3) * 1);
  assert.ok(plan.settle.x < 0 && plan.settle.y === 0, 'the left fin slides in from the left');
});

test('the sixth part adds a bottom-up joint sparkle and a craft aura within the celebration window', () => {
  for (const plan of allPlans({ complete: true })) {
    const label = `${plan.grade}/${plan.part}`;
    assert.equal(plan.twinkles.length, 6, label);
    assert.ok(plan.aura, label);
    assert.ok(plan.twinkles.every((item, index) => index === 0 || item.delay > plan.twinkles[index - 1].delay), `${label} sparkle in sequence`);
    assert.ok(plan.duration > FIT_MS && plan.duration <= COMPLETE_MS, `${label} celebrates for ${plan.duration} ms`);
  }
  for (const plan of allPlans()) assert.equal(plan.twinkles.length + (plan.aura ? 1 : 0), 0);
});

test('reduced motion plans only a short soft glow at the joint', () => {
  for (const plan of allPlans({ reduced: true, complete: true })) {
    const label = `${plan.grade}/${plan.part}`;
    assert.equal(plan.glows.length, jointsFor(plan.grade, plan.part).points.length, label);
    assert.equal(plan.duration, REDUCED_MS, label);
    for (const kind of ['sparks', 'steam', 'flashes', 'twinkles']) assert.equal(plan[kind].length, 0, `${label} ${kind}`);
    assert.deepEqual([plan.settle, plan.pop, plan.ring, plan.seam, plan.aura], [null, null, null, null, null], label);
  }
});

test('unknown crafts and parts are rejected and style variables carry their units', () => {
  assert.throws(() => planFit({ grade: 'class-9', part: 'engine' }), /Unknown craft grade/);
  assert.throws(() => planFit({ grade: 'pp1', part: 'wing' }), /Unknown craft part/);
  assert.throws(() => planFit({ grade: 'constructor', part: 'engine' }), /Unknown craft grade/);
  assert.deepEqual(styleFor({ x: 12.5, y: 40, dx: -3.2, angle: 1.571, delay: 140, dur: 520, size: 4 }), {
    '--x': '12.5%', '--y': '40%', '--dx': '-3.2', '--angle': '1.571rad', '--delay': '140ms', '--dur': '520ms', '--size': '4',
  });
});

const FRAMES = Array.from({ length: FLIGHT_MS / 25 + 1 }, (_, index) => ({ time: index * 25, ...flightFrame(index * 25) }));

test('the launch takes at most nine seconds and walks countdown, ignite, liftoff, cruise, arrive in order', () => {
  assert.ok(FLIGHT_MS <= 9000 && FLIGHT_REDUCED_MS === 450);
  const order = ['countdown', 'ignite', 'liftoff', 'cruise', 'arrive'];
  let last = 0;
  for (const frame of FRAMES) {
    const index = order.indexOf(frame.phase);
    assert.ok(index >= last, `${frame.time} ms does not go back to an earlier phase`);
    last = index;
  }
  assert.deepEqual(order.map(phase => FRAMES.find(frame => frame.phase === phase)?.time), [0, 2250, 3350, 5350, 7250]);
  assert.equal(flightFrame(FLIGHT_MS - 1).progress < 1, true);
  assert.equal(flightFrame(FLIGHT_MS).progress, 1);
  assert.equal(flightFrame(FLIGHT_MS * 3).vars['flight-progress'], 1);
  assert.equal(flightFrame(-50).vars['flight-progress'], 0);
  assert.equal(flightFrame(Number.NaN).phase, 'countdown');
});

test('the 3-2-1 digits show only during the countdown and the engines stay off until ignition', () => {
  const digits = FRAMES.filter(frame => frame.digit > 0);
  assert.deepEqual([...new Set(digits.map(frame => frame.digit))], [3, 2, 1]);
  assert.ok(digits.every(frame => frame.phase === 'countdown'));
  assert.ok(FRAMES.filter(frame => frame.phase === 'countdown').every(frame => frame.digit > 0 && frame.vars.thrust === 0));
  assert.deepEqual([0, 749, 750, 1499, 1500, 2249, 2250].map(time => flightFrame(time).digit), [3, 3, 2, 2, 1, 1, 0]);
});

test('the launch variables only move forward and stay in range, with a thrust pop at ignition', () => {
  for (const name of ['flight-progress', 'lift', 'climb', 'travel', 'world', 'flash', 'bank']) {
    FRAMES.forEach((frame, index) => {
      if (index) assert.ok(frame.vars[name] >= FRAMES[index - 1].vars[name], `${name} at ${frame.time} ms never decreases`);
    });
  }
  for (const frame of FRAMES) {
    const { vars } = frame;
    for (const name of ['flight-progress', 'lift', 'climb', 'world', 'flash', 'bank', 'scroll']) assert.ok(vars[name] >= 0 && vars[name] <= 1, `${name} at ${frame.time} ms`);
    assert.ok(vars.thrust >= 0 && vars.thrust <= 1.31, `thrust at ${frame.time} ms`);
    if (frame.time < 3350) assert.equal(vars.travel, 0, `the craft is still on the pad at ${frame.time} ms`);
    if (frame.time < 5350) assert.equal(vars.world, 0, `the destination is still a point at ${frame.time} ms`);
    if (frame.time < 8000) assert.equal(vars.flash, 0, `no arrival flash at ${frame.time} ms`);
  }
  assert.ok(flightFrame(2750).vars.thrust > 1.25, 'the engines pop when they ignite');
  const last = flightFrame(FLIGHT_MS).vars;
  assert.deepEqual([last.lift, last.climb, last.world, last.flash], [1, 1, 1, 1]);
});

test('reduced motion gets one calm cruise still for 450 ms with no travel, countdown or flash', () => {
  for (const time of [0, 100, 449, 450, 9000]) {
    const frame = flightFrame(time, true);
    assert.equal(frame.phase, 'cruise');
    assert.equal(frame.digit, 0);
    assert.deepEqual([frame.vars.travel, frame.vars.scroll, frame.vars.flash], [0, 0, 0]);
    assert.ok(frame.vars.thrust <= 1 && frame.vars.bank <= 1);
  }
  assert.equal(flightFrame(449, true).progress < 1, true);
  assert.equal(flightFrame(450, true).progress, 1);
});

test('the stage keeps every craft whole at the four checked viewports', () => {
  const stages = { phone: [366, 640], landscape: [700, 250], laptop: [1100, 400], desktop: [1200, 560] };
  // Corner math for the peak bank pose of .sa-flying-rocket: 11deg about 50% 60%, 10% shift, scale .98.
  const bankedSpan = (size, ratio) => {
    const wide = size * ratio;
    const turn = 11 * Math.PI / 180;
    const xs = [[-wide / 2, -0.6 * size], [wide / 2, -0.6 * size], [-wide / 2, 0.4 * size], [wide / 2, 0.4 * size]]
      .map(([x, y]) => 0.98 * (x * Math.cos(turn) - y * Math.sin(turn)) - 0.1 * wide);
    return [Math.min(...xs), Math.max(...xs)];
  };
  for (const [grade, craft] of Object.entries(CRAFTS)) {
    for (const [name, [width, height]] of Object.entries(stages)) {
      const dropK = 0.12;
      const ratio = craft.width / craft.height;
      const fit = flightFit({ width, height, ratio, dropK });
      const label = `${grade} on ${name}`;
      assert.ok(fit.size >= 48 && fit.size * ratio <= 0.8 * width + 0.1, `${label} stays within the stage width`);
      const [left, right] = bankedSpan(fit.size, ratio);
      assert.ok(left >= -width / 2 && right <= width / 2, `${label} banked box stays inside the stage (${left.toFixed(1)}, ${right.toFixed(1)})`);
      assert.ok((fit.padTop + fit.rise) * height + fit.size * (1 - dropK + 0.1) <= 0.95 * height + 0.5, `${label} still clears the top edge at cruise height`);
      assert.ok(fit.padWidth <= width * 1.02 + 0.1 && fit.padWidth >= fit.size * ratio, `${label} pad is wide enough and fits`);
    }
  }
  assert.deepEqual(flightFit(), flightFit({ width: 1, height: 1 }));
});

test('jets sit under the measured flames and a craft with no flame gets a safe default', () => {
  const view = { width: 400, height: 400 };
  const plan = jetPlan([{ x: 150, y: 360, width: 40, height: 60 }, { x: 0, y: 0, width: 0, height: 10 }], view);
  assert.deepEqual(plan, { ratio: 1, dropK: 0.1, jets: [{ x: 42.5, y: 90, w: 10 }] });
  assert.deepEqual(jetPlan([], null), { ratio: 1, dropK: 0.12, jets: [] });
  assert.equal(jetPlan([{ x: 10, y: 0, width: 5, height: 5 }], view).dropK, 0.4);
  assert.equal(jetPlan([{ x: 10, y: 400, width: 5, height: 5 }], view).dropK, 0);
});

test('every destination is painted as a planet, star, nebula or black hole with three hex tints', () => {
  const kinds = new Set();
  for (const { id } of DESTINATIONS) {
    const look = worldLook(id);
    kinds.add(look.kind);
    assert.ok(['planet', 'star', 'deep', 'hole'].includes(look.kind), id);
    assert.equal(look.colors.length, 3, id);
    assert.ok(look.colors.every(color => /^#[0-9a-f]{6}$/.test(color)), id);
    assert.deepEqual(worldLook(id), look, `${id} looks the same every time`);
  }
  assert.deepEqual([...kinds].sort(), ['deep', 'hole', 'planet', 'star']);
  assert.equal(worldLook('saturn').ring, true);
  assert.equal(DESTINATIONS.filter(({ id }) => worldLook(id).ring).length, 1);
  assert.equal(worldLook(undefined).kind, 'deep');
});

test('the stage markup keeps the flight contract, hides decoration and stays exporter-safe', () => {
  const html = flightStage({ craft: '<svg class="sa-craft"></svg>', grade: 'class-3', destination: 'saturn', paused: true });
  assert.match(html, /<div class="sa-flight" data-flight data-elapsed="0" data-phase="countdown" data-digit="3" data-live="true"/);
  assert.match(html, /data-ring/);
  assert.match(html, /data-paused/);
  assert.match(html, /<progress class="sa-fl-meter" max="1" value="0" aria-label="Flight progress"><\/progress>/);
  assert.equal((html.match(/<svg class="sa-craft">/g) ?? []).length, 1);
  assert.deepEqual([...html.matchAll(/data-n="(\d)"/g)].map(match => match[1]), ['3', '2', '1']);
  const bare = html.replace(/<svg class="sa-craft"><\/svg>/, '');
  assert.ok(!/<(h\d|p|button|a)[\s>]/.test(bare), 'the stage carries no words except the digits');
  assert.ok(!/\p{Extended_Pictographic}/u.test(html), 'no emoji');
  assert.ok(!/\bimport\s*\(|XMLHttpRequest|WebSocket|EventSource|\bWorker\b|sendBeacon|fetch\(|new Image\(|new Audio\(/.test(html));
  assert.ok(!/["'`]\/(images|css|js|fonts|games)\//.test(html));
  assert.ok(!/data-ring/.test(flightStage({ destination: 'mars' })) && !/data-paused/.test(flightStage({ destination: 'mars' })));
  const hostile = flightStage({ grade: '"><script>x</script>', destination: '"><script>x</script>' });
  assert.ok(!hostile.includes('<script>'), 'ids are escaped');
});
