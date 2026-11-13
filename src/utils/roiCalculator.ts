/**
 * Enterprise Retention & Time-Savings ROI Calculator
 * Computes deterministic productivity lift based on weekly reading load and team cohort size.
 */

export type RoiTrack = 'academic' | 'medical' | 'legal' | 'enterprise';

export interface RoiInput {
  weeklyPages: number;
  cohortSize: number;
  track: RoiTrack;
}

export interface RoiProjection {
  hoursSavedPerMonth: number;
  projected90DayRetention: number;
  flashcardsSynthesizedMonthly: number;
  recommendedTier: 'Individual Pro' | 'Department Cohort' | 'Enterprise Global';
  annualProductivityValueUsd: number;
}

const TRACK_MULTIPLIERS: Record<RoiTrack, { minutesPerPageManual: number; retentionLiftPct: number; hourlyValueUsd: number }> = {
  academic: { minutesPerPageManual: 4.5, retentionLiftPct: 86, hourlyValueUsd: 35 },
  medical: { minutesPerPageManual: 6.2, retentionLiftPct: 92, hourlyValueUsd: 95 },
  legal: { minutesPerPageManual: 5.8, retentionLiftPct: 89, hourlyValueUsd: 145 },
  enterprise: { minutesPerPageManual: 4.8, retentionLiftPct: 88, hourlyValueUsd: 110 },
};

export function calculateRetentionRoi(input: RoiInput): RoiProjection {
  const pages = Math.max(10, Math.min(2000, Math.round(input.weeklyPages || 10)));
  const seats = Math.max(1, Math.min(5000, Math.round(input.cohortSize || 1)));
  const config = TRACK_MULTIPLIERS[input.track] || TRACK_MULTIPLIERS.enterprise;

  // Manual reading + note making vs OCR + AI synthesis (68% time reduction)
  const manualHoursMonthlyPerSeat = (pages * 4.33 * config.minutesPerPageManual) / 60;
  const savedHoursPerSeat = Math.round(manualHoursMonthlyPerSeat * 0.68);
  const hoursSavedPerMonth = savedHoursPerSeat * seats;

  const flashcardsSynthesizedMonthly = Math.round((pages * 4.33 * 0.65) * seats);
  const annualProductivityValueUsd = Math.round(hoursSavedPerMonth * 12 * config.hourlyValueUsd);

  const recommendedTier =
    seats <= 3
      ? 'Individual Pro'
      : seats <= 50
      ? 'Department Cohort'
      : 'Enterprise Global';

  return {
    hoursSavedPerMonth,
    projected90DayRetention: config.retentionLiftPct,
    flashcardsSynthesizedMonthly,
    recommendedTier,
    annualProductivityValueUsd,
  };
}
