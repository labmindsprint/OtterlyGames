"""Check the static discovery funnel, shared navigation and responsive pages."""

import argparse
import json
import re
import traceback
import urllib.parse
import xml.etree.ElementTree as ET
from contextlib import contextmanager
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parent.parent
GAME_ENTRIES = json.loads((ROOT / "_data" / "games.json").read_text(encoding="utf-8"))["games"]
SIZES = [(1366, 768), (1440, 900), (1920, 1080), (1280, 600),
         (1024, 768), (800, 1000), (390, 844), (844, 390)]
ALL_PAGE_SIZES = [(1366, 768), (800, 1000), (390, 844), (320, 740)]
CORE = [
    "/", "/play/", "/learn/", "/parents/", "/tools/", "/blog/",
    "/learn/telling-time.html", "/learn/times-tables.html",
    "/learn/division.html", "/learn/spelling.html", "/learn/imo-preparation.html", "/learn/olympiad-mock-test.html",
    "/tools/worksheet-builder.html", "/play/clock-master.html",
    "/play/math-tank.html", "/about.html", "/contact.html", "/support.html",
    "/apps/clock-master.html", "/apps/math-tank.html", "/apps/space-academy.html", "/apps/otter-element.html",
]
CORE.extend(game["url"] for game in GAME_ENTRIES if game["url"] not in CORE)
STANDALONE = {"/Arcade/game.html", "/Arcade/pigeon.html",
              "/Arcade/shepherd.html", "/Arcade/zombie.html"}
ART = {"/", "/play/", "/tools/", "/blog/", "/parents/", "/learn/",
       "/tools/worksheet-builder.html", "/about.html", "/contact.html", "/Arcade/"}
ART.update(game["url"] for game in GAME_ENTRIES)


def run():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:4196")
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--only", default="", help="Regex matching case names")
    parser.add_argument("--lab", action="store_true", help="Include a throttled mobile lab sample")
    args = parser.parse_args()
    output = args.output.resolve()
    if output == ROOT or ROOT in output.parents:
        parser.error("--output must be outside the repository")
    output.mkdir(parents=True, exist_ok=True)
    base = args.url.rstrip("/")
    results = []
    links = set()
    routes = [
        urllib.parse.urlsplit(el.text).path
        for el in ET.parse(ROOT / "sitemap.xml").iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
    ]
    if not routes:
        raise RuntimeError("No public routes found in sitemap.xml")
    inventory = json.loads((ROOT / "_data" / "public-pages.json").read_text(encoding="utf-8"))
    assert set(routes) == {page["route"] for page in inventory["pages"]}, "Sitemap and public inventory differ"

    def record(name, callback):
        if args.only and not re.search(args.only, name):
            return
        try:
            data = callback()
            result = {"name": name, "passed": True, **(data or {})}
        except Exception as error:
            result = {"name": name, "passed": False, "error": str(error),
                      "traceback": traceback.format_exc()}
        results.append(result)
        (output / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
        print(("PASS " if result["passed"] else "FAIL ") + name, flush=True)
        if not result["passed"]:
            print(result["error"].encode("ascii", "backslashreplace").decode("ascii"), flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        probe = browser.new_context()
        response = probe.request.get(base + "/")
        if response.status != 200:
            raise RuntimeError(f"Static preview is not responsive: {response.status}")
        probe.close()

        def page_check(route, size, javascript=True, lab=False, keyboard=False):
            context = browser.new_context(
                viewport={"width": size[0], "height": size[1]},
                java_script_enabled=javascript, reduced_motion="reduce",
            )
            page = context.new_page()
            issues, external = [], []
            page.on("pageerror", lambda e: issues.append(str(e)))
            page.on("console", lambda m: issues.append(m.text) if m.type == "error" else None)
            page.on("response", lambda r: issues.append(f"{r.status}: {r.url}") if r.status >= 400 else None)
            page.on("request", lambda r: external.append(r.url) if not r.url.startswith((base + "/", "data:", "blob:")) else None)
            page.add_init_script("""
                window.__siteLCP = null;
                new PerformanceObserver(list => {
                  const last = list.getEntries().at(-1);
                  if (last) window.__siteLCP = last.startTime;
                }).observe({type:'largest-contentful-paint', buffered:true});
            """)
            if lab:
                cdp = context.new_cdp_session(page)
                cdp.send("Network.enable")
                cdp.send("Network.emulateNetworkConditions", {
                    "offline": False, "latency": 150,
                    "downloadThroughput": 200000, "uploadThroughput": 93750,
                })
                cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
            try:
                response = page.goto(base + route, wait_until="load", timeout=45000)
                assert response.status == 200, response.status
                if route in STANDALONE:
                    expect(page.locator(".game-topbar")).to_be_visible()
                else:
                    expect(page.locator("h1").first).to_be_visible()
                if javascript:
                    page.evaluate("document.fonts.ready")
                page.wait_for_timeout(150)
                assert not page.get_by_text("Directory listing for", exact=False).count()
                canonical = page.locator('link[rel="canonical"]').get_attribute("href")
                assert canonical == "https://otterlygames.com" + route, (route, canonical)
                if route not in STANDALONE:
                    expect(page.locator("nav.nav")).to_have_count(1)
                    expect(page.locator("footer.footer")).to_have_count(1)
                    expect(page.locator('nav.nav a[href="/learn/"]')).to_be_attached()
                    assert page.locator("#main-content").count() == 1
                    assert page.locator("h1").count() == 1
                    if javascript:
                        toggle = page.locator("#navToggle")
                        expect(toggle).to_have_attribute("aria-expanded", "false")
                        if size[0] <= 960:
                            toggle.click()
                            expect(toggle).to_have_attribute("aria-expanded", "true")
                            expect(page.locator('nav.nav a[href="/parents/"]')).to_be_visible()
                            expect(page.locator('nav.nav a[href="/tools/"]')).to_be_visible()
                            expect(page.locator('nav.nav a[href="/blog/"]')).to_be_visible()
                            page.keyboard.press("Escape")
                            expect(toggle).to_have_attribute("aria-expanded", "false")
                            expect(toggle).to_be_focused()
                    else:
                        expect(page.locator('nav.nav a[href="/learn/"]')).to_be_visible()
                        expect(page.locator('nav.nav a[href="/parents/"]')).to_be_visible()
                if route.startswith("/Arcade/") and route in STANDALONE:
                    expect(page.locator(".game-device-note")).to_be_visible()
                if keyboard:
                    skip = page.locator(".skip-link")
                    skip.focus()
                    expect(skip).to_be_visible()
                    page.keyboard.press("Enter")
                    expect(page.locator("#main-content")).to_be_focused()
                    heading_top = page.locator("h1").first.evaluate("e => e.getBoundingClientRect().top")
                    nav_bottom = page.locator("nav.nav").evaluate("e => e.getBoundingClientRect().bottom")
                    assert heading_top >= nav_bottom - 1, (heading_top, nav_bottom)
                metrics = page.evaluate("""() => {
                  const uncontained = [...document.querySelectorAll('body *')].filter(element => {
                    const bounds = element.getBoundingClientRect();
                    if (!bounds.width || !bounds.height || (bounds.left >= -2 && bounds.right <= innerWidth + 2)) return false;
                    if (getComputedStyle(element).visibility === 'hidden') return false;
                    for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
                      const box = parent.getBoundingClientRect();
                      if (box.left >= -2 && box.right <= innerWidth + 2 &&
                          ['hidden','clip','auto','scroll'].includes(getComputedStyle(parent).overflowX)) return false;
                    }
                    return true;
                  });
                  return {
                    width: innerWidth,
                    documentWidth: document.documentElement.scrollWidth,
                    bodyWidth: document.body.getBoundingClientRect().width,
                    brandLines: (() => {
                      const brand = document.querySelector('.nav-brand .brand-text');
                      if (!brand) return 0;
                      const range = document.createRange();
                      range.selectNodeContents(brand);
                      return range.getClientRects().length;
                    })(),
                    knownTransferBytes: performance.getEntriesByType('resource')
                      .reduce((sum, r) => sum + r.transferSize, 0),
                    lcpMilliseconds: window.__siteLCP,
                    broken: [...document.images].filter(i => i.complete && i.currentSrc && !i.naturalWidth)
                      .map(i => i.currentSrc),
                    widgetOverflow: [...document.querySelectorAll('.clock-area > .clock-container, .clock-area > svg, .clock-area > .options')]
                      .filter(e => {
                        const box = e.getBoundingClientRect(), parent = e.parentElement;
                        const bounds = parent.getBoundingClientRect(), style = getComputedStyle(parent);
                        const left = bounds.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
                        const right = bounds.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
                        return box.left < left - 1 || box.right > right + 1;
                      }).map(e => ({class: e.getAttribute('class'), width: e.getBoundingClientRect().width})),
                    uncontainedOverflow: uncontained.slice(0, 15).map(e => ({
                      tag: e.tagName, class: e.getAttribute('class'), text: e.textContent.trim().slice(0, 80),
                      left: e.getBoundingClientRect().left, right: e.getBoundingClientRect().right
                    })),
                    oversized: [...document.querySelectorAll('main, .home-hero, .home-arcade, .home-feature, .home-grownups, .growth-grid, .front-skill-grid, .catalogue-grid, .catalogue-card, .game-intro, .game-intro-scene, .game-preview, .game-lesson')]
                      .filter(e => {const r=e.getBoundingClientRect();return r.width>innerWidth+1||r.left< -1||r.right>innerWidth+1})
                      .map(e => ({tag:e.tagName, class:e.className, width:e.getBoundingClientRect().width}))
                  };
                }""")
                assert metrics["documentWidth"] <= size[0] + 1, metrics
                assert not metrics["oversized"], metrics["oversized"]
                assert not metrics["uncontainedOverflow"], metrics["uncontainedOverflow"]
                assert not metrics["widgetOverflow"], metrics["widgetOverflow"]
                assert not metrics["broken"], metrics["broken"]
                if route not in STANDALONE:
                    assert metrics["brandLines"] == 1, "The navigation brand must not wrap"
                if route == "/":
                    expect(page.locator('[data-home-game="math-tank"]')).to_be_visible()
                    expect(page.locator('[data-home-game="clock-master"]')).to_be_visible()
                    expect(page.locator("[data-game-catalogue]")).to_have_count(0)
                    expect(page.get_by_role("heading", level=1)).to_have_text("Learninglike no otter.")
                if javascript and route not in STANDALONE:
                    expected_section = "/Arcade/" if route.startswith("/Arcade/") or route in {
                        "/play/ninja-shuriken.html", "/play/zombie-hide-and-seek.html",
                        "/play/captain-pigeon.html", "/play/dog-shepherd.html"
                    } else "/play/" if route.startswith(("/play/", "/apps/")) else next(
                        (section for section in ["/learn/", "/tools/", "/blog/", "/parents/"]
                         if route.startswith(section)), None)
                    if expected_section:
                        expect(page.locator("nav.nav [aria-current]")).to_have_count(1)
                        expect(page.locator("nav.nav [aria-current]")).to_have_attribute("href", expected_section)
                if not javascript and route in ("/tools/", "/blog/"):
                    data = json.loads((ROOT / "_data" / ("tools.json" if route == "/tools/" else "blogs.json")).read_text(encoding="utf-8"))
                    for item in data["tools" if route == "/tools/" else "posts"]:
                        expect(page.locator(f'noscript a[href="{item["url"]}"]')).to_be_visible()
                for href in page.locator("a[href]").evaluate_all("els => els.map(e => e.href)"):
                    parsed = urllib.parse.urlsplit(href)
                    if parsed.netloc == urllib.parse.urlsplit(base).netloc:
                        links.add(parsed.path)
                assert not issues, issues
                assert not external, external
                if size == (390, 844) or route in ART and size == (1366, 768) or lab:
                    page.evaluate("scrollTo({top:0,behavior:'instant'})")
                    name = (route.strip("/").replace("/", "-").replace(".html", "") or "home")
                    suffix = "-nojs" if not javascript else "-lab" if lab else ""
                    page.screenshot(path=str(output / f"{name}-{size[0]}x{size[1]}{suffix}.png"))
                    if route == "/" and javascript:
                        page.screenshot(path=str(output / f"{name}-{size[0]}x{size[1]}{suffix}-full.png"), full_page=True)
                return {"route": route, "size": size, "javascript": javascript,
                        "metrics": metrics, "externalRequests": external}
            except Exception:
                name = (route.strip("/").replace("/", "-").replace(".html", "") or "home")
                page.screenshot(path=str(output / f"FAIL-{name}-{size[0]}x{size[1]}.png"))
                raise
            finally:
                context.close()

        for route in routes:
            for size in ALL_PAGE_SIZES:
                record(f"page-{route}-{size[0]}x{size[1]}", lambda r=route, s=size: page_check(r, s))
        for route in CORE:
            for size in [s for s in SIZES if s not in ALL_PAGE_SIZES]:
                record(f"page-{route}-{size[0]}x{size[1]}", lambda r=route, s=size: page_check(r, s))
        for route in ["/", "/tools/", "/blog/", "/play/", "/learn/", "/parents/", "/apps/clock-master.html", "/apps/math-tank.html", "/apps/space-academy.html", "/apps/otter-element.html"] + [game["url"] for game in GAME_ENTRIES]:
            record(f"nojs-{route}", lambda r=route: page_check(r, (390, 844), False))
        for route in ["/", "/play/", "/play/clock-master.html", "/play/ninja-shuriken.html", "/tools/clock-lessons.html", "/tools/multiplication-practice.html", "/blog/"]:
            for size in [(1366, 768), (390, 844)]:
                record(f"keyboard-{route}-{size[0]}x{size[1]}",
                       lambda r=route, s=size: page_check(r, s, keyboard=True))

        @contextmanager
        def feature_page(size=(390, 844), motion="reduce", touch=False):
            context = browser.new_context(viewport={"width": size[0], "height": size[1]}, reduced_motion=motion, has_touch=touch)
            context.add_init_script("""
                localStorage.setItem('clock_master_tutorial', '{"hasSeenHomeTutorial":true}');
                localStorage.setItem('clock_master_settings', '{"audioMuted":true}');
                localStorage.setItem('mathTank_settings', JSON.stringify({
                  soundEnabled:false, musicEnabled:false, voiceVolume:0, playerAge:6
                }));
            """)
            page = context.new_page()
            issues, external = [], []
            page.on("pageerror", lambda error: issues.append(str(error)))
            page.on("console", lambda message: issues.append(message.text) if message.type == "error" else None)
            page.on("response", lambda response: issues.append(f"{response.status}: {response.url}") if response.status >= 400 else None)
            page.on("request", lambda request: external.append(request.url) if not request.url.startswith((base + "/", "data:", "blob:")) else None)
            try:
                yield page
                assert not issues, issues
                assert not external, external
            finally:
                context.close()

        def catalogue_filters(route, size):
            with feature_page(size) as page:
                page.goto(base + route)
                catalogue = page.locator("[data-game-catalogue]")
                cards = catalogue.locator("[data-game-card]")
                visible = catalogue.locator("[data-game-card]:visible")
                search = page.get_by_role("searchbox", name="Search games")
                expect(visible).to_have_count(len(GAME_ENTRIES))
                expect(cards.nth(0)).to_have_attribute("data-game-card", "clock-master")
                expect(cards.nth(1)).to_have_attribute("data-game-card", "math-tank")
                for category in json.loads((ROOT / "_data" / "games.json").read_text(encoding="utf-8"))["categories"]:
                    button = catalogue.locator(f'[data-game-category="{category["id"]}"]')
                    button.click()
                    expect(button).to_have_attribute("aria-pressed", "true")
                    expect(visible).to_have_count(sum(category["id"] in game["categories"] for game in GAME_ENTRIES))
                catalogue.locator('[data-game-category="action"]').click()
                search.fill("tank")
                expect(visible).to_have_count(1)
                expect(visible).to_have_attribute("data-game-card", "math-tank")
                search.fill("clock")
                expect(visible).to_have_count(0)
                expect(catalogue.locator("[data-catalogue-empty]")).to_be_visible()
                page.get_by_role("button", name="Show all games", exact=True).click()
                expect(search).to_be_focused()
                expect(search).to_have_value("")
                expect(visible).to_have_count(len(GAME_ENTRIES))
                expect(catalogue.locator('[data-game-category="all"]')).to_have_attribute("aria-pressed", "true")
                search.fill("CLOCK")
                expect(visible).to_have_count(1)
                expect(visible).to_have_attribute("data-game-card", "clock-master")
                search.fill("")
                expect(cards).to_have_count(len(GAME_ENTRIES))
                for card in cards.all():
                    expect(card.locator(".catalogue-note")).not_to_be_empty()
                assert page.locator("iframe").count() == 0
                page.screenshot(path=str(output / f"catalogue-{route.strip('/') or 'home'}-{size[0]}.png"))
                page.goto(base + route + "#creative-arcade")
                arcade_count = sum("creative-arcade" in game["categories"] for game in GAME_ENTRIES)
                expect(visible).to_have_count(arcade_count)
                expect(catalogue.locator('[data-game-category="creative-arcade"]')).to_have_attribute("aria-pressed", "true")
                page.reload()
                expect(visible).to_have_count(arcade_count)
                page.evaluate("location.hash='learning-games'")
                expect(visible).to_have_count(sum("learning" in game["categories"] for game in GAME_ENTRIES))
                expect(catalogue.locator('[data-game-category="learning"]')).to_have_attribute("aria-pressed", "true")
                return {"games": len(GAME_ENTRIES), "combinedFilters": True, "linkedCollections": True}

        for route in ["/play/"]:
            for size in [(1366, 768), (390, 844), (320, 740)]:
                record(f"catalogue-{route}-{size[0]}x{size[1]}", lambda r=route, s=size: catalogue_filters(r, s))

        def brand_home(size):
            with feature_page(size) as page:
                page.goto(base + "/")
                expect(page.locator(".home-hero h1")).to_be_visible()
                expect(page.locator(".home-provenance")).to_be_visible()
                expect(page.locator('[data-game-catalogue], input[type="search"]')).to_have_count(0)
                expect(page.locator("nav.nav .nav-play")).to_be_in_viewport()
                expect(page.locator('.home-arcade a[href="/Arcade/"]')).to_be_visible()
                expect(page.locator("iframe")).to_have_count(0)
                for game in ["clock-master", "math-tank"]:
                    expect(page.locator(f'.home-hero [data-home-game="{game}"]')).to_be_in_viewport()
                assert page.evaluate("""() => {
                    const games = document.querySelector('.home-learning');
                    const tools = document.querySelector('.home-tools');
                    const guides = document.querySelector('.home-guides');
                    const arcade = document.querySelector('.home-arcade');
                    return !!(games.compareDocumentPosition(tools) & Node.DOCUMENT_POSITION_FOLLOWING) &&
                      !!(tools.compareDocumentPosition(guides) & Node.DOCUMENT_POSITION_FOLLOWING) &&
                      !!(guides.compareDocumentPosition(arcade) & Node.DOCUMENT_POSITION_FOLLOWING);
                }"""), "Flagship games, learning tools and parent guides must precede recreational Arcade"
                expect(page.locator('.home-tools a[href="/tools/clock-lessons.html"]').first).to_be_visible()
                expect(page.locator('.home-tools a[href="/tools/multiplication-table.html"]').first).to_be_visible()
                expect(page.locator('.home-tools a[href="/learn/telling-time.html"]')).to_be_visible()
                for link in page.locator(".home-arcade-games > a, [data-home-game], .home-flag--space a, .home-tools a, .home-guides a").all():
                    response = page.request.get(base + link.get_attribute("href"))
                    assert response.status == 200, link.get_attribute("href")
                page.locator(".home-browse").click()
                expect(page).to_have_url(base + "/play/")
                expect(page.get_by_role("searchbox", name="Search games")).to_be_visible()
                expect(page.locator("[data-game-card]")).to_have_count(len(GAME_ENTRIES))
                page.locator('[data-game-category="creative-arcade"]').click()
                expect(page.locator("[data-game-card]:visible")).to_have_count(
                    sum("creative-arcade" in game["categories"] for game in GAME_ENTRIES))
                return {"distinctHomeAndPlay": True, "creativeArcadeFilter": True}

        for size in [(1366, 768), (390, 844), (320, 740)]:
            record(f"brand-home-{size[0]}x{size[1]}", lambda s=size: brand_home(s))

        def parent_learning_journey(size):
            with feature_page(size) as page:
                page.goto(base + "/")
                page.locator('.home-guides a[href="/blog/how-to-teach-a-child-to-tell-time.html"]').click()
                expect(page.get_by_role("heading", level=1)).to_be_visible()
                expect(page.locator("nav.nav [aria-current]")).to_have_attribute("href", "/blog/")
                page.locator('article a[href="/tools/clock-lessons.html"]').first.click()
                expect(page.locator("nav.nav [aria-current]")).to_have_attribute("href", "/tools/")
                expect(page.locator("#clockSvg")).to_be_visible()
                page.locator('.promo a[href="/play/clock-master.html"]').click()
                expect(page.locator("#launch-game")).to_be_visible()
                assert page.locator("#universe-frame").get_attribute("src") is None
                return {"parentArticleToLessonToGame": True, "deliberateLaunchPreserved": True}

        for size in [(1366, 768), (390, 844), (320, 740)]:
            record(f"parent-learning-journey-{size[0]}x{size[1]}", lambda s=size: parent_learning_journey(s))

        def clock_tool(slug, size):
            with feature_page(size, touch=True) as page:
                page.goto(base + f"/tools/{slug}.html")
                page.evaluate("document.fonts.ready")
                area = page.locator(".clock-area")
                if slug == "clock-lessons":
                    page.get_by_role("button", name="Quarter", exact=True).click()
                    expect(page.locator("#lessonInfo")).to_contain_text("Quarter")
                    page.locator(".opt-btn").first.click()
                    expect(page.locator("#fb")).to_contain_text(re.compile("Correct|It's"))
                else:
                    area.scroll_into_view_if_needed()
                    bounds = page.locator("#clockSvg").bounding_box()
                    assert bounds and abs(bounds["width"] - bounds["height"]) < 1, bounds
                    x, y, radius = bounds["x"] + bounds["width"] / 2, bounds["y"] + bounds["height"] / 2, bounds["width"] * .28
                    page.mouse.move(x, y - radius)
                    page.mouse.down()
                    page.mouse.move(x + radius, y, steps=8)
                    page.mouse.up()
                    expect(page.locator("#timeDisplay")).to_have_text("3:00" if slug == "hour-hand" else "3:15")
                    cdp = page.context.new_cdp_session(page)
                    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x + radius, "y": y}]})
                    cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x, "y": y + radius}]})
                    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
                    expect(page.locator("#timeDisplay")).to_have_text("6:00" if slug == "hour-hand" else "3:30")
                area.scroll_into_view_if_needed()
                fits = area.evaluate("""area => {
                    const style = getComputedStyle(area), box = area.getBoundingClientRect();
                    const left = box.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
                    const right = box.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
                    return [...area.children].every(child => {
                      const r = child.getBoundingClientRect();
                      return r.left >= left - 1 && r.right <= right + 1;
                    });
                }""")
                assert fits, "Clock and controls must fit their card's content area, not merely the viewport"
                page.screenshot(path=str(output / f"widget-{slug}-{size[0]}x{size[1]}.png"))
                return {"widgetFitsCard": True, "modeAndAnswer" if slug == "clock-lessons" else "mouseAndTouchDrag": True}

        for slug in ["hour-hand", "minute-hand", "clock-lessons"]:
            for size in ALL_PAGE_SIZES:
                record(f"clock-tool-{slug}-{size[0]}x{size[1]}", lambda t=slug, s=size: clock_tool(t, s))

        def intro_static(slug, size):
            with feature_page(size, "no-preference") as page:
                page.goto(base + f"/play/{slug}.html")
                page.evaluate("document.fonts.ready")
                preview = page.locator(".game-preview img")
                expect(preview).to_be_visible()
                before = preview.evaluate("e=>({transform:getComputedStyle(e).transform,width:e.width,height:e.height})")
                order = page.evaluate("""() => {
                    const player = document.querySelector('#game-player');
                    const practice = document.querySelector('#quick-start');
                    return !!(player.compareDocumentPosition(practice) & Node.DOCUMENT_POSITION_FOLLOWING);
                }""")
                assert order, "Optional practice must follow the player, not resemble a prerequisite"
                assert page.locator("#quick-start .game-lesson-number").count() == 0
                assert page.locator('script[src="/js/game-intros.js"], [data-scene-piece]').count() == 0
                page.evaluate("scrollTo({top:innerHeight*.55,behavior:'instant'})")
                after = preview.evaluate("e=>({transform:getComputedStyle(e).transform,width:e.width,height:e.height})")
                assert before == after, "Game previews must not shift or animate with scrolling"
                page.emulate_media(reduced_motion="reduce")
                assert preview.evaluate("e=>getComputedStyle(e).animationName") == "none"
                page.set_viewport_size({"width": 844, "height": 390})
                expect(preview).to_be_visible()
                page.evaluate("scrollTo({top:0,behavior:'instant'})")
                page.screenshot(path=str(output / f"intro-static-{slug}-{size[0]}-short-landscape.png"))
                assert page.locator("#universe-frame").get_attribute("src") is None, "Scroll must never start a game"
                return {"staticGameplayPreview": True, "practiceAfterPlayer": True, "noScrollAutoplay": True}

        for slug in ["clock-master", "math-tank"]:
            for size in [(1366, 768), (390, 844)]:
                record(f"intro-static-{slug}-{size[0]}x{size[1]}", lambda s=slug, v=size: intro_static(s, v))

        def launch_controls(slug, control):
            with feature_page() as page:
                navigations = []
                source = "/games/clockmaster/" if slug == "clock-master" else "/games/mathtank/"
                page.on("request", lambda request: navigations.append(request.url) if request.is_navigation_request() and request.url == base + source else None)
                page.goto(base + f"/play/{slug}.html")
                frame = page.locator("#universe-frame")
                assert frame.get_attribute("src") is None
                selectors = {
                    "hero": "#launch-game",
                    "practice": ".game-practice [data-launch-game]",
                    "placeholder": "#game-placeholder [data-launch-game]",
                    "dock": "[data-game-dock] [data-launch-game]"
                }
                dock = page.locator("[data-game-dock]")
                button = page.locator(selectors[control])
                if control == "dock":
                    expect(page.locator("#launch-game")).to_be_in_viewport(ratio=.8)
                    expect(dock).not_to_be_visible()
                    page.evaluate("scrollTo({top:document.body.scrollHeight,behavior:'instant'})")
                    assert page.locator("#launch-game, [data-launch-game]").evaluate_all("""elements =>
                        elements.filter(element => !element.closest('[data-game-dock]')).every(element => {
                            const rect = element.getBoundingClientRect();
                            return !rect.width || !rect.height || rect.bottom <= 0 || rect.top >= innerHeight;
                        })
                    """), "Other Play controls must be offscreen before expecting the dock"
                    expect(dock).to_be_visible()
                    assert frame.get_attribute("src") is None, "Scrolling must never start a game"
                else:
                    button.scroll_into_view_if_needed()
                    expect(dock).not_to_be_visible()
                button.click()
                expect(frame).to_have_attribute("src", source)
                game = page.frame_locator("#universe-frame")
                if slug == "clock-master":
                    expect(game.get_by_role("button", name="Learn the Clock", exact=True)).to_be_visible()
                else:
                    expect(game.get_by_role("button", name="Play Math Tank", exact=True)).to_be_visible()
                expect(dock).not_to_be_visible()
                origin = game.locator("body").evaluate("()=>performance.timeOrigin")
                page.evaluate("scrollTo({top:0,behavior:'instant'})")
                page.locator("#launch-game").click()
                assert game.locator("body").evaluate("()=>performance.timeOrigin") == origin, "Return to game must preserve the loaded instance"
                assert len(navigations) == 1, navigations
                for button in page.locator("#launch-game, [data-launch-game]").all():
                    expect(button).to_have_text("Return to game")
                return {"control": control, "loads": len(navigations), "instancePreserved": True}

        for slug in ["clock-master", "math-tank"]:
            for control in ["hero", "practice", "placeholder", "dock"]:
                record(f"launch-controls-{slug}-{control}", lambda s=slug, c=control: launch_controls(s, c))

        def game_journey(slug, name):
            context = browser.new_context(viewport={"width": 1366, "height": 768}, reduced_motion="reduce")
            context.add_init_script("""
                localStorage.setItem('clock_master_tutorial', '{"hasSeenHomeTutorial":true}');
                localStorage.setItem('clock_master_settings', '{"audioMuted":true}');
                localStorage.setItem('mathTank_settings', JSON.stringify({
                  soundEnabled:false, musicEnabled:false, voiceVolume:0, playerAge:6
                }));
            """)
            page = context.new_page()
            errors, external = [], []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("request", lambda r: external.append(r.url)
                    if not r.url.startswith((base + "/", "data:", "blob:")) else None)
            try:
                page.goto(base + "/")
                page.locator(f'[data-home-game="{slug}"]').click()
                expect(page).to_have_url(base + f"/play/{slug}.html")
                assert page.locator("#universe-frame").get_attribute("src") is None
                page.get_by_role("button", name=f"Play {name}", exact=True).click()
                game = page.frame_locator("#universe-frame")
                if slug == "clock-master":
                    game.get_by_role("button", name="Learn the Clock", exact=True).click()
                    expect(game.get_by_role("combobox", name="Choose lesson")).to_be_visible()
                else:
                    game.get_by_role("button", name="Play Math Tank", exact=True).click()
                    expect(game.get_by_test_id("math-tank-app")).to_have_attribute("data-screen", "home")
                    expect(game.get_by_role("button", name="Garage", exact=True)).to_be_visible()
                assert not errors, errors
                assert not external, external
                return {"game": name, "externalRequests": external}
            finally:
                context.close()

        for slug, name in [("clock-master", "Clock Master"), ("math-tank", "Math Tank")]:
            record(f"journey-{slug}", lambda s=slug, n=name: game_journey(s, n))

        def check_links():
            context = browser.new_context()
            statuses = []
            try:
                for route in sorted(links):
                    response = context.request.get(base + route)
                    statuses.append({"route": route, "status": response.status})
                (output / "internal-links.json").write_text(json.dumps(statuses, indent=2), encoding="utf-8")
                assert all(s["status"] == 200 for s in statuses), [s for s in statuses if s["status"] != 200]
                return {"checked": len(statuses)}
            finally:
                context.close()

        record("internal-links", check_links)
        if args.lab:
            record("lab-mobile-home", lambda: page_check("/", (390, 844), lab=True))
        browser.close()
    failures = [r for r in results if not r["passed"]]
    print(f"{len(results) - len(failures)}/{len(results)} checks passed")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(run())
