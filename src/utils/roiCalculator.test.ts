import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRetentionRoi } from './roiCalculator';

test('calculateRetentionRoi computes positive savings and scales with cohort size', () => {
  const single = calculateRetentionRoi({ weeklyPages: 100, cohortSize: 1, track: 'academic' });
  const team = calculateRetentionRoi({ weeklyPages: 100, cohortSize: 10, track: 'academic' });

  assert.ok(single.hoursSavedPerMonth > 0);
  assert.equal(team.hoursSavedPerMonth, single.hoursSavedPerMonth * 10);
  assert.equal(single.recommendedTier, 'Individual Pro');
  assert.equal(team.recommendedTier, 'Department Cohort');
});

test('calculateRetentionRoi recommends Enterprise Global for large teams', () => {
  const enterprise = calculateRetentionRoi({ weeklyPages: 250, cohortSize: 120, track: 'enterprise' });
  assert.equal(enterprise.recommendedTier, 'Enterprise Global');
  assert.ok(enterprise.annualProductivityValueUsd > 100000);
  assert.equal(enterprise.projected90DayRetention, 88);
});
