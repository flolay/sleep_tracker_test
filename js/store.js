const PROFILE_KEY = 'sleep_profile';
const ENTRIES_KEY = 'sleep_entries';
const SCHEMA_KEY = 'sleep_schema_version';
const CURRENT_SCHEMA = 1;

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Profile ---

export function getProfile() {
  return read(PROFILE_KEY);
}

export function saveProfile(profile) {
  write(PROFILE_KEY, profile);
  write(SCHEMA_KEY, CURRENT_SCHEMA);
}

// --- Sleep entries ---

export function getEntries() {
  return read(ENTRIES_KEY) || [];
}

export function addEntry(entry) {
  const entries = getEntries();
  entries.push(entry);
  write(ENTRIES_KEY, entries);
}

export function updateEntry(id, patch) {
  const entries = getEntries();
  const idx = entries.findIndex(e => e.id === id);
  if (idx !== -1) {
    entries[idx] = { ...entries[idx], ...patch };
    write(ENTRIES_KEY, entries);
  }
}

export function deleteEntry(id) {
  const entries = getEntries().filter(e => e.id !== id);
  write(ENTRIES_KEY, entries);
}

export function getOpenEntry() {
  return getEntries().find(e => e.sleepEnd === null) || null;
}

export function clearAll() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(ENTRIES_KEY);
  localStorage.removeItem(SCHEMA_KEY);
}
