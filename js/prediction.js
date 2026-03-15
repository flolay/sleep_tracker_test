import { getWakeWindow } from './data.js';

/**
 * Predict when the child will next be tired.
 *
 * @param {object} profile - { birthDate: string }
 * @param {Array} entries - sleep entries sorted by sleepStart
 * @returns {object} prediction result
 */
export function predictNextTired(profile, entries) {
  const birthDate = new Date(profile.birthDate);
  const wakeWindow = getWakeWindow(birthDate);

  if (!wakeWindow) {
    return { status: 'no_data' };
  }

  // Check if child is currently sleeping
  const openEntry = entries.find(e => e.sleepEnd === null);
  if (openEntry) {
    return {
      status: 'sleeping',
      since: openEntry.sleepStart,
      wakeWindow,
    };
  }

  // Find the most recent completed sleep entry
  const completed = entries.filter(e => e.sleepEnd !== null);
  if (completed.length === 0) {
    return { status: 'no_entries', wakeWindow };
  }

  const latest = completed.reduce((a, b) => a.sleepEnd > b.sleepEnd ? a : b);
  const lastWoke = latest.sleepEnd;
  const now = Date.now();
  const awakeMinutes = (now - lastWoke) / 60000;

  const { minWake, maxWake } = wakeWindow;
  const midWake = (minWake + maxWake) / 2;

  const earliestTired = lastWoke + minWake * 60000;
  const predictedTired = lastWoke + midWake * 60000;
  const latestTired = lastWoke + maxWake * 60000;

  // Progress through wake window: 0 = just woke, 1 = at max wake
  const progress = Math.min(awakeMinutes / maxWake, 1.2);

  let urgency = 'relaxed'; // green
  if (awakeMinutes >= maxWake) {
    urgency = 'overtired'; // red, pulsing
  } else if (awakeMinutes >= midWake) {
    urgency = 'tired'; // coral
  } else if (awakeMinutes >= minWake) {
    urgency = 'getting_tired'; // amber
  }

  return {
    status: 'awake',
    lastWoke,
    awakeMinutes,
    earliestTired,
    predictedTired,
    latestTired,
    progress,
    urgency,
    wakeWindow,
  };
}
