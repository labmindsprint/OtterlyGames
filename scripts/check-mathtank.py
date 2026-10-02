"""Check the real Math Tank demo and both website entry points."""
import argparse
import re
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--url", default="http://127.0.0.1:4191")
parser.add_argument("--output", type=Path, required=True)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)


def answer(frame):
    text = frame.get_by_test_id("battle-question").inner_text()
    a, b = map(int, re.findall(r"\d+", text)[:2])
    value = a // b if "÷" in text else a * b
    for digit in str(value):
        frame.get_by_test_id("battle-keypad").get_by_role("button", name=digit, exact=True).click()


with sync_playwright() as p:
    browser = p.chromium.launch()
    for width, height in [(320, 740), (390, 844), (800, 1000), (1280, 900)]:
        context = browser.new_context(viewport={"width": width, "height": height})
        context.add_init_script("""
          localStorage.setItem('mathTank_settings', JSON.stringify({
            soundEnabled:false, musicEnabled:false, voiceVolume:0, playerAge:6
          }));
          window.__gameMessages=[];
          addEventListener('message',e=>window.__gameMessages.push(e.data?.type));
        """)
        def route_request(route):
            if route.request.url.startswith(args.url):
                route.continue_()
            else:
                stub = "window.kofiWidgetOverlay={draw(){}};" if "ko-fi.com" in route.request.url else ""
                route.fulfill(status=200, content_type="application/javascript", body=stub)
        context.route("**/*", route_request)
        page = context.new_page()
        page.set_default_timeout(20000)
        errors, missing = [], []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("response", lambda r: missing.append(r.url) if r.url.startswith(args.url) and r.status >= 400 else None)
        page.goto(args.url + "/apps/math-tank.html")
        for image in page.locator(".mt-icon,.mt-phone-shot,.mt-gallery img").all():
            image.scroll_into_view_if_needed()
            assert image.evaluate("async e=>{await e.decode();return e.naturalWidth>0}")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.locator("#math-demo-start").click()
        frame = page.frame_locator("#math-demo-frame")
        frame.get_by_role("button", name="Start Battle", exact=True).click()
        screen = frame.get_by_test_id("battle-screen")
        expect(screen).to_have_attribute("data-phase", "table_review")
        # Offscreen iframes must freeze the review countdown and the question timer.
        page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
        expect(frame.get_by_role("heading", name="PAUSED", exact=True)).to_be_visible()
        page.wait_for_timeout(1000)
        page.locator("#math-demo").scroll_into_view_if_needed()
        expect(frame.get_by_role("heading", name="PAUSED", exact=True)).not_to_be_visible()
        frame.get_by_role("button", name=re.compile("I'm Ready")).click()
        expect(screen).to_have_attribute("data-phase", "player_question")
        question = frame.get_by_test_id("battle-question").inner_text()
        page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
        expect(frame.get_by_role("heading", name="PAUSED", exact=True)).to_be_visible()
        page.wait_for_timeout(10500)
        page.locator("#math-demo").scroll_into_view_if_needed()
        expect(frame.get_by_role("heading", name="PAUSED", exact=True)).not_to_be_visible()
        expect(screen).to_have_attribute("data-phase", "player_question")
        assert frame.get_by_test_id("battle-question").inner_text() == question
        answer(frame)
        expect(screen).to_have_attribute("data-phase", "enemy_question")
        page.screenshot(path=str(args.output / f"battle-{width}.png"))
        if width == 390:
            for _ in range(20):
                if screen.get_attribute("data-phase") == "battle_end":
                    break
                expect(screen).to_have_attribute("data-phase", re.compile("^(player_question|enemy_question|battle_end)$"), timeout=30000)
                if screen.get_attribute("data-phase") == "battle_end":
                    break
                answer(frame)
                page.wait_for_timeout(2500)
            expect(screen).to_have_attribute("data-phase", "battle_end")
            assert page.evaluate("window.__gameMessages.includes('gameEnd')")
            expect(frame.get_by_text("Advertisement", exact=True)).to_have_count(0)
            frame.get_by_role("button", name="Play Again", exact=True).click()
            expect(screen).to_have_attribute("data-phase", "table_review")
        page.goto(args.url + "/")
        for section in [".clock-section", ".math-section"]:
            preview = page.locator(section + " .game-phone-preview")
            preview.scroll_into_view_if_needed()
            assert preview.evaluate("async e=>{await e.decode();return e.naturalWidth>0&&getComputedStyle(e).objectFit==='contain'}")
            page.wait_for_timeout(700)
            page.locator(section + " .game-inner").screenshot(path=str(args.output / f"{section[1:]}-{width}.png"))
        for game in ["Clock Master", "Math Tank"]:
            page.locator(".play-tab").filter(has_text=game).click()
            active = ".clock-splash" if game == "Clock Master" else ".math-splash"
            preview = page.locator(active)
            assert preview.evaluate("async e=>{await e.decode();return e.naturalWidth>0&&getComputedStyle(e).objectFit==='contain'}")
            expect(preview).to_have_css("opacity", "1")
            expect(page.locator("#playStartOverlay")).to_have_accessible_name("▶ Play " + game)
            assert page.locator("#playStartOverlay img,#playStartOverlay p").count() == 0
            assert page.locator("#splashLabel").evaluate("e=>e.getBoundingClientRect().height<=48&&e.scrollWidth<=e.clientWidth")
            package = "com.clockmaster.timeforjuniors" if game == "Clock Master" else "com.namasya.mathtank"
            expect(page.locator("#gameOverlay .overlay-dl")).to_have_attribute("href", "https://play.google.com/store/apps/details?id=" + package)
            page.wait_for_timeout(700)
            page.locator("#playPhone").screenshot(path=str(args.output / f"preview-{game.replace(' ', '-')}-{width}.png"))
        page.locator('.play-tab[data-game="math"]').click()
        page.locator("#playStartOverlay").click()
        expect(page.locator("#playStartOverlay")).not_to_be_visible()
        expect(page.locator("#playSplash")).not_to_be_visible()
        home = page.frame_locator("#math-frame")
        home.get_by_role("button", name="Start Battle", exact=True).click()
        expect(home.get_by_test_id("battle-screen")).to_have_attribute("data-phase", "table_review")
        countdown = home.get_by_text(re.compile("Study before battle")).text_content()
        page.locator('.play-tab[data-game="clock"]').click()
        page.wait_for_timeout(6000)
        page.locator('.play-tab[data-game="math"]').click()
        expect(home.get_by_role("heading", name="PAUSED", exact=True)).not_to_be_visible()
        remaining = home.get_by_text(re.compile("Study before battle")).text_content()
        assert int(re.search(r"(\d+)s", countdown)[1]) - int(re.search(r"(\d+)s", remaining)[1]) <= 1
        home.get_by_role("button", name=re.compile("I'm Ready")).click()
        expect(home.get_by_test_id("battle-screen")).to_have_attribute("data-phase", "player_question")
        page.screenshot(path=str(args.output / f"homepage-{width}.png"))
        assert not errors, errors
        assert not missing, missing
        print(f"PASS app page + homepage demo at {width}x{height}", flush=True)
        context.close()
    browser.close()
