// Wake window data based on pediatric sleep best practices
// Sources: Cleveland Clinic, Taking Cara Babies, Huckleberry

export const WAKE_WINDOWS = [
  { minAgeWeeks: 0,  maxAgeWeeks: 4,   minWake: 30,  maxWake: 60,  naps: [4, 5], totalSleepHrs: [14, 17], label: '0–4 weeks' },
  { minAgeWeeks: 4,  maxAgeWeeks: 12,  minWake: 60,  maxWake: 90,  naps: [4, 5], totalSleepHrs: [14, 17], label: '4–12 weeks' },
  { minAgeMonths: 3, maxAgeMonths: 5,  minWake: 75,  maxWake: 120, naps: [3, 4], totalSleepHrs: [12, 16], label: '3–4 months' },
  { minAgeMonths: 5, maxAgeMonths: 7,  minWake: 120, maxWake: 180, naps: [2, 3], totalSleepHrs: [12, 16], label: '5–7 months' },
  { minAgeMonths: 7, maxAgeMonths: 10, minWake: 150, maxWake: 210, naps: [2, 3], totalSleepHrs: [12, 16], label: '7–10 months' },
  { minAgeMonths: 10, maxAgeMonths: 14, minWake: 180, maxWake: 240, naps: [1, 2], totalSleepHrs: [11, 14], label: '10–14 months' },
  { minAgeMonths: 14, maxAgeMonths: 24, minWake: 240, maxWake: 360, naps: [1, 1], totalSleepHrs: [11, 14], label: '14–24 months' },
  { minAgeMonths: 24, maxAgeMonths: 42, minWake: 330, maxWake: 390, naps: [0, 1], totalSleepHrs: [10, 13], label: '2–3 years' },
];

/**
 * Get wake window bracket for a given age.
 * @param {Date} birthDate
 * @returns {object|null} matching wake window bracket
 */
export function getWakeWindow(birthDate) {
  const now = new Date();
  const ageMs = now - birthDate;
  const ageWeeks = ageMs / (7 * 24 * 60 * 60 * 1000);
  const ageMonths = (now.getFullYear() - birthDate.getFullYear()) * 12
    + (now.getMonth() - birthDate.getMonth())
    + (now.getDate() >= birthDate.getDate() ? 0 : -1);

  // For babies under 3 months, use week-based brackets
  if (ageMonths < 3) {
    for (const w of WAKE_WINDOWS) {
      if (w.minAgeWeeks !== undefined && ageWeeks >= w.minAgeWeeks && ageWeeks < w.maxAgeWeeks) {
        return w;
      }
    }
  }

  // For 3+ months, use month-based brackets
  for (const w of WAKE_WINDOWS) {
    if (w.minAgeMonths !== undefined && ageMonths >= w.minAgeMonths && ageMonths < w.maxAgeMonths) {
      return w;
    }
  }

  // Fallback: return last bracket for older children
  return WAKE_WINDOWS[WAKE_WINDOWS.length - 1];
}
