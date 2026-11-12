// Local-only progress. Nothing leaves the device. Failures are reported, never hidden.
export const KEY = 'otterly.mathsPath.v1';
export const PASS_MARK = 4;
export const CHECK_LENGTH = 5;

export function createProgress(storage) {
  let memory = { chapters: {} };
  let problem = null;

  function read() {
    if (!storage) return memory;
    try {
      const raw = storage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : { chapters: {} };
      if (!parsed || typeof parsed !== 'object' || typeof parsed.chapters !== 'object' || !parsed.chapters) throw new Error('shape');
      return parsed;
    } catch (error) {
      problem = problem ?? 'read';
      return memory;
    }
  }

  function probe() {
    if (!storage) { problem = 'unavailable'; return; }
    try {
      storage.setItem(`${KEY}.probe`, '1');
      storage.removeItem(`${KEY}.probe`);
    } catch (error) { problem = 'unavailable'; }
  }
  probe();

  function write(data) {
    memory = data;
    if (!storage || problem === 'unavailable') return false;
    try { storage.setItem(KEY, JSON.stringify(data)); return true; } catch (error) { problem = 'save'; return false; }
  }

  return {
    get problem() { return problem; },
    get saves() { return problem !== 'unavailable'; },
    get(classId, chapterId) { return read().chapters[`${classId}/${chapterId}`] ?? {}; },
    all() { return read().chapters; },
    update(classId, chapterId, patch) {
      const data = read();
      const key = `${classId}/${chapterId}`;
      data.chapters[key] = { ...data.chapters[key], ...patch };
      return write(data);
    },
    recordCheck(classId, chapterId, score) {
      const old = this.get(classId, chapterId);
      const passed = Boolean(old.passed) || score >= PASS_MARK;
      return this.update(classId, chapterId, {
        best: Math.max(old.best ?? 0, score), passed, attempts: (old.attempts ?? 0) + 1,
        ...(score >= PASS_MARK && !old.passed ? { passedOn: new Date().toISOString().slice(0, 10) } : {}),
      });
    },
    reset() { return write({ chapters: {} }); },
  };
}

export function browserStorage() {
  try { return globalThis.localStorage ?? null; } catch (error) { return null; }
}

export function stateLabel(entry) {
  if (entry?.passed) return 'passed';
  if (entry?.seen || entry?.tried || entry?.attempts) return 'started';
  return 'new';
}
