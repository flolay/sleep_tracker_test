import { formatMinutes } from './utils.js';

const PREF_KEY = 'sleep_notifications_enabled';
let lastNotifiedUrgency = null;

export function isEnabled() {
  return localStorage.getItem(PREF_KEY) === 'true' && Notification.permission === 'granted';
}

export function setEnabled(enabled) {
  localStorage.setItem(PREF_KEY, enabled ? 'true' : 'false');
}

export async function requestPermission() {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function checkAndNotify(prediction, childName) {
  if (!isEnabled()) return;

  // Reset tracking when child falls asleep
  if (prediction.status !== 'awake') {
    lastNotifiedUrgency = null;
    return;
  }

  const { urgency, awakeMinutes } = prediction;
  const name = childName || 'Baby';
  const awakeStr = formatMinutes(awakeMinutes);

  // Notify on key transitions (only once per level)
  if (urgency === 'getting_tired' && lastNotifiedUrgency !== 'getting_tired') {
    sendNotification(
      'Nap time approaching',
      `${name} has been awake for ${awakeStr} — consider starting the nap routine.`
    );
    lastNotifiedUrgency = 'getting_tired';
  } else if (urgency === 'overtired' && lastNotifiedUrgency !== 'overtired') {
    sendNotification(
      'Likely overtired',
      `${name} has been awake for ${awakeStr} — past the recommended wake window!`
    );
    lastNotifiedUrgency = 'overtired';
  }
}

function sendNotification(title, body) {
  try {
    const n = new Notification(title, {
      body,
      icon: 'assets/favicon.svg',
      badge: 'assets/favicon.svg',
      tag: 'sleep-reminder',
      renotify: true,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // SW context — use registration.showNotification instead
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          icon: 'assets/favicon.svg',
          tag: 'sleep-reminder',
          renotify: true,
        });
      });
    }
  }
}
