import { newSave, validateSave } from './progress.mjs';

export const DATABASE = 'otterly-space-academy';
export const STORE = 'academy';
export const SAVE_KEY = 'save';
export class SaveConflict extends Error {}

export class AcademyStorage {
  constructor(indexedDB = globalThis.indexedDB) {
    this.indexedDB = indexedDB;
    this.database = null;
  }

  async open() {
    if (!this.indexedDB) throw new Error('This browser does not provide IndexedDB storage. Use a browser with site storage enabled.');
    if (!this.database) {
      this.database = await new Promise((resolve, reject) => {
        const request = this.indexedDB.open(DATABASE, 1);
        let abandoned = false;
        request.onupgradeneeded = () => request.result.createObjectStore(STORE);
        request.onsuccess = () => {
          if (abandoned) { request.result.close(); return; }
          const database = request.result;
          database.onversionchange = () => { database.close(); this.database = null; };
          resolve(database);
        };
        request.onerror = () => reject(new Error(`Local saves could not be opened: ${request.error?.message ?? 'storage denied'}`));
        request.onblocked = () => {
          abandoned = true;
          reject(new Error('Another tab is blocking the local save. Close other Space Academy tabs and try again.'));
        };
      });
    }
    return this.read();
  }

  read() {
    return this.transaction(null, null, true);
  }

  update(expectedRevision, change) {
    return this.transaction(expectedRevision, change, false);
  }

  transaction(expectedRevision, change, probe) {
    if (!this.database) return Promise.reject(new Error('The local-save connection is closed. Reopen the game before continuing.'));
    return new Promise((resolve, reject) => {
      let transaction;
      let result;
      let failure;
      try {
        transaction = this.database.transaction(STORE, 'readwrite');
        const store = transaction.objectStore(STORE);
        if (probe) {
          store.put('storage-probe', 'probe');
          store.delete('probe');
        }
        const request = store.get(SAVE_KEY);
        request.onsuccess = () => {
          try {
            const current = request.result === undefined ? newSave() : validateSave(request.result);
            if (expectedRevision !== null && current.revision !== expectedRevision) {
              throw new SaveConflict('Another tab changed this save. Your action was not applied; the latest saved progress has been loaded.');
            }
            result = change ? validateSave(change(current)) : current;
            if (change || current !== request.result) store.put(result, SAVE_KEY);
          } catch (error) {
            failure = error;
            transaction.abort();
          }
        };
        request.onerror = () => { failure = new Error(`The local save could not be read: ${request.error?.message ?? 'read failed'}`); };
        transaction.oncomplete = () => resolve(result);
        transaction.onabort = () => reject(failure ?? new Error(`The local save was not committed: ${transaction.error?.message ?? 'storage operation failed'}`));
        transaction.onerror = () => { failure ??= new Error(`The local save failed: ${transaction.error?.message ?? 'storage operation failed'}`); };
      } catch (error) {
        if (transaction) {
          try { transaction.abort(); } catch (abortError) {
            if (abortError.name !== 'InvalidStateError') {
              reject(new Error(`The local save could not be stopped: ${abortError.message}`));
              return;
            }
          }
        }
        reject(new Error(`Local saves are unavailable: ${error.message}`));
      }
    });
  }

  close() {
    this.database?.close();
    this.database = null;
  }
}
