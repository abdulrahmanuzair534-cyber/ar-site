import test from 'node:test';
import assert from 'node:assert/strict';
import { getLocalDateString, getDayDifference } from './streakService';

test('getLocalDateString returns YYYY-MM-DD formatted date', () => {
  const d = new Date(2026, 10, 8); // Nov 8, 2026
  assert.equal(getLocalDateString(d), '2026-11-08');
});

test('getDayDifference computes calendar days accurately', () => {
  assert.equal(getDayDifference('2026-11-07', '2026-11-08'), 1);
  assert.equal(getDayDifference('2026-11-08', '2026-11-08'), 0);
  assert.equal(getDayDifference('2026-11-01', '2026-11-08'), 7);
  assert.equal(getDayDifference('2026-10-31', '2026-11-01'), 1);
});
