import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCardTilt,
  DEFAULT_CARD_TILT,
  getCard3DTransition,
} from './flashcardMotion';

test('calculateCardTilt returns default neutral tilt when bounds are zero', () => {
  const result = calculateCardTilt(100, 100, { left: 0, top: 0, width: 0, height: 0 });
  assert.deepEqual(result, DEFAULT_CARD_TILT);
});

test('calculateCardTilt computes neutral tilt at card center', () => {
  const result = calculateCardTilt(200, 150, { left: 100, top: 50, width: 200, height: 200 }, 10);
  assert.equal(result.rotateX, 0);
  assert.equal(result.rotateY, 0);
  assert.equal(result.glareX, 50);
  assert.equal(result.glareY, 50);
});

test('calculateCardTilt clamps pointer coordinates outside card bounds', () => {
  const topLeft = calculateCardTilt(0, 0, { left: 100, top: 100, width: 200, height: 200 }, 8);
  assert.equal(topLeft.rotateX, 8);
  assert.equal(topLeft.rotateY, -8);
  assert.equal(topLeft.glareX, 0);
  assert.equal(topLeft.glareY, 0);

  const bottomRight = calculateCardTilt(500, 500, { left: 100, top: 100, width: 200, height: 200 }, 8);
  assert.equal(bottomRight.rotateX, -8);
  assert.equal(bottomRight.rotateY, 8);
  assert.equal(bottomRight.glareX, 100);
  assert.equal(bottomRight.glareY, 100);
});

test('getCard3DTransition provides distinct spatial trajectories for next, prev, and shuffle', () => {
  const next = getCard3DTransition('next');
  const prev = getCard3DTransition('prev');
  const shuffle = getCard3DTransition('shuffle');

  assert.ok(next.initial.x > 0 && next.exit.x < 0);
  assert.ok(prev.initial.x < 0 && prev.exit.x > 0);
  assert.equal(shuffle.initial.x, 0);
  assert.notEqual(shuffle.initial.rotateY, 0);
});
