import json
import sys
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8777/play/pit-stop.html'
FAKE = """
(() => {
  const log = [];
  let active = 0;
  window.__tts = { log, overlaps: 0 };
  const synth = {
    getVoices: () => [{ name: 'Fake Natural Female', lang: 'en-IN' }, { name: 'Fake Male', lang: 'en-US' }],
    speak(u) { if (active) window.__tts.overlaps += 1; active += 1; log.push({ type: 'speak', text: u.text, rate: u.rate, voice: u.voice && u.voice.name }); },
    cancel() { active = 0; log.push({ type: 'cancel' }); },
    addEventListener() {}, removeEventListener() {},
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
})();
"""
checks = []

def check(name, ok, detail=''):
    checks.append((name, bool(ok), detail))
    print(('PASS ' if ok else 'FAIL ') + name + (f'  [{detail}]' if detail else ''))

def speaks(page):
    return [e['text'] for e in page.evaluate('window.__tts.log') if e['type'] == 'speak']

def start(browser, cls, kind, preset=None):
    ctx = browser.new_context(viewport={'width': 412, 'height': 915}, is_mobile=True, has_touch=True)
    ctx.add_init_script(FAKE)
    if preset is not None:
        ctx.add_init_script(f"try {{ if (!sessionStorage.getItem('seeded')) {{ localStorage.setItem('osa-pitstop-voice', '{preset}'); sessionStorage.setItem('seeded', '1'); }} }} catch (e) {{}}")
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(f'{BASE}?test=1&demo=map&class={cls}')
    page.wait_for_function('window.__pitstop && window.__pitstop.go')
    page.wait_for_selector('.ps-map, .ps-screen')
    make = {'paper': "paperMission(c, 2)", 'print': "printTestMission(c)", 'train': "trainMission(c, classById(c).chapters ? classById(c).chapters[0].id : null, 1)"}[kind]
    page.evaluate("""async ({cls, make}) => {
      const m = await import('/js/space-academy/pitstop/missions.mjs');
      const d = await import('/js/space-academy/pitstop/data.mjs');
      const { paperMission, printTestMission } = m; const c = cls; const classById = d.classById;
      const mission = make.startsWith('paper') ? paperMission(c, 2) : printTestMission(c);
      await window.__pitstop.go('quiz', { mission });
    }""", {'cls': cls, 'make': make})
    page.wait_for_selector('.ps-qprompt')
    page.wait_for_timeout(300)
    return ctx, page, errors

with sync_playwright() as p:
    browser = p.chromium.launch()

    # Scenario 1: class-2 mock, default OFF, toggle on, answer, advance, persistence.
    ctx, page, errors = start(browser, 'class-2', 'paper')
    check('class-2 mock: auto-read is off by default', speaks(page) == [], speaks(page))
    check('speaker toggle exists and is not pressed', page.get_attribute('[data-act="voice"]', 'aria-pressed') == 'false')
    page.click('[data-act="voice"]')
    page.wait_for_timeout(300)
    first = speaks(page)
    q = page.evaluate('window.__pitstop.mission.questions[0]')
    check('turning the toggle on reads the question and the options', len(first) == 1 and 'Option A:' in first[0] and 'Option D:' in first[0], first)
    check('explanation and correct answer marker are not read', q['explanation'][:20] not in first[0] if first else False)
    rate = page.evaluate('window.__tts.log.find(e => e.type === "speak").rate')
    voice = page.evaluate('window.__tts.log.find(e => e.type === "speak").voice')
    check('rate is 0.9 and the en-IN female voice is used', rate == 0.9 and voice == 'Fake Natural Female', f'{rate} {voice}')
    check('preference persisted to localStorage', page.evaluate("localStorage.getItem('osa-pitstop-voice')") == '1')
    check('toggle is pressed', page.get_attribute('[data-act="voice"]', 'aria-pressed') == 'true')
    n = len(page.evaluate('window.__tts.log'))
    page.click(f'[data-choice="{q["correctIndex"]}"]')
    page.wait_for_timeout(200)
    log = page.evaluate('window.__tts.log')
    check('answering cancels speech and says nothing new', log[n]['type'] == 'cancel' and all(e['type'] == 'cancel' for e in log[n:]), log[n:])
    page.wait_for_timeout(1500)
    texts = speaks(page)
    q2 = page.evaluate('window.__pitstop.mission.questions[1]')
    check('next question auto-reads after advancing', len(texts) == 2 and q2['prompt'].split(' ')[0] in texts[1], texts[1:] )
    page.click('[data-act="options"]')
    page.wait_for_timeout(200)
    check('Hear answers reads only the options', speaks(page)[-1].startswith('Option A:'), speaks(page)[-1][:40])
    page.click('[data-act="speak"]')
    page.wait_for_timeout(200)
    check('replay reads the question only', 'Option A' not in speaks(page)[-1], speaks(page)[-1][:60])
    page.click('[data-act="hint"]')
    page.wait_for_timeout(200)
    check('hint is read only because the hint button was pressed', len(speaks(page)) >= 4)
    page.reload()
    page.wait_for_selector('.ps-map, .ps-screen')
    ctx_overlaps = page.evaluate('window.__tts.overlaps')
    page.screenshot(path='tts-check-412.png')
    # Back into a quiz after reload: persisted choice stays on.
    check('stored preference survives a reload', page.evaluate("localStorage.getItem('osa-pitstop-voice')") == '1')
    ctx.close()

    # Scenario 2: PP1 default on, print test, leave stops speech, no overlap.
    ctx, page, errors = start(browser, 'pp1', 'paper')
    t = speaks(page)
    check('PP1 mock auto-reads by default', len(t) == 1 and 'Option A:' in t[0], t)
    check('toggle shows pressed for PP1', page.get_attribute('[data-act="voice"]', 'aria-pressed') == 'true')
    n = len(page.evaluate('window.__tts.log'))
    page.click('[data-act="leave"]')
    page.wait_for_timeout(200)
    check('leave button stops speech', any(e['type'] == 'cancel' for e in page.evaluate('window.__tts.log')[n:]))
    page.click('[data-sheet="leave"]')
    page.wait_for_timeout(500)
    check('no overlapping utterances', page.evaluate('window.__tts.overlaps') == 0)
    check('no page errors', not errors, errors)
    ctx.close()

    ctx, page, errors = start(browser, 'class-3', 'print', preset='1')
    t = speaks(page)
    check('print test auto-reads when the toggle is on', len(t) == 1 and 'Option A:' in t[0], t[:1])
    n = len(page.evaluate('window.__tts.log'))
    page.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
    page.evaluate("Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange'))")
    page.wait_for_timeout(100)
    check('hiding the app stops speech', any(e['type'] == 'cancel' for e in page.evaluate('window.__tts.log')[n:]))
    check('no page errors (print test)', not errors, errors)
    ctx.close()

    # Scenario 3: no speechSynthesis at all -> buttons hidden, no errors.
    ctx = browser.new_context(viewport={'width': 412, 'height': 915})
    ctx.add_init_script("Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });")
    page = ctx.new_page()
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(f'{BASE}?test=1&demo=map&class=pp1')
    page.wait_for_function('window.__pitstop && window.__pitstop.go')
    page.evaluate("""async () => { const m = await import('/js/space-academy/pitstop/missions.mjs'); await window.__pitstop.go('quiz', { mission: m.paperMission('pp1', 1) }); }""")
    page.wait_for_selector('.ps-qprompt')
    check('unsupported: voice buttons are hidden', page.locator('[data-act="voice"], [data-act="speak"], [data-act="options"]').count() == 0)
    check('unsupported: no errors', not errs, errs)
    ctx.close()
    browser.close()

failed = [c for c in checks if not c[1]]
print(json.dumps({'passed': len(checks) - len(failed), 'failed': len(failed)}))
sys.exit(1 if failed else 0)
