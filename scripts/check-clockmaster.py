"""Browser checks for the static Clock Master bundle, demo and game launcher.

Run against a local static server; output screenshots outside the repository.
Unexpected third-party requests fail these checks.
"""
import argparse
import re
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--url", default="http://127.0.0.1:4186")
parser.add_argument("--output", type=Path, required=True)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)


def correct_answer(frame):
    hands = frame.locator("div[style*='transform-origin: 3px center']").evaluate_all(
        "(els)=>els.map(e=>({width:e.style.width,transform:e.style.transform}))")
    angles = {h["width"]: float(re.search(r"rotate\(([-\d.]+)deg\)", h["transform"])[1])
              for h in hands}
    minutes = round(((angles["50px"] + 90) % 360) / 6) % 60
    hour = round(((angles["35px"] + 90) % 360 - minutes * .5) / 30) % 12 or 12
    return f"{hour}:{minutes:02}"


with sync_playwright() as p:
    browser = p.chromium.launch()
    for width, height in [(320, 740), (390, 844), (1280, 900)]:
        context = browser.new_context(viewport={"width": width, "height": height})
        context.add_init_script("""
          localStorage.setItem('clock_master_tutorial', '{"hasSeenHomeTutorial":true}');
          localStorage.setItem('clock_master_settings', '{"audioMuted":true}');
          window.__gameMessages=[];
          window.addEventListener('message', e=>window.__gameMessages.push(e.data?.type));
        """)
        page = context.new_page()
        page.set_default_timeout(15000)
        errors, missing, external = [], [], []
        page.on("pageerror", lambda error: errors.append(error.stack))
        page.on("response", lambda r: missing.append(r.url) if r.url.startswith(args.url) and r.status >= 400 else None)
        page.on("request", lambda r: external.append(r.url) if not r.url.startswith((args.url + "/", "data:", "blob:")) else None)
        page.goto(args.url + "/apps/clock-master.html", wait_until="domcontentloaded")
        expect(page.get_by_role("heading", name="11 Guided Clock Chapters")).to_be_attached()
        for image in page.locator(".cm-icon,.cm-phone-shot,.cm-feature img").all():
            image.scroll_into_view_if_needed()
            assert image.evaluate("async e=>{await e.decode();return e.naturalWidth>0}")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
        page.wait_for_timeout(400)
        page.screenshot(path=str(args.output / f"app-page-{width}.png"))
        page.locator("#clock-demo-start").click()
        frame = page.frame_locator("#clock-demo-frame")
        expect(frame.locator(".race-ready-content")).to_be_visible()
        frame.get_by_role("button", name="Start Race!", exact=True).click()
        expect(frame.locator(".race-answer").first).to_be_visible()
        frame.get_by_role("button", name=correct_answer(frame), exact=True).click()
        expect(frame.locator(".race-feedback")).to_have_attribute("data-feedback", "correct")
        # Scrolling the embed out of sight must pause gameplay, not just hide it.
        page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
        expect(page.locator("#clock-demo-frame")).not_to_be_in_viewport()
        expect(frame.get_by_role("dialog", name="Race paused", exact=True)).to_be_attached()
        page.locator("#clock-demo").scroll_into_view_if_needed()
        frame.get_by_role("button", name="Resume race", exact=True).click()
        page.wait_for_timeout(400)
        page.screenshot(path=str(args.output / f"app-demo-{width}.png"))
        # Complete a real round and verify the parent receives its completion event.
        for _ in range(30):
            if frame.get_by_role("dialog", name="Race results", exact=True).count():
                break
            expect(frame.locator(".race-answer").first).to_be_enabled()
            button = frame.get_by_role("button", name=correct_answer(frame), exact=True)
            expect(button).to_be_enabled()
            button.click()
            page.wait_for_timeout(1150)
        expect(frame.get_by_role("dialog", name="Race results", exact=True)).to_be_visible()
        assert page.evaluate("window.__gameMessages.includes('gameEnd')")
        page.goto(args.url + "/")
        page.get_by_role("link", name="Play Clock Master", exact=True).click()
        assert page.locator("#universe-frame").get_attribute("src") is None
        page.locator("#launch-game").click()
        home = page.frame_locator("#universe-frame")
        home.get_by_role("button", name="Time Race Game", exact=True).click()
        home.get_by_role("button", name="Start Race!", exact=True).click()
        expect(home.locator(".race-answer").first).to_be_visible()
        page.locator("#universe-frame").evaluate(
            "e=>scrollTo({top:scrollY+e.getBoundingClientRect().bottom+1,behavior:'instant'})")
        expect(page.locator("#universe-frame")).not_to_be_in_viewport()
        expect(home.locator('[role="dialog"][aria-label="Race paused"]')).to_be_attached()
        page.wait_for_timeout(1500)
        page.locator("#launch-game").click()
        home.get_by_role("button", name="Resume race", exact=True).click()
        page.wait_for_timeout(400)
        page.screenshot(path=str(args.output / f"home-demo-{width}.png"))
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert not external, external
        # Full-size home, animated companion, universe assets, and scoped manifest.
        page.goto(args.url + "/games/clockmaster/")
        page.get_by_role("button", name="Play with Otterly", exact=True).click()
        expect(page.locator('[data-avatar="otter"] .character-rig')).to_be_visible()
        page.get_by_role("button", name="Explore Universe", exact=True).click()
        expect(page.locator(".universe-art img").first).to_be_visible()
        assert page.locator(".universe-art img").first.evaluate("async e=>{await e.decode();return e.naturalWidth>0}")
        page.wait_for_function("""() => [...document.querySelectorAll('.universe-art canvas')]
          .some(c => c.width > 0 && c.style.opacity === '1')""")
        manifest = page.request.get(args.url + "/games/clockmaster/manifest.json").json()
        assert manifest["scope"] == "/games/clockmaster/"
        for icon in manifest["icons"]:
            assert page.request.get(args.url + icon["src"]).ok
        assert not missing, missing
        assert not errors, errors
        assert not external, external
        print(f"PASS website + embeds + assets at {width}x{height}", flush=True)
        context.close()
    context = browser.new_context(viewport={"width": 1280, "height": 900})
    context.add_init_script("""
      window.__audio=[];
      const play=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function() {
        if (!window.__audio.includes(this)) window.__audio.push(this);
        return play.apply(this,arguments);
      };
      localStorage.setItem('clock_master_settings', JSON.stringify({
        audioMuted:false, soundEnabled:true, musicEnabled:true, voiceOversEnabled:false
      }));
    """)
    page = context.new_page()
    page.goto(args.url + "/apps/clock-master.html")
    page.locator("#clock-demo-start").click()
    expect(page.frame_locator("#clock-demo-frame").locator(".race-ready-content")).to_be_visible()
    game = page.frame(url=re.compile(r"/games/clockmaster/"))
    assert game
    expect(game.locator(".race-ready-content")).to_be_visible()
    game.get_by_role("button", name="Start Race!", exact=True).click()
    expect(game.locator(".race-answer").first).to_be_visible()
    game.wait_for_function("window.__audio.some(a=>!a.paused)")
    assert game.evaluate("window.__audio.every(a=>new URL(a.src).pathname.startsWith('/games/clockmaster/audio/'))")
    page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
    expect(page.locator("#clock-demo-frame")).not_to_be_in_viewport()
    game.wait_for_function("window.__audio.every(a=>a.paused)")
    page.locator("#clock-demo").scroll_into_view_if_needed()
    game.get_by_role("button", name="Resume race", exact=True).click()
    game.wait_for_function("window.__audio.some(a=>!a.paused)")
    print("PASS embed audio pauses offscreen and resumes without changing saved settings", flush=True)
    context.close()
    browser.close()
