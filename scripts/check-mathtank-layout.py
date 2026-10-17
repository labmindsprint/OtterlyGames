"""Capture every browser-game screen and verify responsive laptop layouts."""
import argparse
import ast
import json
import re
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--url", default="http://127.0.0.1:4195")
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--verify", action="store_true")
parser.add_argument("--embedded", action="store_true")
parser.add_argument("--width", type=int)
parser.add_argument("--height", type=int)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
viewports = [(1366, 768), (1440, 900), (1920, 1080), (390, 844), (800, 1000), (1280, 600), (844, 390)]
if args.width or args.height:
    if not (args.width and args.height):
        parser.error("--width and --height must be supplied together")
    viewports = [(args.width, args.height)]
results = []
source = (Path(__file__).resolve().parents[2] / "Math Tank" / "src" / "app" / "lib" / "universeQuestions.ts").read_text(encoding="utf-8")
tier_one = source.split("export const TIER1_QUESTIONS: UniverseQuestion[] = [", 1)[1].split("\n];", 1)[0]
answers = {
    ast.literal_eval(question): str(ast.literal_eval(options)[int(index)])
    for question, options, index in re.findall(
        r"question: ('(?:\\.|[^'\\])*'), options: (\[.*?\]), correctAnswer: (\d+)", tier_one
    )
}

with sync_playwright() as p:
    browser = p.chromium.launch()
    for width, height in viewports:
        context = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce")
        context.add_init_script("""
          if (location.protocol === 'http:') localStorage.setItem('mathTank_settings', JSON.stringify({
            soundEnabled:false, musicEnabled:false, voiceVolume:0, musicVolume:0, playerAge:6
          }));
        """)
        errors, missing = [], []
        page = context.new_page()
        page.set_default_timeout(20000)
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("response", lambda r: missing.append(r.url) if r.url.startswith(args.url) and r.status >= 400 else None)
        page.goto(args.url + "/play/math-tank.html")
        page.get_by_role("button", name="Play Math Tank", exact=True).click()
        if not args.embedded:
            page.get_by_role("button", name="Full screen", exact=True).click()
            expect(page.locator("#universe-frame")).to_have_js_property("clientWidth", width)
            assert page.evaluate("document.fullscreenElement?.id") == "universe-frame"
        frame = page.frame_locator("#universe-frame")
        app = frame.get_by_test_id("math-tank-app")
        expect(frame.get_by_role("button", name="Play Math Tank", exact=True)).to_be_enabled()
        game_width, game_height = frame.locator("body").evaluate("() => [innerWidth, innerHeight]")

        def capture(name):
            page.wait_for_timeout(350)
            metrics = frame.locator("body").evaluate("""body => ({
              viewport: [innerWidth, innerHeight],
              overflow: document.documentElement.scrollWidth > innerWidth,
              app: (() => { const el=body.querySelector('.web-app'); const b=el?.getBoundingClientRect();
                return b ? {width:b.width,height:b.height,bottom:b.bottom,left:b.left} : null; })(),
              previews: [...body.querySelectorAll('button[aria-label^="Try "]')].map(el => {
                const b=el.getBoundingClientRect();return {label:el.getAttribute('aria-label'),width:b.width,height:b.height};
              }).slice(0,14),
              canvases: [...body.querySelectorAll('canvas')].slice(0,12).map(el => {
                const b=el.getBoundingClientRect();return {width:b.width,height:b.height};
              })
            })""")
            results.append({"size": [width, height], "screen": name, **metrics})
            (args.output / "metrics.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
            page.screenshot(path=str(args.output / f"{width}x{height}-{name}.png"))
            if args.verify:
                assert not metrics["overflow"], (name, width, metrics)
                if metrics["app"]:
                    assert metrics["app"]["bottom"] <= game_height + 1, (name, metrics)
                    assert metrics["app"]["width"] <= game_width + 1, (name, metrics)
                    assert metrics["app"]["left"] >= -1, (name, metrics)
                if name == "home":
                    garage = frame.get_by_role("button", name="Garage", exact=True)
                    card = garage.bounding_box()
                    label = garage.get_by_text("Missiles", exact=True).bounding_box()
                    assert label["y"] + label["height"] <= card["y"] + card["height"] - 2, (name, card, label)
                if name == "universe-map":
                    current = frame.locator('[data-universe-world][aria-current="step"]').bounding_box()
                    viewport = frame.get_by_role("region", name="Universe world map", exact=True).bounding_box()
                    assert abs(current["x"] + current["width"] / 2 - viewport["x"] - viewport["width"] / 2) <= 3, (name, current, viewport)
                    if game_width >= 1024 and game_height >= 600:
                        assert current["width"] >= min(280, game_height * .4) and current["height"] >= min(240, game_height * .35), (name, current)
                if name in ("battle-question", "universe-question") and game_width >= 1024 and game_height >= 600:
                    universe = name == "universe-question"
                    question = frame.get_by_test_id("universe-question" if universe else "battle-question").bounding_box()
                    tanks = frame.locator('[data-universe-tank]' if universe else '[data-testid="player-tank"], [data-testid="enemy-tank"]')
                    for tank in tanks.all():
                        bounds = tank.bounding_box()
                        assert abs(bounds["y"] + bounds["height"] / 2 - question["y"] - question["height"] / 2) <= max(140, game_height * .17), (name, question, bounds)
                    effect = frame.get_by_test_id("universe-arena" if universe else "battle-arena").get_by_test_id("battle-effects").bounding_box()
                    for tank in tanks.all():
                        anchor = tank.locator('[data-tank-anchor="hit"]').evaluate("el => { const b=el.getBoundingClientRect(); return {y:b.y,height:b.height}; }")
                        viewport = page.locator("#universe-frame").bounding_box()
                        assert effect["y"] <= viewport["y"] + anchor["y"] <= effect["y"] + effect["height"], (name, effect, anchor)
                selectors = {
                    "battle-question": '[data-testid="battle-keypad"] button',
                    "practice-question": ".web-practice-input button",
                    "universe-question": '[data-testid^="universe-answer-"]',
                }
                if name in selectors:
                    controls = frame.locator(selectors[name])
                    assert controls.count() > 0, name
                    viewport = page.locator("#universe-frame").bounding_box()
                    for control in controls.all():
                        bounds = control.bounding_box()
                        assert bounds["x"] >= viewport["x"] - 1 and bounds["x"] + bounds["width"] <= viewport["x"] + game_width + 1, (name, bounds)
                        assert bounds["y"] >= viewport["y"] - 1 and bounds["y"] + bounds["height"] <= viewport["y"] + game_height + 1, (name, bounds)

        def home():
            frame.get_by_role("button", name="Game home / take a break", exact=True).click()
            frame.get_by_role("button", name="Play Math Tank", exact=True).click()
            expect(app).to_have_attribute("data-screen", "home")
            expect(frame.get_by_role("button", name="Garage", exact=True)).to_be_visible()

        capture("start")
        frame.get_by_role("button", name="Play Math Tank", exact=True).click()
        expect(frame.get_by_role("button", name="Garage", exact=True)).to_be_visible()
        capture("home")

        frame.get_by_role("button", name="Battle", exact=True).click()
        expect(frame.get_by_role("button", name="START BATTLE", exact=True)).to_be_visible()
        capture("battle-setup")
        if args.verify and game_width >= 1024 and game_height >= 600:
            for name in ["Scout Drone", "Laser Beam"]:
                art = frame.get_by_role("button", name=name, exact=True).locator(":scope > div").first.bounding_box()
                assert art["width"] >= 150 and art["height"] >= 95, (name, art)
        frame.get_by_role("button", name="START BATTLE", exact=True).click()
        expect(frame.get_by_test_id("battle-screen")).to_have_attribute("data-phase", "table_review")
        capture("battle-review")
        frame.get_by_role("button", name=re.compile("I'm Ready")).click()
        expect(frame.get_by_test_id("battle-screen")).to_have_attribute("data-phase", "player_question")
        capture("battle-question")
        if width == 1366 and not args.embedded:
            battle = frame.get_by_test_id("battle-screen")
            for _ in range(30):
                expect(battle).to_have_attribute("data-phase", re.compile("^(player_question|enemy_question|battle_end)$"), timeout=30000)
                if battle.get_attribute("data-phase") == "battle_end":
                    break
                question = frame.get_by_test_id("battle-question").inner_text()
                a, b = map(int, re.findall(r"\d+", question)[:2])
                for digit in str(a // b if "÷" in question else a * b):
                    frame.get_by_test_id("battle-keypad").get_by_role("button", name=digit, exact=True).click()
                page.wait_for_timeout(2500)
            expect(battle).to_have_attribute("data-phase", "battle_end")
            capture("battle-result")
            frame.get_by_role("button", name="Home", exact=True).click()
        home()

        frame.get_by_role("button", name="Garage", exact=True).click()
        expect(frame.get_by_role("tab", name="Tanks", exact=True)).to_have_attribute("aria-selected", "true")
        preview = frame.get_by_role("button", name="Try Scout Drone: Hover hop", exact=True)
        expect(preview).to_be_visible()
        capture("garage-tanks")
        if args.verify and game_width >= 1024 and game_height >= 600:
            bounds = preview.bounding_box()
            assert bounds["width"] >= 240 and bounds["height"] >= 155, bounds
        frame.get_by_role("tab", name="Missiles", exact=True).click()
        expect(frame.get_by_role("tab", name="Missiles", exact=True)).to_have_attribute("aria-selected", "true")
        capture("garage-missiles")
        if args.verify and game_width >= 1024 and game_height >= 600:
            previews = frame.locator('button[aria-label^="Animate "]')
            bounds = previews.first.bounding_box()
            assert bounds["width"] >= 190 and bounds["height"] >= 150, bounds
        frame.get_by_role("tab", name="Customize", exact=True).click()
        expect(frame.get_by_role("tab", name="Paint", exact=True)).to_be_visible()
        capture("garage-paint")
        frame.get_by_role("tab", name="Stickers", exact=True).click()
        capture("garage-stickers")
        home()

        frame.get_by_role("button", name="Learn", exact=True).click()
        expect(frame.get_by_text("Math Lessons", exact=True)).to_be_visible()
        capture("lessons")
        for subject in ["Multiplication", "Division"]:
            frame.get_by_role("button", name=re.compile("^" + subject)).click()
            expect(frame.get_by_text(subject + " Lessons", exact=True)).to_be_visible()
            capture("lessons-" + subject.lower())
            if subject == "Multiplication":
                frame.get_by_role("button", name=re.compile("^Multiplication Basics")).click()
                expect(frame.get_by_test_id("lesson-header")).to_be_visible()
                capture("lesson-player")
                frame.get_by_role("button", name=re.compile("^Next")).click()
                expect(frame.get_by_text("Ready to multiply?", exact=True)).not_to_be_visible()
                capture("lesson-animation")
                frame.get_by_role("button", name="Close lesson", exact=True).click()
            frame.get_by_role("button", name="Back", exact=True).click()
            expect(frame.get_by_text("Choose what to learn:", exact=True)).to_be_visible()
        frame.get_by_role("button", name="Practice Mode").click()
        expect(frame.get_by_text("Pick your math adventure", exact=True)).to_be_visible()
        capture("practice")
        for mode in ["Multiplication", "Division", "Column Multiply", "Bracket Division"]:
            if mode != "Multiplication":
                home()
                frame.get_by_role("button", name="Learn", exact=True).click()
                frame.get_by_role("button", name="Practice Mode").click()
                expect(frame.get_by_text("Pick your math adventure", exact=True)).to_be_visible()
            frame.get_by_role("button", name=re.compile("^" + mode)).click()
            capture("practice-" + mode.lower().replace(" ", "-"))
            if mode == "Multiplication":
                frame.get_by_role("button", name="I'm Ready! Let's Practice!", exact=True).click()
                expect(frame.get_by_text(re.compile(r"^\d+ × \d+ = \?$"))).to_be_visible()
                capture("practice-question")
                question = frame.get_by_text(re.compile(r"^\d+ × \d+ = \?$")).inner_text()
                a, b = map(int, re.findall(r"\d+", question))
                for digit in str(a * b):
                    frame.get_by_role("button", name=digit, exact=True).click()
                expect(frame.get_by_text(re.compile(r"^🔥\s*1$"))).to_be_visible()
                frame.get_by_role("button", name="Done", exact=True).click()
                expect(frame.get_by_text("WELL DONE!", exact=True)).to_be_visible()
                capture("practice-result")
        home()

        frame.get_by_role("button", name=re.compile("^Achievements")).click()
        expect(frame.get_by_role("button", name="Back to Home", exact=True)).to_be_visible()
        capture("achievements")
        home()
        frame.get_by_role("button", name="Settings", exact=True).click()
        expect(frame.locator("#home-parent-answer")).to_be_visible()
        capture("parent-check")
        a, b = map(int, re.search(r"(\d+)\s*\+\s*(\d+)\s*=\s*\?", app.inner_text()).groups())
        frame.locator("#home-parent-answer").fill(str(a + b))
        if args.verify and args.embedded and game_height <= height - 88:
            bounds = frame.get_by_role("button", name="Check", exact=True).bounding_box()
            assert bounds["y"] >= 0 and bounds["y"] + bounds["height"] <= height, bounds
        frame.get_by_role("button", name="Check", exact=True).click()
        expect(frame.get_by_role("button", name="Go to home", exact=True)).to_be_visible()
        capture("settings")
        if width == 1366 and not args.embedded:
            frame.get_by_role("button", name="About Otterly Games", exact=True).click()
            expect(frame.get_by_role("dialog")).to_be_visible()
            capture("settings-about")
            frame.get_by_role("button", name=re.compile("^Awesome!")).click()
            frame.get_by_role("button", name="Support us", exact=True).click()
            dialog = frame.get_by_role("dialog", name="Support us on Ko-fi", exact=True)
            expect(dialog).to_be_visible()
            capture("settings-support")
            dialog.get_by_role("button", name="✕", exact=True).click()
            frame.get_by_role("button", name="Reset progress", exact=True).click()
            expect(frame.get_by_role("dialog")).to_be_visible()
            capture("settings-reset-confirmation")
            frame.get_by_role("dialog").get_by_role("button", name="Cancel", exact=True).click()
        frame.get_by_role("button", name="Progress Report", exact=True).click()
        expect(frame.get_by_role("button", name="Back to Home", exact=True)).to_be_visible()
        capture("progress")
        home()
        frame.get_by_role("button", name="Universe", exact=True).click()
        expect(frame.get_by_test_id("universe-start-battle")).to_be_visible()
        capture("universe-map")
        frame.get_by_test_id("universe-start-battle").click()
        expect(frame.get_by_test_id("universe-question")).to_be_visible()
        capture("universe-question")
        if width == 1366 and not args.embedded:
            for _ in range(5):
                question = frame.get_by_test_id("universe-question").inner_text()
                frame.locator('[data-testid^="universe-answer-"]').get_by_text(answers[question], exact=True).click()
                page.wait_for_timeout(3500)
            expect(frame.get_by_test_id("universe-victory")).to_be_visible()
            capture("universe-victory")
        assert not errors, errors
        assert not missing, missing
        mode = "embedded" if args.embedded else "fullscreen"
        print(f"PASS all game screens {mode} at {width}x{height} (game {game_width}x{game_height})", flush=True)
        context.close()
    browser.close()
