import { getWakeWindow } from './data.js';
import { getProfile, saveProfile, getEntries, addEntry, updateEntry, deleteEntry, getOpenEntry, clearAll } from './store.js';
import { predictNextTired } from './prediction.js';
import { ageFromBirthDate, formatTime, formatDuration, formatMinutes, isNightSleep, isToday, startOfDay, formatDate } from './utils.js';

// --- DOM References ---
const views = {
  setup: document.getElementById('view-setup'),
  dashboard: document.getElementById('view-dashboard'),
  history: document.getElementById('view-history'),
  settings: document.getElementById('view-settings'),
};

let updateInterval = null;

// --- Navigation ---
function showView(name) {
  Object.values(views).forEach(v => v.hidden = true);
  views[name].hidden = false;
  // Re-trigger animation
  views[name].style.animation = 'none';
  views[name].offsetHeight; // reflow
  views[name].style.animation = '';
}

// --- Toast ---
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.hidden = true; }, 2000);
}

// --- Setup ---
document.getElementById('setup-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('child-name').value.trim();
  const birthDate = document.getElementById('birth-date').value;
  if (!birthDate) return;
  saveProfile({ childName: name || 'Baby', birthDate });
  showDashboard();
  showToast('Profile created!');
});

// --- Dashboard ---
function showDashboard() {
  const profile = getProfile();
  if (!profile) {
    showView('setup');
    return;
  }

  showView('dashboard');

  // Header
  document.getElementById('child-display-name').textContent = profile.childName || 'Baby';
  const age = ageFromBirthDate(profile.birthDate);
  document.getElementById('child-age').textContent = age.label;

  // Wake window info
  const ww = getWakeWindow(new Date(profile.birthDate));
  if (ww) {
    document.getElementById('wake-window-range').textContent = `${formatMinutes(ww.minWake)} – ${formatMinutes(ww.maxWake)}`;
    document.getElementById('nap-count').textContent = ww.naps[0] === ww.naps[1] ? `${ww.naps[0]}/day` : `${ww.naps[0]}–${ww.naps[1]}/day`;
    document.getElementById('total-sleep').textContent = `${ww.totalSleepHrs[0]}–${ww.totalSleepHrs[1]} hours`;
  }

  updatePrediction();
  updateSleepButton();
  renderTodayLog();

  // Auto-update every 30 seconds
  clearInterval(updateInterval);
  updateInterval = setInterval(() => {
    updatePrediction();
    updateSleepButton();
  }, 30000);
}

// --- Prediction Rendering ---
function updatePrediction() {
  const profile = getProfile();
  const entries = getEntries();
  const prediction = predictNextTired(profile, entries);
  const container = document.getElementById('prediction-content');

  if (prediction.status === 'no_data' || prediction.status === 'no_entries') {
    container.innerHTML = `<p class="no-data-text">Log your baby's first sleep to get predictions</p>`;
    return;
  }

  if (prediction.status === 'sleeping') {
    const elapsed = Date.now() - prediction.since;
    container.innerHTML = `
      <div class="sleeping-text">Sleeping</div>
      <div class="sleeping-since">since ${formatTime(prediction.since)} (${formatDuration(elapsed)})</div>
    `;
    return;
  }

  // Status: awake
  const { progress, urgency, awakeMinutes, earliestTired, predictedTired, latestTired, wakeWindow } = prediction;

  // Ring colors
  const colors = {
    relaxed: '#5cbbfc',
    getting_tired: '#fcb95c',
    tired: '#fc7c5c',
    overtired: '#fc5c6a',
  };
  const ringColor = colors[urgency];

  // SVG ring
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(progress, 1));

  // Time remaining until predicted tired
  const remainingMs = predictedTired - Date.now();
  let centerText, centerLabel;

  if (remainingMs <= 0) {
    centerText = formatMinutes(awakeMinutes);
    centerLabel = 'awake';
  } else {
    centerText = formatDuration(remainingMs);
    centerLabel = 'until tired';
  }

  const overtiredHtml = urgency === 'overtired'
    ? `<div class="overtired-warning">Likely overtired!</div>`
    : '';

  container.innerHTML = `
    <div class="ring-container">
      <svg viewBox="0 0 200 200">
        <circle class="ring-bg" cx="100" cy="100" r="${radius}"/>
        <circle class="ring-progress" cx="100" cy="100" r="${radius}"
          stroke="${ringColor}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${dashOffset}"/>
      </svg>
      <div class="ring-center">
        <div class="ring-time" style="color: ${ringColor}">${centerText}</div>
        <div class="ring-label">${centerLabel}</div>
      </div>
    </div>
    ${overtiredHtml}
    <div class="prediction-times">
      <div class="prediction-time">
        <div class="label">Earliest</div>
        <div class="time">${formatTime(earliestTired)}</div>
      </div>
      <div class="prediction-time">
        <div class="label">Likely</div>
        <div class="time" style="color: ${ringColor}">${formatTime(predictedTired)}</div>
      </div>
      <div class="prediction-time">
        <div class="label">Latest</div>
        <div class="time">${formatTime(latestTired)}</div>
      </div>
    </div>
  `;
}

// --- Sleep Toggle Button ---
function updateSleepButton() {
  const btn = document.getElementById('btn-sleep-toggle');
  const label = document.getElementById('btn-sleep-label');
  const openEntry = getOpenEntry();

  if (openEntry) {
    label.textContent = 'Woke Up';
    btn.classList.add('sleeping');
  } else {
    label.textContent = 'Fell Asleep';
    btn.classList.remove('sleeping');
  }
}

document.getElementById('btn-sleep-toggle').addEventListener('click', () => {
  const openEntry = getOpenEntry();
  const now = Date.now();

  if (openEntry) {
    // End sleep
    updateEntry(openEntry.id, { sleepEnd: now });
    showToast('Sleep ended');
  } else {
    // Start sleep
    const entry = {
      id: `entry_${now}`,
      sleepStart: now,
      sleepEnd: null,
      type: isNightSleep(now) ? 'night' : 'nap',
    };
    addEntry(entry);
    showToast('Sleep started');
  }

  updatePrediction();
  updateSleepButton();
  renderTodayLog();
});

// --- Today's Log ---
function renderTodayLog() {
  const entries = getEntries().filter(e => isToday(e.sleepStart)).sort((a, b) => b.sleepStart - a.sleepStart);
  const container = document.getElementById('today-log');

  if (entries.length === 0) {
    container.innerHTML = `<p class="empty-state">No sleep logged today</p>`;
    return;
  }

  container.innerHTML = entries.map(e => {
    const endText = e.sleepEnd ? formatTime(e.sleepEnd) : 'sleeping...';
    const duration = e.sleepEnd ? formatDuration(e.sleepEnd - e.sleepStart) : '...';
    return `
      <div class="log-entry">
        <div class="log-entry-info">
          <div class="log-dot ${e.type}"></div>
          <div>
            <div class="log-times">${formatTime(e.sleepStart)} – ${endText}</div>
            <div class="log-type">${e.type}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="log-duration">${duration}</span>
          <button class="log-delete" data-id="${e.id}" aria-label="Delete">&times;</button>
        </div>
      </div>
    `;
  }).join('');

  // Delete handlers
  container.querySelectorAll('.log-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteEntry(btn.dataset.id);
      renderTodayLog();
      updatePrediction();
      updateSleepButton();
      showToast('Entry deleted');
    });
  });
}

// --- History ---
document.getElementById('btn-history').addEventListener('click', () => {
  showView('history');
  renderHistory();
});

document.getElementById('btn-back-history').addEventListener('click', showDashboard);

function renderHistory() {
  const entries = getEntries().filter(e => e.sleepEnd !== null).sort((a, b) => b.sleepStart - a.sleepStart);
  const container = document.getElementById('history-content');

  if (entries.length === 0) {
    container.innerHTML = `<p class="empty-state">No sleep data yet</p>`;
    return;
  }

  // Group by day
  const days = {};
  for (const e of entries) {
    const dayKey = startOfDay(e.sleepStart);
    if (!days[dayKey]) days[dayKey] = [];
    days[dayKey].push(e);
  }

  let html = '';
  for (const [dayMs, dayEntries] of Object.entries(days).sort((a, b) => b[0] - a[0])) {
    const totalSleepMs = dayEntries.reduce((sum, e) => sum + (e.sleepEnd - e.sleepStart), 0);
    const napCount = dayEntries.filter(e => e.type === 'nap').length;

    html += `
      <div class="history-day">
        <div class="history-day-header">
          <h4>${formatDate(Number(dayMs))}</h4>
          <span class="day-summary">${formatDuration(totalSleepMs)} total · ${napCount} nap${napCount !== 1 ? 's' : ''}</span>
        </div>
        <div class="card log-card">
          ${dayEntries.map(e => `
            <div class="log-entry">
              <div class="log-entry-info">
                <div class="log-dot ${e.type}"></div>
                <div>
                  <div class="log-times">${formatTime(e.sleepStart)} – ${formatTime(e.sleepEnd)}</div>
                  <div class="log-type">${e.type}</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span class="log-duration">${formatDuration(e.sleepEnd - e.sleepStart)}</span>
                <button class="log-delete" data-id="${e.id}" aria-label="Delete">&times;</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  // Delete handlers
  container.querySelectorAll('.log-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteEntry(btn.dataset.id);
      renderHistory();
      showToast('Entry deleted');
    });
  });
}

// --- Settings ---
document.getElementById('btn-settings').addEventListener('click', () => {
  showView('settings');
  const profile = getProfile();
  if (profile) {
    document.getElementById('settings-name').value = profile.childName || '';
    document.getElementById('settings-birthdate').value = profile.birthDate || '';
  }
});

document.getElementById('btn-back-settings').addEventListener('click', showDashboard);

document.getElementById('settings-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('settings-name').value.trim();
  const birthDate = document.getElementById('settings-birthdate').value;
  if (!birthDate) return;
  saveProfile({ childName: name || 'Baby', birthDate });
  showDashboard();
  showToast('Settings saved');
});

document.getElementById('btn-clear-data').addEventListener('click', () => {
  if (confirm('Delete all data? This cannot be undone.')) {
    clearAll();
    clearInterval(updateInterval);
    showView('setup');
    showToast('All data cleared');
  }
});

// --- Init ---
function init() {
  const profile = getProfile();
  if (profile) {
    showDashboard();
  } else {
    showView('setup');
  }

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();
