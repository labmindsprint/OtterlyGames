"""Verify the real static export; no network stubs, forced clicks or reward cheats.

Production question data is used only as an answer oracle, never to replace RNG.
Use --only to rerun named failures. Screenshots/results belong outside the repo.
"""
import argparse
import json
import math
import re
import subprocess
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument("--url", default="http://127.0.0.1:4195")
parser.add_argument("--source", type=Path, default=Path(__file__).resolve().parents[2] / "Clock Master" / "Clock-Master---Time-for-Junior-Olympiad-")
parser.add_argument("--output", required=True, type=Path)
parser.add_argument("--only", default="")
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
results = []
oracle_script = """
const path=require('node:path');
const source=process.argv[1];
const esbuild=require(path.join(source,'node_modules','esbuild'));
const output=esbuild.buildSync({entryPoints:[path.join(source,'src','app','lib','questions','index.ts')],
  bundle:true,write:false,format:'cjs',platform:'node'});
const module={exports:{}};
new Function('module','exports',output.outputFiles[0].text)(module,module.exports);
console.log(JSON.stringify(module.exports.allQuestions));
"""
questions = json.loads(subprocess.check_output(["node", "-e", oracle_script, str(args.source)], encoding="utf-8"))
answers = {q["question"]: q["options"][q["correctAnswer"]] for q in questions}
INIT = """
if (!sessionStorage.getItem('clock-check-seeded')) {
  localStorage.setItem('clock_master_tutorial', '{"hasSeenHomeTutorial":true}');
  localStorage.setItem('clock_master_settings', '{"audioMuted":true,"soundEnabled":true,"musicEnabled":true,"voiceOversEnabled":false}');
  sessionStorage.setItem('clock-check-seeded','1');
}
window.__audio=[];
const play=HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play=function(){
  if(!window.__audio.includes(this)) window.__audio.push(this);
  return play.apply(this,arguments);
};
"""


def context(browser, size=(1366, 768), init=INIT):
    ctx = browser.new_context(viewport={"width": size[0], "height": size[1]})
    ctx.add_init_script(init)
    page = ctx.new_page()
    page.set_default_timeout(12000)
    page.issues = []
    page.requests = []
    page.on("pageerror", lambda e: page.issues.append(str(e)))
    page.on("console", lambda m: page.issues.append("console: " + m.text) if m.type == "error" else None)
    page.on("response", lambda r: page.issues.append(f"{r.status}: {r.url}") if r.status >= 400 else None)
    page.on("request", lambda r: page.requests.append(r.url))
    return ctx, page


def clean(page):
    assert not page.issues, page.issues
    tracking = [u for u in page.requests if re.search(r"googletagmanager|google-analytics|doubleclick|googlesyndication|adservice|storage.ko-fi", u)]
    assert not tracking, tracking


def screen(game, name):
    expect(game.locator(f'[data-screen="{name}"]')).to_be_visible()
    expect(game.locator(f'[data-screen="{name}"] button').first).to_be_visible()


def home(game):
    game.get_by_role("button", name="Home", exact=True).click()
    screen(game, "home")


def gate(game):
    game.get_by_role("button", name="Parent settings", exact=True).click()
    expect(game.get_by_role("dialog", name="A moment for parents")).to_be_visible()
    nums = re.findall(r"\d+", game.locator('label[for="parent-answer"]').inner_text())
    game.locator("#parent-answer").fill(str(sum(map(int, nums))))
    game.get_by_role("button", name="Open settings", exact=True).click()
    screen(game, "settings")


def geometry(game, page, label):
    page.wait_for_timeout(400)
    metric = game.locator('[data-screen]').evaluate("""root => {
      const r=root.getBoundingClientRect();
      return {width:innerWidth,height:innerHeight,root:[r.x,r.y,r.width,r.height],
        documentWidth:document.documentElement.scrollWidth,
        clock:document.querySelector('.clock-container')?.getBoundingClientRect().width,
        art:document.querySelector('.shop-preview-stage')?.getBoundingClientRect().height,
        track:document.querySelector('.race-track')?.getBoundingClientRect().height,
        car:document.querySelector('.race-track__car .cm-car')?.getBoundingClientRect().width,
        issues:[...root.querySelectorAll('button,select,summary')].filter(e=>{
          const r=e.getBoundingClientRect();
          return e.checkVisibility() && !e.closest('.shop-catalog,.achievement-grid,.universe-map-viewport,.overflow-y-auto') &&
            (r.left < -2 || r.right > innerWidth+2 || r.top < -2 || r.bottom > innerHeight+2);
        }).map(e=>e.getAttribute('aria-label')||e.textContent)}
    }""")
    (args.output / f"{label}.json").write_text(json.dumps(metric, indent=2), encoding="utf-8")
    page.screenshot(path=str(args.output / f"{label}.png"))
    assert metric["documentWidth"] <= metric["width"] + 1, metric
    assert metric["root"][2] <= metric["width"] + 1, metric
    assert not metric["issues"], metric
    if metric["clock"]:
        assert metric["clock"] >= 120, metric
    if metric["art"] and metric["width"] >= 1000 and metric["height"] >= 501:
        assert metric["art"] >= 180, metric
    if metric["track"] and metric["width"] >= 1000 and metric["height"] >= 501:
        assert metric["track"] <= 420 and metric["car"] >= 180, metric


def matrix(browser, size, fullscreen):
    ctx, page = context(browser, size)
    page.goto(args.url + "/play/clock-master.html")
    if size[0] <= 1200:
        expect(page.locator(".nav-toggle")).to_be_visible()
    frame = page.locator("#universe-frame")
    assert frame.get_attribute("src") is None, "Game must wait for a Play gesture"
    page.get_by_role("button", name="Play Clock Master", exact=True).click()
    game = page.frame_locator("#universe-frame")
    screen(game, "home")
    if fullscreen:
        page.get_by_role("button", name="Full screen", exact=True).click()
        page.wait_for_function("document.fullscreenElement?.id === 'universe-frame'")
    prefix = f"{size[0]}x{size[1]}-{'fullscreen' if fullscreen else 'embed'}"
    geometry(game, page, prefix + "-home")
    game.get_by_role("button", name="Learn the Clock", exact=True).click()
    screen(game, "lesson")
    for number in range(1, 12):
        game.get_by_role("combobox", name="Choose lesson").select_option(str(number))
        geometry(game, page, prefix + f"-lesson-{number}")
    game.get_by_role("button", name=re.compile("Hint")).click()
    expect(game.get_by_role("region", name="Helpful tip")).to_be_visible()
    game.get_by_role("button", name="Close hint", exact=True).click()
    home(game)
    game.get_by_role("button", name="Car Shop", exact=True).click()
    screen(game, "shop")
    for tab in ["Types", "Colors", "Accessories", "Avatar"]:
        game.get_by_role("button", name=re.compile(tab)).click()
        geometry(game, page, prefix + "-shop-" + tab)
    home(game)
    game.get_by_role("button", name="Achievements and trophies", exact=True).click()
    screen(game, "achievements")
    game.locator(".achievement-grid button").last.scroll_into_view_if_needed()
    geometry(game, page, prefix + "-achievements")
    home(game)
    gate(game)
    geometry(game, page, prefix + "-settings-sounds")
    game.get_by_role("button", name="More settings", exact=True).click()
    for name, title, close in [
        ("About Otterly Games", "Otterly Games", "Awesome! 🦦"),
        ("Support Us", "Support us on Ko-fi", "Close support"),
        ("Reset All Progress", "Reset progress", "Cancel"),
    ]:
        game.get_by_role("button", name=re.compile(name)).click()
        expect(game.get_by_role("dialog", name=title, exact=True)).to_be_visible()
        geometry(game, page, prefix + "-modal-" + close.replace(" ", "-"))
        game.get_by_role("button", name=close, exact=True).click()
    game.get_by_role("button", name="Game configuration", exact=True).click()
    screen(game, "config")
    for tab in ["Race", "Fuel", "Cars", "Colors", "Items"]:
        game.get_by_role("button", name=tab, exact=True).click()
        geometry(game, page, prefix + "-config-" + tab)
        count = 1
        while game.get_by_role("button", name="Next configuration page", exact=True).is_enabled():
            game.get_by_role("button", name="Next configuration page", exact=True).click()
            count += 1
            geometry(game, page, prefix + f"-config-{tab}-{count}")
    game.get_by_role("button", name="Save configuration", exact=True).click()
    expect(game.get_by_role("status")).to_have_text("Saved!")
    game.get_by_role("button", name="Back to settings", exact=True).click()
    home(game)
    game.get_by_role("button", name="Time Race Game", exact=True).click()
    screen(game, "race")
    geometry(game, page, prefix + "-race-ready")
    game.get_by_role("button", name="Start Race!", exact=True).click()
    expect(game.locator(".race-answer").first).to_be_visible()
    geometry(game, page, prefix + "-race-playing")
    game.get_by_role("button", name="Pause race", exact=True).click()
    geometry(game, page, prefix + "-race-paused")
    game.get_by_role("button", name=re.compile("Home", re.I)).last.click()
    screen(game, "home")
    game.get_by_role("button", name="Explore Universe", exact=True).click()
    expect(game.get_by_test_id("universe-launch")).to_be_visible()
    geometry(game, page, prefix + "-universe")
    game.get_by_test_id("universe-launch").click()
    expect(game.get_by_role("dialog")).to_be_visible()
    geometry(game, page, prefix + "-universe-question")
    clean(page)
    ctx.close()


def answer(game):
    text = game.locator(".universe-question p").inner_text()
    assert text in answers, text
    for button in game.locator(".universe-answers button").all():
        if button.inner_text()[1:].strip() == answers[text]:
            return button
    raise AssertionError((text, answers[text]))


def universe(browser):
    ctx, page = context(browser)
    page.goto(args.url + "/play/clock-master.html")
    page.get_by_role("button", name="Play Clock Master", exact=True).click()
    game = page.frame_locator("#universe-frame")
    game.get_by_role("button", name="Explore Universe", exact=True).click()
    game.get_by_test_id("universe-launch").click()
    correct = answer(game)
    for b in game.locator(".universe-answers button").all():
        if b.inner_text() != correct.inner_text():
            b.click()
            break
    expect(game.locator(".universe-feedback")).to_contain_text("Video rewards are unavailable")
    assert not game.get_by_role("button", name="Watch Ad to Continue").count()
    game.get_by_role("button", name=re.compile("Retry from")).click()
    expect(game.get_by_test_id("universe-launch")).to_be_visible()
    game.get_by_test_id("universe-launch").click()
    for index in range(5):
        expect(game.locator(".universe-question-meta")).to_contain_text(f"Question {index+1} of 5")
        answer(game).click()
        game.get_by_test_id("universe-next").click()
        if index == 0:
            ship = game.get_by_test_id("journey-ship")
            page.wait_for_timeout(250)
            page.evaluate("document.querySelector('#universe-frame').contentWindow.postMessage({type:'pauseAudio'}, location.origin)")
            page.wait_for_timeout(150)
            pose = ship.get_attribute("transform")
            page.wait_for_timeout(1700)
            assert ship.get_attribute("transform") == pose
            assert game.get_by_test_id("space-journey").get_attribute("data-flying") == "true"
            page.evaluate("document.querySelector('#universe-frame').contentWindow.postMessage({type:'resumeAudio'}, location.origin)")
        if index < 4:
            expect(game.locator(".universe-question-meta")).to_contain_text(f"Question {index+2} of 5")
    expect(game.get_by_role("dialog", name="New discovery!", exact=True)).to_be_visible()
    expect(game.locator(".universe-reward")).to_contain_text("+10 Coins Earned")
    saved = game.locator("body").evaluate("()=>JSON.parse(localStorage.getItem('clock_master_astronomy'))")
    assert saved["currentLevel"] == 1 and saved["objectsUnlockedToday"] == 1, saved
    page.reload()
    page.get_by_role("button", name="Play Clock Master", exact=True).click()
    game.get_by_role("button", name="Explore Universe", exact=True).click()
    expect(game.locator(".universe-count")).to_have_text("2 / 30 found")
    game.get_by_test_id("universe-launch").click()
    for index in range(5):
        answer(game).click()
        game.get_by_test_id("universe-next").click()
        if index < 4:
            expect(game.locator(".universe-question-meta")).to_contain_text(f"Question {index+2} of 5")
    expect(game.get_by_role("dialog", name="New discovery!", exact=True)).to_be_visible()
    game.get_by_role("button", name="My discoveries", exact=True).click()
    game.get_by_role("button", name="Return home", exact=True).first.click()
    game.get_by_role("button", name="Car Shop", exact=True).click()
    game.get_by_role("button", name="Preview Dune", exact=True).click()
    game.get_by_role("button", name="Unlock Dune for 15 coins", exact=True).click()
    # Native purchase action unlocks, then the explicit Use action equips.
    if game.get_by_role("button", name="Use Dune", exact=True).count():
        game.get_by_role("button", name="Use Dune", exact=True).click()
    expect(game.get_by_role("button", name="Using Dune", exact=True)).to_be_disabled()
    stored = game.locator("body").evaluate("()=>({coins:localStorage.getItem('clock_master_coins'),custom:JSON.parse(localStorage.getItem('clock_master_customizations'))})")
    assert int(stored["coins"]) == 5, stored
    assert stored["custom"]["selectedCarType"] == "vintage", stored
    page.reload()
    page.get_by_role("button", name="Play Clock Master", exact=True).click()
    game.get_by_role("button", name="Car Shop", exact=True).click()
    expect(game.get_by_role("button", name="Using Dune", exact=True)).to_be_disabled()
    clean(page)
    ctx.close()


def map_states(browser):
    for level in [28, 29]:
        ctx, page = context(browser)
        page.goto(args.url + "/games/clockmaster/")
        page.evaluate("""level=>localStorage.setItem('clock_master_astronomy',JSON.stringify({
          currentLevel:level,objectsUnlockedToday:0,lastUnlockDate:new Date().toISOString().split('T')[0],
          questionsAnsweredToday:0,correctAnswersInRow:0}))""", level)
        page.reload()
        page.get_by_role("button", name="Explore Universe", exact=True).click()
        expect(page.locator(".universe-count")).to_have_text(f"{level+1} / 30 found")
        geometry(page, page, f"map-level-{level}")
        if level == 29:
            expect(page.get_by_role("button", name="Discovery log", exact=True)).to_be_visible()
            page.get_by_role("button", name="Discovery log", exact=True).click()
            expect(page.get_by_role("dialog")).to_be_visible()
        else:
            page.get_by_test_id("universe-launch").click()
            for index in range(5):
                answer(page).click()
                page.get_by_test_id("universe-next").click()
                if index < 4:
                    expect(page.locator(".universe-question-meta")).to_contain_text(f"Question {index+2} of 5")
            expect(page.get_by_role("dialog", name="Universe complete!", exact=True)).to_be_visible()
            geometry(page, page, "final-discovery")
        clean(page)
        ctx.close()


def storage(browser):
    for method in ["getItem", "setItem", "removeItem"]:
        ctx, page = context(browser, init=INIT + f"""
          const original=Storage.prototype.{method};
          window.__fail=false;
          Storage.prototype.{method}=function(...args){{
            if(window.__fail) throw new DOMException('Test denied storage','SecurityError');
            return original.apply(this,args);
          }};
        """)
        page.goto(args.url + "/games/clockmaster/")
        expect(page.locator('[data-screen="home"]')).to_be_visible()
        page.evaluate("window.__fail=true")
        # Drive production reads/writes/removals, not calls to the wrapper under test.
        if method in ["getItem", "setItem"]:
            page.get_by_role("button", name="Unmute audio", exact=True).click() if page.get_by_role("button", name="Unmute audio", exact=True).count() else page.get_by_role("button", name="Mute audio", exact=True).click()
        else:
            page.evaluate("window.__fail=false")
            gate(page)
            page.get_by_role("button", name="More settings", exact=True).click()
            page.get_by_role("button", name=re.compile("Reset All Progress")).click()
            page.evaluate("window.__fail=true")
            page.get_by_role("button", name="Reset", exact=True).click()
        expect(page.get_by_role("alert")).to_contain_text("cannot save progress")
        expect(page.locator('[data-screen]')).to_have_count(0)
        page.screenshot(path=str(args.output / f"storage-late-{method}.png"))
        ctx.close()
    ctx, page = context(browser, init="Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError')}})")
    page.goto(args.url + "/games/clockmaster/")
    expect(page.get_by_role("alert")).to_contain_text("cannot save progress")
    expect(page.locator('[data-screen]')).to_have_count(0)
    ctx.close()


def launcher_regression(browser):
    ctx, page = context(browser)
    page.goto(args.url + "/play/math-tank.html")
    assert page.locator("#universe-frame").get_attribute("src") is None
    page.get_by_role("button", name="Play Math Tank", exact=True).click()
    frame = page.frame_locator("#universe-frame")
    frame.get_by_role("button", name="Play Math Tank", exact=True).click()
    expect(frame.get_by_role("button", name="Battle", exact=True)).to_be_visible()
    page.get_by_role("button", name="Full screen", exact=True).click()
    page.wait_for_function("document.fullscreenElement?.id==='universe-frame'")
    clean(page)
    ctx.close()


def race_answer(game, difficulty):
    if difficulty == "master":
        text = game.locator("#race-question").inner_text()
        correct = answers[text]
        return game.locator(".race-answer").filter(has_text=re.compile(r"^[A-D]\. " + re.escape(correct) + "$"))
    styles = game.locator("div[style*='transform-origin: 3px center']").evaluate_all(
        "(es)=>es.map(e=>({width:e.style.width,transform:e.style.transform}))")
    angles = {s["width"]: float(re.search(r"rotate\(([-\d.]+)deg\)", s["transform"])[1]) for s in styles}
    minute = round(((angles["50px"] + 90) % 360) / 6) % 60
    hour = round(((angles["35px"] + 90) % 360 - minute * .5) / 30) % 12 or 12
    return game.get_by_role("button", name=f"{hour}:{minute:02}", exact=True)


def race_rounds(browser):
    for difficulty in ["easy", "medium", "hard", "master"]:
        ctx, page = context(browser)
        page.goto(args.url + "/games/clockmaster/?mode=race")
        page.get_by_role("button", name=re.compile(difficulty, re.I)).click()
        page.get_by_role("button", name="Start Race!", exact=True).click()
        for index in range(8):
            if page.get_by_role("dialog", name="Race results", exact=True).count():
                break
            expect(page.locator(".race-answer").first).to_be_enabled()
            race_answer(page, difficulty).click()
            expect(page.locator(".race-feedback")).to_have_attribute("data-feedback", "correct")
            page.wait_for_timeout(1100)
        expect(page.get_by_role("dialog", name="Race results", exact=True)).to_be_visible()
        assert page.evaluate("JSON.parse(localStorage.getItem('clock_master_stats')).racesWon") == 1
        page.get_by_role("button", name="Race Again", exact=True).click()
        page.get_by_role("button", name="Start Race!", exact=True).click()
        expect(page.locator(".race-answer").first).to_be_enabled()
        race_answer(page, difficulty).click()
        expect(page.locator(".race-feedback")).to_have_attribute("data-feedback", "correct")
        assert page.evaluate("JSON.parse(localStorage.getItem('clock_master_fuel')).gamesPlayedToday") == 2
        page.get_by_role("button", name="Pause race", exact=True).click()
        page.get_by_role("button", name="Forfeit & Go Home", exact=True).click()
        page.wait_for_timeout(1200)
        screen(page, "home")
        clean(page)
        ctx.close()


def lifecycle(browser):
    ctx, page = context(browser, (390, 844))
    page.goto(args.url + "/play/clock-master.html")
    page.get_by_role("button", name="Play Clock Master", exact=True).click()
    game = page.frame_locator("#universe-frame")
    game.get_by_role("button", name="Unmute audio", exact=True).click()
    game_frame = page.frame(url=re.compile(r"/games/clockmaster/$"))
    assert game_frame
    game_frame.wait_for_function("window.__audio.some(a=>!a.paused)", timeout=12000)
    game.get_by_role("button", name="Time Race Game", exact=True).click()
    game.get_by_role("button", name="Start Race!", exact=True).click()
    page.wait_for_timeout(300)
    def message(kind):
        page.evaluate("kind=>document.querySelector('#universe-frame').contentWindow.postMessage({type:kind},location.origin)", kind)
    message("pauseAudio")
    page.wait_for_timeout(150)
    count = game.locator(".race-countdown").inner_text()
    page.wait_for_timeout(3200)
    assert game.locator(".race-countdown").inner_text() == count
    assert game.locator("body").evaluate("()=>window.__audio.every(a=>a.paused)")
    message("resumeAudio")
    expect(game.locator(".race-answer").first).to_be_visible()
    game.locator("body").evaluate("""()=>window.dispatchEvent(new MessageEvent('message',{
      data:{type:'pauseAudio'},origin:location.origin,source:window}))""")
    page.wait_for_timeout(200)
    expect(game.get_by_role("dialog", name="Race paused")).to_have_count(0)
    page.evaluate("window.scrollTo({top:document.body.scrollHeight,behavior:'instant'})")
    assert page.locator("#universe-frame").evaluate("e=>e.getBoundingClientRect().bottom <= 0"), "Offscreen test did not scroll the frame fully away"
    expect(game.get_by_role("dialog", name="Race paused")).to_be_attached()
    assert game.locator("body").evaluate("()=>window.__audio.every(a=>a.paused)")
    page.locator("#universe-frame").scroll_into_view_if_needed()
    game.get_by_role("button", name="Resume race", exact=True).click()
    game.locator("body").evaluate("""()=>{
      Object.defineProperty(document,'hidden',{configurable:true,value:true});
      document.dispatchEvent(new Event('visibilitychange'));
    }""")
    expect(game.get_by_role("dialog", name="Race paused")).to_be_attached()
    before = game.locator(".race-track").inner_text()
    page.wait_for_timeout(1500)
    assert game.locator(".race-track").inner_text() == before
    assert game.locator("body").evaluate("()=>window.__audio.every(a=>a.paused)")
    game.locator("body").evaluate("""()=>{
      Object.defineProperty(document,'hidden',{configurable:true,value:false});
      document.dispatchEvent(new Event('visibilitychange'));
    }""")
    game.get_by_role("button", name="Forfeit & Go Home", exact=True).click()
    page.wait_for_timeout(1200)
    screen(game, "home")
    game.get_by_role("button", name="Learn the Clock", exact=True).click()
    expect(game.get_by_role("button", name="Start tutorial", exact=True)).to_be_visible()
    message("pauseAudio")
    page.wait_for_timeout(1900)
    expect(game.get_by_role("button", name="Start tutorial", exact=True)).to_be_visible()
    message("resumeAudio")
    expect(game.locator("#lesson-instruction")).to_contain_text("visit all 12 hours")
    home(game)
    page.wait_for_timeout(400)
    screen(game, "home")
    clean(page)
    ctx.close()


def tutorial_and_reset(browser):
    ctx, page = context(browser, init="localStorage.setItem('clock_master_settings','{\"audioMuted\":true}')")
    page.goto(args.url + "/play/clock-master.html")
    page.get_by_role("button", name="Play Clock Master", exact=True).click()
    game = page.frame_locator("#universe-frame")
    tour = game.get_by_test_id("otter-tour")
    expect(tour).to_be_visible()
    for index in range(9):
        expect(tour).to_contain_text(f"{index+1}/9")
        tour.get_by_role("button", name=re.compile("Next|Let's|Start|Explore|Finish|Done", re.I)).last.click()
    expect(tour).not_to_be_visible()
    assert game.locator("body").evaluate("()=>JSON.parse(localStorage.getItem('clock_master_tutorial')).hasSeenHomeTutorial")
    game.get_by_role("button", name="Take a tour", exact=True).click()
    tour.get_by_role("button", name="Skip tutorial", exact=True).click()
    game.get_by_role("button", name="Parent settings", exact=True).click()
    game.locator("#parent-answer").fill("-1")
    game.get_by_role("button", name="Open settings", exact=True).click()
    expect(game.locator("#parent-error")).to_be_visible()
    game.get_by_role("button", name="Cancel", exact=True).click()
    gate(game)
    game.get_by_role("button", name="More settings", exact=True).click()
    game.get_by_role("button", name=re.compile("Reset All Progress")).click()
    game.get_by_role("button", name="Reset", exact=True).click()
    screen(game, "home")
    # The original reset intentionally also makes the welcome tutorial available.
    expect(game.get_by_test_id("otter-tour")).to_be_visible()
    game.get_by_role("button", name="Skip tutorial", exact=True).click()
    clean(page)
    ctx.close()


with sync_playwright() as p:
    browser = p.chromium.launch()
    tests = [
        (f"matrix-{w}x{h}-{'fullscreen' if full else 'embed'}", lambda s=(w, h), f=full: matrix(browser, s, f))
        for w, h in [(1366, 768), (1440, 900), (1920, 1080), (1280, 600), (800, 1000), (390, 844), (844, 390)]
        for full in [False, True]
    ] + [("universe", lambda: universe(browser)), ("map-states", lambda: map_states(browser)),
         ("storage", lambda: storage(browser)), ("math-launcher", lambda: launcher_regression(browser)),
         ("race-rounds", lambda: race_rounds(browser)), ("lifecycle", lambda: lifecycle(browser)),
         ("tutorial-reset", lambda: tutorial_and_reset(browser))]
    for name, run in tests:
        if args.only and not re.search(args.only, name):
            continue
        try:
            run()
            results.append({"test": name, "passed": True})
            print("PASS " + name, flush=True)
        except Exception:
            error = traceback.format_exc()
            results.append({"test": name, "passed": False, "error": error})
            print("FAIL " + name + "\n" + error, flush=True)
            for ctx in browser.contexts:
                for page in ctx.pages:
                    page.screenshot(path=str(args.output / f"failure-{name}.png"))
                ctx.close()
        (args.output / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    browser.close()
assert results and all(r["passed"] for r in results), "See results.json"
