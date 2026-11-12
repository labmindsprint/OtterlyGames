import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getGrade } from '../js/space-academy/curriculum.mjs';

// Data loading and route rules for the Maths Path, kept free of other scripts so build-site.mjs can import it.
export const HUB = '/learn/maths/';
const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const classRoute = (cls) => `${HUB}${cls.id}/`;
export const chapterRoute = (cls, chapter) => `${HUB}${cls.id}/${chapter.id}/`;

// _data/maths-path.json is the ordered index; each class lives in _data/maths-path/<id>.json so classes can be authored in parallel.
export function loadData(root = defaultRoot) {
  const index = JSON.parse(readFileSync(join(root, '_data', 'maths-path.json'), 'utf8'));
  if (!Array.isArray(index.classes) || index.classes.some((id) => typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id))) throw new Error('_data/maths-path.json must list class ids, for example ["pp1","class-1"].');
  const classes = index.classes.map((id) => {
    const file = join(root, '_data', 'maths-path', `${id}.json`);
    if (!existsSync(file)) throw new Error(`Missing _data/maths-path/${id}.json for class "${id}".`);
    let cls;
    try { cls = JSON.parse(readFileSync(file, 'utf8')); } catch (error) { throw new Error(`_data/maths-path/${id}.json is not valid JSON: ${error.message}`); }
    if (cls.id !== id) throw new Error(`_data/maths-path/${id}.json must have "id": "${id}".`);
    return cls;
  });
  return { version: index.version, classes };
}

// Old Space Academy discovery pages replaced by the Maths Path; each redirects to the chapter that teaches it (or the class map).
export function redirects(data = loadData()) {
  const out = [{ from: '/learn/imo-preparation.html', to: '/learn/olympiad-style-maths-preparation.html' }];
  if (data.classes.some((c) => c.live)) out.push({ from: '/learn/olympiad/', to: HUB });
  for (const cls of data.classes.filter((c) => c.live)) {
    const grade = cls.grade ?? cls.id;
    const base = `/learn/olympiad/${grade}/`;
    out.push({ from: base, to: classRoute(cls) });
    const teaches = new Map();
    for (const chapter of cls.chapters) {
      const [g, id] = (chapter.source ?? `${cls.id}/${chapter.id}`).split('/');
      if (g === grade && !teaches.has(id)) teaches.set(id, chapter);
    }
    for (const old of getGrade(grade).chapters) {
      const chapter = teaches.get(old.id);
      out.push({ from: `${base}${old.id}.html`, to: chapter ? chapterRoute(cls, chapter) : classRoute(cls) });
    }
  }
  return out;
}
