// Saving the project in the browser so drawings survive a page reload.
//
// First choice is IndexedDB (lots of space). If that is blocked (private mode,
// strict privacy settings), we fall back to localStorage. If both are blocked,
// the app still works; it just cannot remember anything after a reload.
// Every storage call is wrapped in try/catch so a storage error never breaks the app.

const DB_NAME = 'handwriting-font-maker';
const STORE_NAME = 'projects';
const PROJECT_KEY = 'current';
const LOCAL_STORAGE_KEY = 'handwriting-font-maker:project';

// Open (or create) the database. Resolves to the db, or null if IndexedDB is unavailable.
function openDatabase() {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch (err) {
      resolve(null);
    }
  });
}

// Remember the open database between calls.
let dbPromise = null;
function getDatabase() {
  if (!dbPromise) dbPromise = openDatabase();
  return dbPromise;
}

// Run one get / put / delete on the store. Resolves to the result, rejects on error.
function runRequest(db, mode, makeRequest) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = makeRequest(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save the project object. Resolves to true if it was saved somewhere.
export async function saveProject(project) {
  try {
    const db = await getDatabase();
    if (db) {
      await runRequest(db, 'readwrite', (store) => store.put(project, PROJECT_KEY));
      return true;
    }
  } catch (err) {
    console.warn('IndexedDB save failed, trying localStorage', err);
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
    return true;
  } catch (err) {
    console.warn('localStorage save failed', err);
    return false;
  }
}

// Load the saved project object, or null if there is none / storage is blocked.
export async function loadProject() {
  try {
    const db = await getDatabase();
    if (db) {
      const project = await runRequest(db, 'readonly', (store) => store.get(PROJECT_KEY));
      if (project) return project;
    }
  } catch (err) {
    console.warn('IndexedDB load failed, trying localStorage', err);
  }

  try {
    const text = localStorage.getItem(LOCAL_STORAGE_KEY);
    return text ? JSON.parse(text) : null;
  } catch (err) {
    console.warn('localStorage load failed', err);
    return null;
  }
}
