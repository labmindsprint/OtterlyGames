"""Exercise the full static game, local saves, and website ad boundaries."""
import argparse
import ast
import json
import re
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--url", default="http://127.0.0.1:4195")
parser.add_argument("--source", type=Path, default=Path(__file__).resolve().parents[2] / "Math Tank")
args = parser.parse_args()
source = (args.source / "src" / "app" / "lib" / "universeQuestions.ts").read_text(encoding="utf-8")
tier_one = source.split("export const TIER1_QUESTIONS: UniverseQuestion[] = [", 1)[1].split("\n];", 1)[0]
answers = {
    ast.literal_eval(question): str(ast.literal_eval(options)[int(index)])
    for question, options, index in re.findall(
        r"question: ('(?:\\.|[^'\\])*'), options: (\[.*?\]), correctAnswer: (\d+)", tier_one
    )
}
assert answers, "Could not read the production first-world question bank"
settings = json.dumps({
    "soundEnabled": False, "musicEnabled": False, "voiceVolume": 0,
    "playerAge": 6, "musicVolume": 0,
})


def solve(frame):
    text = frame.get_by_test_id("universe-question").inner_text()
    assert text in answers, f"Question is missing from the production first-world bank: {text!a}"
    frame.locator('[data-testid^="universe-answer-"]').get_by_text(answers[text], exact=True).click()


def enter_universe(target):
    target.get_by_role("button", name="Play Math Tank", exact=True).click()
    target.get_by_role("button", name=re.compile("universe", re.I)).click()


def exercise_full_game(frame):
    app = frame.get_by_test_id("math-tank-app")
    frame.get_by_role("button", name="Play Math Tank", exact=True).click()
    frame.get_by_role("button", name=re.compile("^Achievements")).click()
    frame.get_by_role("button", name=re.compile("Claim \\+50")).click()
    frame.get_by_role("button", name="Back to Home", exact=True).click()
    frame.get_by_role("button", name="Garage", exact=True).click()
    frame.get_by_role("button", name="Buy Industrial Mech for 50 coins", exact=True).click()
    frame.get_by_role("button", name="Confirm purchase of Industrial Mech for 50 coins", exact=True).click()
    expect(frame.get_by_role("button", name=re.compile("^Buy Industrial Mech"))).to_have_count(0)
    frame.get_by_role("tab", name="Customize", exact=True).click()
    frame.get_by_role("button", name="Try Army Green paint, owned", exact=True).click()
    frame.get_by_role("button", name="Use Army Green paint", exact=True).click()
    expect(frame.get_by_role("button", name="Try Army Green paint, in use", exact=True)).to_be_visible()
    frame.locator("body").evaluate("() => location.reload()")
    frame.get_by_role("button", name="Play Math Tank", exact=True).click()
    frame.get_by_role("button", name="Garage", exact=True).click()
    expect(frame.get_by_role("button", name="Try Industrial Mech: Heavy recoil", exact=True)).to_be_visible()
    expect(frame.get_by_role("button", name=re.compile("^Buy Industrial Mech"))).to_have_count(0)
    frame.get_by_role("tab", name="Customize", exact=True).click()
    expect(frame.get_by_role("button", name="Try Army Green paint, in use", exact=True)).to_be_visible()
    frame.get_by_role("tab", name="Missiles", exact=True).click()
    expect(frame.get_by_role("tab", name="Missiles", exact=True)).to_have_attribute("aria-selected", "true")
    frame.get_by_role("button", name="Back to Home", exact=True).click()

    frame.get_by_role("button", name="Learn", exact=True).click()
    expect(frame.get_by_text("Math Lessons", exact=True)).to_be_visible()
    frame.get_by_role("button", name="Multiplication").click()
    frame.get_by_role("button", name="Multiplication Basics").click()
    expect(frame.get_by_test_id("lesson-header")).to_be_visible()
    frame.get_by_role("button", name=re.compile("^Next")).click()
    expect(frame.get_by_text("Ready to multiply?", exact=True)).not_to_be_visible()
    frame.get_by_role("button", name="Close lesson", exact=True).click()
    frame.get_by_role("button", name="Back", exact=True).click()
    expect(frame.get_by_text("Choose what to learn:", exact=True)).to_be_visible()
    frame.get_by_role("button", name="Practice Mode").click()
    expect(frame.get_by_text("Pick your math adventure", exact=True)).to_be_visible()
    frame.get_by_role("button", name="Multiplication").click()
    frame.get_by_role("button", name="I'm Ready! Let's Practice!", exact=True).click()
    question = frame.get_by_text(re.compile(r"^\d+ × \d+ = \?$"))
    expect(question).to_be_visible()
    text = question.inner_text()
    a, b = map(int, re.findall(r"\d+", text))
    for digit in str(a * b):
        frame.get_by_role("button", name=digit, exact=True).click()
    expect(frame.get_by_text(re.compile(r"^🔥\s*1$"))).to_be_visible()
    frame.get_by_role("button", name="Back to practice selection", exact=True).click()
    expect(frame.get_by_text("Pick your math adventure", exact=True)).to_be_visible()
    frame.get_by_role("button", name="Back to Lessons", exact=True).click()
    expect(frame.get_by_text("Math Lessons", exact=True)).to_be_visible()
    frame.get_by_role("button", name="Back", exact=True).click()

    frame.get_by_role("button", name="Settings", exact=True).click()
    expect(frame.locator("#home-parent-answer")).to_be_visible()
    a, b = map(int, re.search(r"(\d+)\s*\+\s*(\d+)\s*=\s*\?", app.inner_text()).groups())
    frame.locator("#home-parent-answer").fill(str(a + b))
    frame.get_by_role("button", name="Check", exact=True).click()
    expect(frame.get_by_role("button", name="Go to home", exact=True)).to_be_visible()
    frame.get_by_role("button", name="Progress Report", exact=True).click()
    expect(app).to_have_attribute("data-screen", "progress")
    frame.get_by_role("button", name="Back to Home", exact=True).click()

    frame.get_by_role("button", name="Battle", exact=True).click()
    frame.get_by_role("button", name="START BATTLE", exact=True).click()
    battle = frame.get_by_test_id("battle-screen")
    expect(battle).to_have_attribute("data-phase", "table_review")
    frame.get_by_role("button", name=re.compile("I'm Ready")).click()
    expect(battle).to_have_attribute("data-phase", "player_question")
    text = frame.get_by_test_id("battle-question").inner_text()
    a, b = map(int, re.findall(r"\d+", text)[:2])
    for digit in str(a // b if "÷" in text else a * b):
        frame.get_by_test_id("battle-keypad").get_by_role("button", name=digit, exact=True).click()
    expect(battle).to_have_attribute("data-phase", "enemy_question")
    frame.get_by_role("button", name=re.compile("Exit Battle")).click()
    expect(app).to_have_attribute("data-screen", "fightSetup")
    frame.get_by_role("button", name="Back to Home", exact=True).click()
    expect(app).to_have_attribute("data-screen", "home")
    print("PASS achievements, earned-coin purchase, saved customization, lesson, practice, settings, progress and battle")


with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={"width": 1366, "height": 1000}, reduced_motion="reduce")
    context.add_init_script(f"""
      if (location.protocol === 'http:' && !localStorage.getItem('mathTank_settings'))
        localStorage.setItem('mathTank_settings', {json.dumps(settings)});
    """)
    requests, errors, missing = [], [], []
    context.on("request", lambda r: requests.append(r.url))
    context.on("page", lambda page: page.on("pageerror", lambda error: errors.append(str(error))))
    page = context.new_page()
    page.set_default_timeout(30000)
    page.on("response", lambda r: missing.append(r.url) if r.url.startswith(args.url) and r.status >= 400 else None)
    page.goto(args.url + "/play/math-tank.html")
    expect(page.locator("#universe-frame")).not_to_have_attribute("src", re.compile(".+"))
    expect(page.locator("[data-web-game-ad]")).not_to_be_visible()
    page.get_by_role("button", name="Play Math Tank", exact=True).click()
    assert page.locator("#universe-frame").bounding_box()["y"] >= page.locator(".nav").bounding_box()["height"]
    frame = page.frame_locator("#universe-frame")
    exercise_full_game(frame)
    frame.get_by_role("button", name="Universe", exact=True).click()
    expect(frame.get_by_test_id("universe-start-battle")).to_be_visible()
    assert page.locator("#universe-frame").bounding_box()["width"] > 1000
    frame.get_by_test_id("universe-start-battle").click()
    expect(frame.get_by_test_id("universe-question")).to_be_visible()
    for _ in range(5):
        solve(frame)
        page.wait_for_timeout(3500)
    expect(frame.get_by_test_id("universe-victory")).to_be_visible()
    saved = page.evaluate("JSON.parse(localStorage.getItem('math_tank_universe_progress'))")
    assert saved["currentLevel"] == 2 and saved["totalWins"] == 1, saved
    page.reload()
    page.get_by_role("button", name="Play Math Tank", exact=True).click()
    frame = page.frame_locator("#universe-frame")
    enter_universe(frame)
    expect(frame.get_by_test_id("universe-start-battle")).to_be_visible()
    assert page.evaluate("JSON.parse(localStorage.getItem('math_tank_universe_progress')).currentLevel") == 2
    frame.get_by_test_id("universe-start-battle").click()
    expect(frame.get_by_test_id("universe-question")).to_be_visible()
    paused_question = frame.get_by_test_id("universe-question").inner_text()
    solve(frame)
    page.locator("#universe-frame").evaluate(
        "el => el.contentWindow.postMessage({type:'pauseAudio'}, location.origin)")
    # Freeze an actual in-flight shot, not just an idle question without a timer.
    page.wait_for_timeout(5000)
    assert frame.get_by_test_id("universe-question").inner_text() == paused_question
    page.locator("#universe-frame").evaluate(
        "el => el.contentWindow.postMessage({type:'resumeAudio'}, location.origin)")
    expect(frame.get_by_test_id("universe-question")).not_to_have_text(paused_question)
    assert not any("googlesyndication.com" in url or "googletagmanager.com" in url for url in requests), requests
    assert not errors, errors
    assert not missing, missing
    print("PASS universe battle, saved level after reload, large-screen layout, no default tracking/ads")
    context.close()

    for width, height in [(390, 844), (800, 1000)]:
        context = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce")
        context.add_init_script(f"""
          if (location.protocol === 'http:') {{
            localStorage.setItem('mathTank_settings', {json.dumps(settings)});
          }}
        """)
        page = context.new_page()
        page.goto(args.url + "/games/mathtank/")
        enter_universe(page)
        expect(page.get_by_test_id("universe-start-battle")).to_be_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.get_by_test_id("universe-start-battle").click()
        expect(page.get_by_test_id("universe-question")).to_be_visible()
        for button in page.locator('[data-testid^="universe-answer-"]').all():
            bounds = button.bounding_box()
            assert bounds["x"] >= 0 and bounds["x"] + bounds["width"] <= width + 1
            assert bounds["y"] >= 0 and bounds["y"] + bounds["height"] <= height + 1
        print(f"PASS playable question and answers at {width}x{height}")
        context.close()

    for width in (1366, 390):
        context = browser.new_context(viewport={"width": width, "height": 844}, reduced_motion="reduce")
        context.add_init_script(f"""
          if (location.protocol === 'http:')
            localStorage.setItem('mathTank_settings', {json.dumps(settings)});
        """)
        page = context.new_page()
        page.goto(args.url + "/games/mathtank/")
        for level in (1, 4, 88, 91):
            progress = {**saved, "currentLevel": level, "highestLevel": level}
            page.evaluate("progress => localStorage.setItem('math_tank_universe_progress', JSON.stringify(progress))", progress)
            page.reload()
            enter_universe(page)
            region = page.get_by_role("region", name="Universe world map", exact=True)
            expect(page.locator("[data-universe-world]")).to_have_count(min(30, (level + 2) // 3))
            if level <= 90:
                current = page.locator('[data-universe-world][aria-current="step"]')
                expect(current).to_be_visible()
                page.wait_for_function("""() => {
                  const a = document.querySelector('[data-universe-world][aria-current="step"]').getBoundingClientRect();
                  const b = document.querySelector('[aria-label="Universe world map"]').getBoundingClientRect();
                  return Math.abs(a.x + a.width / 2 - b.x - b.width / 2) < 3;
                }""")
            else:
                expect(page.get_by_test_id("universe-complete")).to_be_visible()
                trophy = page.get_by_text("UNIVERSE SAVED!", exact=True)
                trophy.scroll_into_view_if_needed()
                bounds, viewport = trophy.bounding_box(), region.bounding_box()
                assert viewport["x"] - 1 <= bounds["x"] and bounds["x"] + bounds["width"] <= viewport["x"] + viewport["width"] + 1, (bounds, viewport)
                expect(page.get_by_role("button", name="Next world", exact=True)).to_be_disabled()
            if level == 1:
                expect(page.locator("[data-universe-mystery]")).to_have_count(3)
                page.get_by_role("button", name="Next world", exact=True).click()
                page.wait_for_function("document.querySelector('[aria-label=\"Universe world map\"]').scrollLeft > 100")
                expect(page.get_by_role("button", name="Previous world", exact=True)).to_be_enabled()
        print(f"PASS centered map, mysterious destinations, saved-world progression and completion at width {width}")
        context.close()

    context = browser.new_context()
    context.add_init_script("""
      Storage.prototype.setItem = function() { throw new DOMException('Storage blocked', 'SecurityError'); };
    """)
    page = context.new_page()
    page.goto(args.url + "/games/mathtank/")
    expect(page.get_by_role("alert")).to_be_visible()
    expect(page.get_by_test_id("universe-start-battle")).not_to_be_visible()
    print("PASS blocked storage produces an explicit error before gameplay")
    context.close()

    # Operator flags are not visitor consent or verified provider/child-treatment readiness.
    context = browser.new_context()
    context.route("**/_data/web-ads.json", lambda route: route.fulfill(
        content_type="application/json",
        body=json.dumps({"enabled": True, "privacySetupVerified": True, "mathTankSlot": "1234567890"})))
    ad_requests, ad_errors = [], []
    context.on("request", lambda request: ad_requests.append(request.url)
               if "googlesyndication.com" in request.url or "doubleclick.net" in request.url else None)
    context.route("https://pagead2.googlesyndication.com/**", lambda route: route.abort())
    page = context.new_page()
    page.on("console", lambda message: ad_errors.append(message.text) if message.type == "error" else None)
    page.goto(args.url + "/play/math-tank.html")
    expect(page.locator("[data-web-game-ad]")).to_have_attribute("data-web-ad-state", "blocked")
    expect(page.locator("[data-web-game-ad]")).to_have_attribute("data-web-ad-error", "activation-unimplemented")
    expect(page.locator("[data-web-game-ad]")).not_to_be_visible()
    expect(page.locator("ins.adsbygoogle")).not_to_have_attribute("data-ad-slot", re.compile(".+"))
    assert page.evaluate("typeof window.adsbygoogle") == "undefined"
    assert any("not visitor consent" in error for error in ad_errors), ad_errors
    page.locator("ins.adsbygoogle").evaluate("el => el.dataset.adStatus = 'unfilled'")
    expect(page.locator("[data-web-game-ad]")).not_to_be_visible()
    page.get_by_role("button", name="Play Math Tank", exact=True).click()
    expect(page.locator("#universe-frame")).to_be_visible()
    assert not ad_requests, ad_requests
    print("PASS operator-only display-ad configuration is blocked with no provider request; gameplay is unaffected")
    context.close()
    browser.close()
