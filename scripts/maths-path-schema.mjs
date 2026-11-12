import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getChapter, getGrade } from '../js/space-academy/curriculum.mjs';
import { WIDGETS } from '../js/maths-path/widgets.mjs';

export const GAME_IDS = ['space-academy', 'clock-master', 'math-tank'];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BANNED = /\b(IMO|SOF)\b/;
const MAX_SENTENCE = 150;

// Returns a list of plain-language problems (empty when the data is valid). Used by the generator and the tests.
export function dataProblems(data, { root } = {}) {
  const out = [];
  const bad = (where, message) => out.push(`${where}: ${message}`);
  const text = (where, value, { min = 1, max = 400 } = {}) => {
    if (typeof value !== 'string' || value.trim().length < min) { bad(where, `needs text (${min}+ characters)`); return false; }
    if (value.length > max) bad(where, `is ${value.length} characters; keep it to ${max} or fewer`);
    if (BANNED.test(value)) bad(where, 'must not name IMO or SOF; say "Olympiad-style"');
    return true;
  };
  const checkWidget = (where, spec) => {
    const module = spec && WIDGETS[spec.w];
    if (!module) return bad(where, `unknown widget "${spec?.w}". Known: ${Object.keys(WIDGETS).join(', ')}`);
    try {
      const html = module.render(spec.c ?? {});
      if (/undefined|NaN|\[object/.test(html)) bad(where, `widget "${spec.w}" rendered undefined or NaN; check its config`);
    } catch (error) { bad(where, `widget "${spec.w}" config is invalid: ${error.message}`); }
  };
  const seen = new Set();
  for (const cls of data.classes) {
    const c = `class ${cls.id}`;
    if (seen.has(cls.id)) bad(c, 'duplicate class id');
    seen.add(cls.id);
    for (const field of ['label', 'name', 'ages', 'blurb']) text(`${c}.${field}`, cls[field]);
    if (!Array.isArray(cls.chapters) || cls.chapters.length < 1) { bad(c, 'needs a chapters array'); continue; }
    if (cls.live) {
      try { getGrade(cls.grade); } catch { bad(c, `live classes need "grade" to be a Space Academy grade id (got "${cls.grade}")`); }
    }
    const ids = new Set();
    for (const ch of cls.chapters) {
      const where = `${cls.id}/${ch.id}`;
      if (!SLUG.test(ch.id ?? '')) bad(where, 'chapter id must be lower-case letters, digits and hyphens');
      if (ids.has(ch.id)) bad(where, 'duplicate chapter id in this class');
      ids.add(ch.id);
      text(`${where}.title`, ch.title, { max: 60 });
      text(`${where}.tagline`, ch.tagline, { min: 10, max: 140 });
      if (!Array.isArray(ch.outcomes) || ch.outcomes.length < 3) bad(where, 'needs at least 3 outcomes');
      else ch.outcomes.forEach((o, i) => { if (text(`${where}.outcomes[${i}]`, o, { max: 80 }) && !/^I can /.test(o)) bad(`${where}.outcomes[${i}]`, 'must start with "I can "'); });
      if (ch.source !== undefined || cls.live) {
        const [grade, id] = (ch.source ?? `${cls.id}/${ch.id}`).split('/');
        try { getChapter(grade, id); } catch { bad(where, `source "${ch.source ?? `${cls.id}/${ch.id}`}" is not a Space Academy chapter`); }
      }
      if (!cls.live) continue;
      if (!Array.isArray(ch.vocab) || ch.vocab.length < 2) bad(where, 'needs at least 2 vocabulary words');
      else ch.vocab.forEach((v, i) => { text(`${where}.vocab[${i}].term`, v.term, { max: 40 }); text(`${where}.vocab[${i}].meaning`, v.meaning, { max: MAX_SENTENCE }); });
      if (!Array.isArray(ch.see) || ch.see.length < 3 || ch.see.length > 5) bad(where, 'See it needs 3 to 5 screens');
      else ch.see.forEach((s, i) => {
        const w = `${where}.see[${i}]`;
        text(`${w}.title`, s.title, { max: 60 });
        if (!Array.isArray(s.text) || s.text.length < 1 || s.text.length > 4) bad(w, 'text must be 1 to 4 short sentences');
        else s.text.forEach((t, j) => text(`${w}.text[${j}]`, t, { max: MAX_SENTENCE }));
        checkWidget(`${w}.widget`, s.widget);
        if (s.art && root) {
          const isPath = s.art.startsWith('/images/');
          const file = isPath ? join(root, ...s.art.slice(1).split('/')) : join(root, 'images', 'ringo', `ringo-${s.art}-bust.webp`);
          if (isPath && !/\.(webp|png|jpe?g)$/i.test(s.art)) bad(w, `art "${s.art}" must be a raster image (.webp, .png or .jpg)`);
          else if (!existsSync(file)) bad(w, `unknown art "${s.art}" (a Ringo name from images/ringo/ringo-<name>-bust.webp, or an /images/... raster path)`);
        }
      });
      if (!Array.isArray(ch.try) || ch.try.length < 1) bad(where, 'Try it needs at least 1 activity');
      else ch.try.forEach((a, i) => {
        const w = `${where}.try[${i}]`;
        text(`${w}.prompt`, a.prompt, { max: 200 }); text(`${w}.success`, a.success, { max: 200 }); text(`${w}.hint`, a.hint, { max: 200 });
        checkWidget(`${w}.widget`, a.widget);
        if (typeof a.target !== 'object' || a.target === null) bad(w, 'needs a target object for the widget to check');
      });
      if (!GAME_IDS.includes(ch.play?.game)) bad(where, `play.game must be one of ${GAME_IDS.join(', ')}`);
      if (!Array.isArray(ch.tools)) bad(where, 'tools must be an array (it may be empty)');
      else for (const t of ch.tools) if (root && !existsSync(join(root, ...t.slice(1).split('/')))) bad(where, `tool page ${t} does not exist`);
      if (ch.parents) {
        text(`${where}.parents.idea`, ch.parents.idea); text(`${where}.parents.slip`, ch.parents.slip);
        if (!ch.parents.tryAtHome?.steps?.length) bad(where, 'parents.tryAtHome needs a title and steps');
      }
    }
  }
  return out;
}
