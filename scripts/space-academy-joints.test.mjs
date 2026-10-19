import test from 'node:test';
import assert from 'node:assert/strict';
import { CRAFTS, renderCraftPart } from '../js/space-academy/campaign-crafts.mjs';
import { JOINTS, jointsFor } from '../js/space-academy/craft-joints.mjs';

const GRADES = ['pp1', 'pp2', 'class-1', 'class-2', 'class-3', 'class-4', 'class-5'];
const IDS = ['engine', 'body', 'cockpit', 'nose', 'left-fin', 'right-fin'];
const MARGIN = 8;

function trayBox(grade, partId) {
  const values = renderCraftPart(grade, partId).match(/\bviewBox="([^"]+)"/)?.[1].split(' ').map(Number);
  assert.equal(values?.length, 4);
  return values;
}

const isPoint = point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite);

test('the joint table covers every part of every craft and nothing else', () => {
  assert.deepEqual(Object.keys(JOINTS), GRADES);
  let entries = 0;
  for (const grade of GRADES) {
    assert.deepEqual(Object.keys(JOINTS[grade]).sort(), [...IDS].sort(), grade);
    for (const id of IDS) {
      const joint = jointsFor(grade, id);
      assert.equal(joint, JOINTS[grade][id]);
      assert.ok(joint.points.length >= 1 && joint.points.length <= 3, `${grade}/${id} has 1 to 3 points`);
      assert.ok(joint.points.every(isPoint), `${grade}/${id} points are [x, y] pairs`);
      if (joint.seam !== undefined) assert.ok(joint.seam.length === 2 && joint.seam.every(isPoint), `${grade}/${id} seam`);
      if (joint.spread !== undefined) assert.ok(joint.spread > 0 && joint.spread <= Math.PI, `${grade}/${id} spread`);
      entries += 1;
    }
  }
  assert.equal(entries, 42);
});

test('every joint point and seam end lies in the craft viewBox and near the part tray crop', () => {
  for (const grade of GRADES) {
    const craft = CRAFTS[grade];
    for (const id of IDS) {
      const [bx, by, bw, bh] = trayBox(grade, id);
      const { points, seam = [] } = jointsFor(grade, id);
      for (const [x, y] of [...points, ...seam]) {
        const where = `${grade}/${id} (${x}, ${y})`;
        assert.ok(x >= 0 && x <= craft.width && y >= 0 && y <= craft.height, `${where} inside the craft viewBox`);
        assert.ok(x >= bx - MARGIN && x <= bx + bw + MARGIN && y >= by - MARGIN && y <= by + bh + MARGIN,
          `${where} inside the ${id} tray crop box expanded by ${MARGIN}`);
      }
    }
  }
});

test('mirrored fins keep mirrored joints within the craft viewBox tolerance', () => {
  for (const grade of GRADES) {
    const { width } = CRAFTS[grade];
    const left = jointsFor(grade, 'left-fin').points;
    const right = jointsFor(grade, 'right-fin').points;
    assert.equal(left.length, right.length, grade);
    left.forEach(([x, y], index) => {
      assert.ok(Math.abs(width - x - right[index][0]) <= 3 && Math.abs(y - right[index][1]) <= 3, `${grade} fin ${index}`);
    });
  }
});

test('the joint table is deeply frozen and rejects unknown grades or parts', () => {
  assert.ok(Object.isFrozen(JOINTS) && Object.isFrozen(JOINTS.pp1) && Object.isFrozen(JOINTS.pp1.engine));
  assert.ok(Object.isFrozen(JOINTS.pp1.engine.points) && Object.isFrozen(JOINTS.pp1.engine.points[0]));
  assert.throws(() => jointsFor('class-9', 'engine'), /Unknown craft grade/);
  assert.throws(() => jointsFor('pp1', 'wing'), /Unknown craft part/);
  assert.throws(() => jointsFor('__proto__', 'engine'), /Unknown craft grade/);
  assert.throws(() => jointsFor('pp1', 'constructor'), /Unknown craft part/);
});
