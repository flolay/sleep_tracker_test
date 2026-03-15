/**
 * Calculate age from birth date, returns { months, weeks, label }
 */
export function ageFromBirthDate(birthDateStr) {
  const birth = new Date(birthDateStr);
  const now = new Date();
  const ageMs = now - birth;
  const ageWeeks = Math.floor(ageMs / (7 * 24 * 60 * 60 * 1000));
  const ageMonths = (now.getFullYear() - birth.getFullYear()) * 12
    + (now.getMonth() - birth.getMonth())
    + (now.getDate() >= birth.getDate() ? 0 : -1);

  let label;
  if (ageMonths < 3) {
    label = `${ageWeeks} week${ageWeeks !== 1 ? 's' : ''} old`;
  } else if (ageMonths < 24) {
    label = `${ageMonths} month${ageMonths !== 1 ? 's' : ''} old`;
  } else {
    const years = Math.floor(ageMonths / 12);
    const remaining = ageMonths % 12;
    label = remaining > 0
      ? `${years} year${years !== 1 ? 's' : ''}, ${remaining} month${remaining !== 1 ? 's' : ''} old`
      : `${years} year${years !== 1 ? 's' : ''} old`;
  }

  return { months: ageMonths, weeks: ageWeeks, label };
}

/**
 * Format a timestamp to HH:MM
 */
export function formatTime(ms) {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a duration in ms to a readable string like "1h 30m"
 */
export function formatDuration(ms) {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 1) return '< 1m';
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Format minutes to a readable string
 */
export function formatMinutes(min) {
  min = Math.round(min);
  if (min < 1) return '< 1m';
  const hours = Math.floor(min / 60);
  const mins = min % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Determine if a sleep start time is "night" sleep (6pm-6am)
 */
export function isNightSleep(startMs) {
  const hour = new Date(startMs).getHours();
  return hour >= 18 || hour < 6;
}

/**
 * Get start of day (midnight) for a given timestamp
 */
export function startOfDay(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Check if a timestamp is today
 */
export function isToday(ms) {
  return startOfDay(ms) === startOfDay(Date.now());
}

/**
 * Format a date for display (e.g., "Mon, Mar 15")
 */
export function formatDate(ms) {
  return new Date(ms).toLocaleDateString([], {
    weekday: 'short', month: 'short', day: 'numeric'
  });
}
