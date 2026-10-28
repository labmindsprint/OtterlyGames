import { blankSave, validateSave } from './progress.mjs';

const DATABASE = 'otterly-pit-stop';
const STORE = 'save';
const KEY = 'save';

export class SaveConflict extends Error {}

// Keeps the latest saved journey in memory; every commit re-checks the stored revision so two tabs cannot overwrite each other.
export class PitSave {
  constructor(factory = globalThis.indexedDB) {
    this.factory = factory;
    this.database = null;
    this.state = blankSave();
  }

  async open() {
    if (!this.factory) throw new Error('This browser has site storage switched off, so progress cannot be saved. Turn on site storage or leave private browsing, then reload.');
    this.database = await new Promise((resolve, reject) => {
      const request = this.factory.open(DATABASE, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => { database.close(); this.database = null; };
        resolve(database);
      };
      request.onerror = () => reject(new Error(`Saves could not be opened: ${request.error?.message ?? 'storage denied'}`));
      request.onblocked = () => reject(new Error('Another tab is holding the save. Close other Space Academy tabs and reload.'));
    });
    const stored = await this.run(store => store.get(KEY));
    this.state = stored === undefined ? blankSave() : validateSave(stored);
    await this.run(store => { store.put('probe', 'probe'); return store.delete('probe'); });
    return this.state;
  }

  run(action) {
    if (!this.database) return Promise.reject(new Error('The save is closed. Reload the page.'));
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.database.transaction(STORE, 'readwrite');
        const request = action(transaction.objectStore(STORE));
        transaction.oncomplete = () => resolve(request?.result);
        transaction.onabort = () => reject(transaction.error ?? new Error('The save was not written.'));
      } catch (error) {
        reject(new Error(`Saves are unavailable: ${error.message}`));
      }
    });
  }

  async commit(next) {
    validateSave(next);
    const database = this.database;
    if (!database) throw new Error('The save is closed. Reload the page.');
    const expectedRevision = this.state.revision;
    await new Promise((resolve, reject) => {
      let failure = null;
      const transaction = database.transaction(STORE, 'readwrite');
      const store = transaction.objectStore(STORE);
      const read = store.get(KEY);
      read.onsuccess = () => {
        const current = read.result === undefined ? this.state : read.result;
        if (current.revision !== expectedRevision) {
          this.state = validateSave(current);
          failure = new SaveConflict('Another tab changed this journey. The latest progress was loaded; try that again.');
          transaction.abort();
          return;
        }
        store.put(next, KEY);
      };
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('The save was not written.'));
    });
    this.state = next;
    return next;
  }
}
