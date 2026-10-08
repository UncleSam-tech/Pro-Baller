/**
 * Native IndexedDB Storage Layer for Living-World Careers
 *
 * Requirements:
 * - Database name: 'pro-baller'
 * - Schema version: 1
 * - Object store: 'careerSaves'
 * - Single active save key: 'active-world-career'
 * - Pure Promise-based asynchronous operations
 * - Atomic write per save transaction
 */

import type { WorldCareerSaveV1 } from '../career/worldCareerSave';

export const DB_NAME = 'pro-baller';
export const DB_VERSION = 1;
export const STORE_NAME = 'careerSaves';
export const ACTIVE_SAVE_KEY = 'active-world-career';

/**
 * Opens or upgrades the Pro Baller IndexedDB database.
 */
export function openWorldCareerDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in the current environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB database.'));
    };

    request.onblocked = () => {
      console.warn('IndexedDB open blocked by other open connections.');
    };
  });
}

/**
 * Persists a living-world career record into IndexedDB atomically.
 */
export async function saveWorldCareer(record: WorldCareerSaveV1): Promise<void> {
  const db = await openWorldCareerDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record, ACTIVE_SAVE_KEY);

      req.onsuccess = () => {
        // Will resolve on transaction complete
      };

      req.onerror = () => {
        reject(req.error || new Error('Failed to put save record in IndexedDB.'));
      };

      tx.oncomplete = () => {
        db.close();
        resolve();
      };

      tx.onerror = () => {
        reject(tx.error || new Error('IndexedDB transaction failed while saving.'));
      };

      tx.onabort = () => {
        reject(tx.error || new Error('IndexedDB transaction aborted while saving.'));
      };
    } catch (err) {
      db.close();
      reject(err);
    }
  });
}

/**
 * Retrieves the active living-world career save record from IndexedDB.
 * Returns null if no save exists.
 */
export async function loadWorldCareer(): Promise<WorldCareerSaveV1 | null> {
  const db = await openWorldCareerDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(ACTIVE_SAVE_KEY);

      req.onsuccess = () => {
        const result = req.result as WorldCareerSaveV1 | undefined;
        db.close();
        resolve(result ?? null);
      };

      req.onerror = () => {
        db.close();
        reject(req.error || new Error('Failed to load world career from IndexedDB.'));
      };

      tx.onerror = () => {
        db.close();
        reject(tx.error || new Error('IndexedDB transaction failed while loading.'));
      };
    } catch (err) {
      db.close();
      reject(err);
    }
  });
}

/**
 * Deletes the active living-world career save record from IndexedDB.
 */
export async function deleteWorldCareer(): Promise<void> {
  const db = await openWorldCareerDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(ACTIVE_SAVE_KEY);

      req.onsuccess = () => {
        // Will resolve on transaction complete
      };

      req.onerror = () => {
        reject(req.error || new Error('Failed to delete world career from IndexedDB.'));
      };

      tx.oncomplete = () => {
        db.close();
        resolve();
      };

      tx.onerror = () => {
        reject(tx.error || new Error('IndexedDB transaction failed while deleting.'));
      };

      tx.onabort = () => {
        reject(tx.error || new Error('IndexedDB transaction aborted while deleting.'));
      };
    } catch (err) {
      db.close();
      reject(err);
    }
  });
}

/**
 * Checks whether an active living-world career save exists in IndexedDB.
 */
export async function hasWorldCareer(): Promise<boolean> {
  const db = await openWorldCareerDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count(ACTIVE_SAVE_KEY);

      req.onsuccess = () => {
        db.close();
        resolve(req.result > 0);
      };

      req.onerror = () => {
        db.close();
        reject(req.error || new Error('Failed to count world careers in IndexedDB.'));
      };
    } catch (err) {
      db.close();
      reject(err);
    }
  });
}
