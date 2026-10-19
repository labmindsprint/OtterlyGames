// Renders sample questions from a bank 3 grade module as PNG contact sheets, with the game's own markup and styles,
// so pictures and wording can be reviewed by eye before a module is integrated.
// Usage: node scripts\space-academy-bank3-gallery.mjs <grade> <module file> <output folder> [--family id] [--level 1|2|3] [--per 2] [--perpage 3] [--width 1100] [--all]
// By default only the module's own families are shown; --all adds every family used by the grade's plan.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { answerChoice, diagram, escapeHTML } from '../js/space-academy/art.mjs';
import { BANK3_MODULES } from '../js/space-academy/bank3-index.mjs';
import { createBank, createMission } from '../js/space-academy/questions.mjs';

const args = process.argv.slice(2);
const [gradeId, moduleFile, outputFolder] = args;
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index < 0 ? fallback : args[index + 1];
};
if (!gradeId || !moduleFile || !outputFolder) {
  console.error('Usage: node scripts\\space-academy-bank3-gallery.mjs <grade> <module file> <output folder> [--family id] [--level 1|2|3] [--per 2] [--perpage 3] [--width 1100] [--all]');
  process.exit(2);
}

const module = await import(pathToFileURL(resolve(moduleFile)).href);
// The picture renderers look modules up here, so an unfinished module can be drawn without being integrated.
BANK3_MODULES[gradeId] = module;
const bank = createBank({ [gradeId]: module });
const grade = bank.grades.find(item => item.id === gradeId);
const planned = [...new Set(grade.chapters.flatMap(chapter => chapter.families.flat()))];
const wanted = option('family') ? [option('family')] : args.includes('--all') ? planned : Object.keys(module.FAMILIES ?? {});
const levels = option('level') ? [Number(option('level'))] : [1, 2, 3];
const per = Number(option('per', 2));
const perPage = Number(option('perpage', 3));
const width = Number(option('width', 1100));

const cards = [];
for (const family of wanted) {
  for (const level of levels) {
    const rows = grade.chapters.filter(chapter => chapter.families[level - 1].includes(family));
    const found = new Map();
    for (let seed = 0; seed < 80 && found.size < per && rows.length; seed++) {
      for (const chapter of rows) {
        const mission = createMission({ grade: gradeId, chapter: chapter.id, level, seed: `gal-${seed}`, contentVersion: 3 }, bank);
        for (const question of mission.questions) {
          if (question.family === family && found.size < per && !found.has(question.id)) found.set(question.id, { chapter: chapter.id, question });
        }
      }
    }
    for (const { chapter, question } of found.values()) cards.push({ family, level, chapter, question });
  }
}
if (!cards.length) {
  console.error('No questions found for the chosen family and level.');
  process.exit(1);
}

const letter = index => String.fromCharCode(65 + index);
const card = ({ family, level, chapter, question }) => {
  const pictures = question.optionVisuals?.some(Boolean);
  const options = question.options.map((_, index) => `<button type="button" class="sa-answer${question.optionVisuals?.[index] ? ' sa-answer--picture' : ''}"><span class="sa-answer-letter" aria-hidden="true">${letter(index)}</span>${answerChoice(question, index)}</button>`).join('');
  const review = question.options.map((_, index) => `${letter(index)}: ${index === question.correctIndex ? 'CORRECT' : escapeHTML(question.feedback[index].code)}`).join(' | ');
  return `<article class="gal-card"><p class="gal-meta">${escapeHTML(family)} / level ${level} / ${escapeHTML(chapter)}</p>
<section class="sa-app" data-screen="mission"><div class="sa-content"><div class="sa-quiz"><div class="sa-question-layout"><div class="sa-question-card${pictures ? ' sa-question-card--pictures' : ''}"><div class="sa-question-main"><h2>${escapeHTML(question.prompt)}</h2>${diagram(question.visual)}</div>
<div class="sa-question-side"><div class="sa-answers${pictures ? ' sa-answers--pictures' : ''}"${pictures ? ` data-art="${escapeHTML(question.optionVisuals.find(Boolean).kind)}"` : ''}>${options}</div></div></div></div></div></div></section>
<p class="gal-review">${review}</p><p class="gal-review">Hint: ${escapeHTML(question.hint)}</p></article>`;
};

const css = ['base', 'components', 'space-academy', 'campaign-activities'].map(name => `<link rel="stylesheet" href="${pathToFileURL(resolve(`css/${name}.css`)).href}">`).join('');
mkdirSync(resolve(outputFolder), { recursive: true });
const pages = [];
for (let start = 0; start < cards.length; start += perPage) {
  const file = resolve(join(outputFolder, `${gradeId}-${String(pages.length + 1).padStart(2, '0')}.html`));
  writeFileSync(file, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css}
<style>body{margin:0;padding:10px;background:#fff}.gal-card{margin:0 0 14px;padding:6px;border:1px dashed #b8b4a3}.gal-meta,.gal-review{margin:3px 0;font:12px/1.4 monospace;color:#444}
.gal-card .sa-app{height:auto!important;overflow:visible!important}.gal-card .sa-app>.sa-content{flex:none!important;overflow:visible!important}</style></head>
<body>${cards.slice(start, start + perPage).map(card).join('')}</body></html>`);
  pages.push(file);
}

const shoot = `import sys
from playwright.sync_api import sync_playwright
width = int(sys.argv[1])
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': width, 'height': 900})
    for html in sys.argv[2:]:
        page.goto('file:///' + html.replace('\\\\', '/'))
        page.wait_for_timeout(250)
        page.screenshot(path=html[:-5] + '.png', full_page=True)
    browser.close()
`;
const result = spawnSync('python', ['-X', 'utf8', '-c', shoot, String(width), ...pages], { encoding: 'utf8' });
if (result.status !== 0) {
  console.error(result.stderr || result.stdout || 'The screenshot step failed.');
  process.exit(1);
}
console.log(`${cards.length} questions on ${pages.length} page(s):`);
for (const page of pages) console.log(page.replace(/\.html$/, '.png'));
