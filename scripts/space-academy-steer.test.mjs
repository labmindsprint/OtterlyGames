import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ROAM_SPEED, SPRINT_BOOST, SWEEP_STEP, roamTopSpeed, readMs, factText,
  dragVector, aimVector, sweepSteps, pickBody, nearestBody,
} from '../js/space-academy/pitstop/steer.mjs';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('roam cruise is about double the old 1.5x class speed, boost on top', () => {
  for (const speed of [150, 200, 230, 270, 300, 360, 330]) {
    const ratio = roamTopSpeed(speed) / (speed * 1.5);
    assert.ok(ratio >= 1.8 && ratio <= 2.2, `ratio ${ratio}`);
  }
  assert.equal(ROAM_SPEED, 3);
  assert.ok(SPRINT_BOOST > 1);
});

test('intro cards stay up longer for longer text, within bounds', () => {
  assert.equal(readMs('Hi'), 6000);
  assert.ok(readMs('x'.repeat(100)) > readMs('x'.repeat(60)));
  assert.equal(readMs('x'.repeat(5000)), 14000);
  assert.equal(factText({ name: 'Mars', fact: 'Red.' }), 'Mars. Red.');
});

test('floating stick has a dead zone, saturates and points where the finger went', () => {
  assert.deepEqual(dragVector(3, 2), { x: 0, y: 0 });
  const full = dragVector(300, 0);
  assert.equal(full.x, 1);
  assert.equal(full.y, 0);
  const diag = dragVector(-200, -200);
  assert.ok(diag.x < 0 && diag.y < 0);
  assert.ok(Math.hypot(diag.x, diag.y) <= 1.0001);
});

test('hold-to-aim flies toward the finger and ignores a finger on the ship', () => {
  assert.deepEqual(aimVector(5, 5), { x: 0, y: 0 });
  const near = aimVector(40, 0);
  const far = aimVector(400, 0);
  assert.ok(near.x > 0 && near.x < far.x);
  assert.equal(far.x, 1);
  const up = aimVector(0, -300);
  assert.ok(up.x === 0 && up.y === -1);
});

test('a fast ship is swept in small steps so it cannot tunnel through a body', () => {
  assert.equal(sweepSteps(0), 1);
  assert.equal(sweepSteps(SWEEP_STEP), 1);
  const perFrame = 1620 / 30;
  assert.ok(perFrame / sweepSteps(perFrame) <= SWEEP_STEP);
  assert.ok(SWEEP_STEP < 2 * 46);
});

test('tapping picks the nearest named body, smaller body when they overlap', () => {
  const bodies = [
    { name: 'Big', x: 0, y: 0, r: 100 },
    { name: 'Moon', x: 60, y: 0, r: 20 },
    { name: 'Far', x: 400, y: 0, r: 30 },
    { name: 'Hidden', x: 400, y: 100, r: 30, off: true },
    { x: 700, y: 0, r: 30 },
  ];
  assert.equal(pickBody(bodies, 60, 0).name, 'Moon');
  assert.equal(pickBody(bodies, -50, 0).name, 'Big');
  assert.equal(pickBody(bodies, 400 + 30 + 30, 0).name, 'Far');
  assert.equal(pickBody(bodies, 400 + 30 + 80, 0), null);
  assert.equal(pickBody(bodies, 400, 100), null);
  assert.equal(pickBody(bodies, 700, 0), null);
});

test('a body uses its hit radius for taps when it has one', () => {
  const b = { name: 'Belt', x: 0, y: 0, r: 10, hit: 120 };
  assert.equal(pickBody([b], 100, 0), b);
  assert.equal(nearestBody([b], 500, 0, 1500), b);
  assert.equal(nearestBody([b], 5000, 0, 1500), null);
});

test('free roam wires drag steering, tap replay and the card through the shared helpers', () => {
  const flight = read('js/space-academy/pitstop/flight.mjs');
  const roam = read('js/space-academy/pitstop/roam.mjs');
  const uni = read('js/space-academy/pitstop/universe.mjs');
  assert.match(flight, /from '\.\/steer\.mjs'/);
  assert.match(flight, /pickBody/);
  assert.match(roam, /from '\.\/steer\.mjs'/);
  assert.match(flight, /aria-live/);
  assert.match(uni, /from '\.\/steer\.mjs'/);
});
