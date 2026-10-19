import test from 'node:test';
import assert from 'node:assert/strict';
import { CLASSES } from '../js/space-academy/pitstop/data.mjs';
import { loadShip, shipData } from '../js/space-academy/pitstop/ships/index.mjs';
import { STAGE, fitCrop, framePoints } from '../js/space-academy/pitstop/bay-fit.mjs';
import { armPair, toStage } from '../js/space-academy/pitstop/arms.mjs';

// Real crops: Pixel 9 / 360x640 / 390x844 portrait phones, the landscape side column and a laptop column.
const CROPS = [
  { width: 380, height: 247 }, { width: 322, height: 173 }, { width: 352, height: 228 },
  { width: 353, height: 316 }, { width: 483, height: 260 },
];
const PLATE = 22;
const MARGIN = 0.1;

const jointsOf = part => (part.joints.length ? part.joints : [{ x: 150, y: 210 }]);

test('every part of every class keeps its weld points and both torches inside the bay crop with a 10% margin', async () => {
  let checked = 0;
  for (const info of CLASSES) {
    await loadShip(info.id);
    for (const part of shipData(info.id).parts) {
      const points = framePoints(jointsOf(part).map(toStage));
      for (const crop of CROPS) {
        const { scale, ox, oy } = fitCrop(points, { ...crop, inset: PLATE });
        const visible = crop.height - PLATE;
        for (const point of points) {
          const x = ox + point.x * scale;
          const y = oy + point.y * scale;
          const where = `${info.id}/${part.id} in ${crop.width}x${crop.height}`;
          assert.ok(x >= crop.width * MARGIN - 0.01 && x <= crop.width * (1 - MARGIN) + 0.01, `${where}: x ${x.toFixed(1)}`);
          assert.ok(y >= visible * MARGIN - 0.01 && y <= visible * (1 - MARGIN) + 0.01, `${where}: y ${y.toFixed(1)}`);
        }
        assert.ok(scale * STAGE >= crop.width * 0.85, `${info.id}/${part.id}: the stage still fills most of the crop width`);
        checked += 1;
      }
    }
  }
  assert.ok(checked >= 200);
});

test('a small part is zoomed in but never past 1.5x, and the frame is centred on it', () => {
  const crop = { width: 380, height: 274, inset: PLATE };
  const fit = fitCrop([{ x: 180, y: 150 }], crop);
  assert.equal(fit.zoom, 1.5);
  assert.ok(Math.abs(fit.ox + 180 * fit.scale - crop.width / 2) < 1);
  assert.ok(Math.abs(fit.oy + 150 * fit.scale - (crop.height - PLATE) / 2) < 1);
});

test('the torch always reaches the seam it is sent to, even far below the arm bases', () => {
  const tip = svg => svg.match(/<g transform="translate\(([\d.-]+) ([\d.-]+)\) rotate/g).map(item => item.match(/translate\(([\d.-]+) ([\d.-]+)\)/).slice(1).map(Number));
  for (const joint of [{ x: 150, y: 400 }, { x: 40, y: 380 }, { x: 260, y: 330 }, { x: 150, y: 60 }]) {
    const target = toStage(joint);
    const [left] = tip(armPair([joint], { focus: joint, working: false }));
    assert.ok(Math.hypot(left[0] - target.x, left[1] - target.y) < 0.2, `torch reaches ${JSON.stringify(joint)}`);
  }
});
