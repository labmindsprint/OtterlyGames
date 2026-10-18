"""Check the new learning pages and local worksheet UI against a static preview."""
import argparse
import json
import math
import re
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlsplit

import fitz
from playwright.sync_api import expect, sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--url", default="http://127.0.0.1:4196")
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--only-fresh-seed-failure", action="store_true",
                    help="Run only the random-seed failure regression, without the responsive matrix.")
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)

ROUTES = [
    "/learn/",
    "/learn/telling-time.html",
    "/learn/times-tables.html",
    "/learn/division.html",
    "/learn/spelling.html",
    "/parents/",
    "/tools/worksheet-builder.html",
]
BUILDER = "/tools/worksheet-builder.html"
VIEWPORTS = [(1366, 768), (1440, 900), (1920, 1080), (1280, 600),
             (800, 1000), (390, 844), (844, 390)]
report = {"responsive": [], "pdf": [], "checks": [], "errors": [], "missing": [], "external": []}


def observe(context):
    context.on("page", lambda page: page.on("pageerror", lambda error: report["errors"].append(str(error))))
    context.on("response", lambda response: report["missing"].append(
        {"url": response.url, "status": response.status}) if response.status >= 400 else None)
    context.on("request", lambda request: report["external"].append(request.url)
               if not request.url.startswith(args.url + "/") else None)


def open_sheet(page, query=""):
    response = page.goto(args.url + BUILDER + query, wait_until="networkidle")
    assert response.status == 200
    expect(page.get_by_role("button", name="Print worksheet", exact=True)).to_be_enabled()
    expect(page.locator("#worksheet")).to_be_visible()


def check_arithmetic(page, division=False):
    prompts = page.locator(".worksheet-equation").all_text_contents()
    answers = page.locator("#answer-key-list li").all_text_contents()
    assert len(prompts) == len(answers)
    assert len(set(prompts)) == len(prompts)
    for prompt, answer in zip(prompts, answers):
        left, right = map(int, re.findall(r"\d+", prompt))
        result = int(re.findall(r"\d+", answer)[-1])
        assert result == (left // right if division else left * right)
        if division:
            assert right > 0 and left % right == 0 and result > 0
    return prompts


def check_fresh_seed_failure(browser):
    context = browser.new_context(viewport={"width": 1366, "height": 768})
    observe(context)
    page = context.new_page()
    open_sheet(page, "?activity=clock&clock=hours&count=5&seed=crypto-failure")
    page.get_by_label("Show and print the answer key on a separate page", exact=True).check()
    page.evaluate("""() => {
      window.__randomAttempts = 0;
      Object.defineProperty(window.crypto, 'getRandomValues', {
        configurable: true,
        value: () => { window.__randomAttempts += 1; throw new Error('Random source unavailable'); }
      });
      window.__printCalls = 0;
      window.print = () => { window.__printCalls += 1; };
    }""")

    def sheet_state():
        return page.evaluate("""() => ({
          questions: document.getElementById('worksheet-questions').innerHTML,
          answers: document.getElementById('answer-key-list').innerHTML,
          title: document.getElementById('worksheet-title').textContent,
          code: document.getElementById('worksheet-code').textContent,
          seed: document.getElementById('sheet-seed').value,
          url: location.href,
          shareLink: document.getElementById('share-link').value,
          printDisabled: document.getElementById('print-worksheet').disabled,
          copyDisabled: document.getElementById('copy-sheet-link').disabled,
          includeKey: document.getElementById('include-answer-key').checked,
          keyHidden: document.getElementById('answer-key').hidden
        })""")

    ready_state = sheet_state()
    page.get_by_role("button", name="Generate fresh sheet", exact=True).click()
    expect(page.locator("#builder-feedback")).to_contain_text("A fresh sheet could not be generated")
    expect(page.locator("#builder-feedback")).to_contain_text("Edit the Sheet seed and choose Build this sheet")
    expect(page.locator("#builder-feedback")).not_to_contain_text("unique questions ready")
    assert page.evaluate("window.__randomAttempts") == 1
    assert sheet_state() == ready_state
    expect(page.get_by_role("button", name="Print worksheet", exact=True)).to_be_enabled()
    page.get_by_role("button", name="Print worksheet", exact=True).click()
    assert page.evaluate("window.__printCalls") == 1
    assert sheet_state() == ready_state
    page.locator("#builder-feedback").scroll_into_view_if_needed()
    page.screenshot(path=str(args.output / "fresh-seed-failure-preserved.png"))

    page.get_by_label("Sheet seed", exact=True).fill("manual-recovery")
    dirty_state = sheet_state()
    expect(page.get_by_role("button", name="Print worksheet", exact=True)).to_be_disabled()
    page.get_by_role("button", name="Generate fresh sheet", exact=True).click()
    expect(page.locator("#builder-feedback")).to_contain_text("existing sheet has not changed")
    assert page.evaluate("window.__randomAttempts") == 2
    assert sheet_state() == dirty_state
    expect(page.get_by_role("button", name="Print worksheet", exact=True)).to_be_disabled()
    page.get_by_role("button", name="Build this sheet", exact=True).click()
    expect(page.locator("#builder-feedback")).to_contain_text("5 unique questions ready")
    expect(page.get_by_role("button", name="Print worksheet", exact=True)).to_be_enabled()
    expect(page.get_by_label("Sheet seed", exact=True)).to_have_value("manual-recovery")
    assert parse_qs(urlsplit(page.url).query)["seed"] == ["manual-recovery"]
    assert page.evaluate("window.__randomAttempts") == 2
    context.close()
    report["checks"].append("Thrown getRandomValues explicitly reported; existing questions, answers, seed, URL and ready/dirty print/share states preserved; manual seed Build recovers without randomness")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    try:
        assert playwright.request.new_context().get(args.url + BUILDER).status == 200
        if args.only_fresh_seed_failure:
            check_fresh_seed_failure(browser)
            assert not report["errors"], report["errors"]
            assert not report["missing"], report["missing"]
            assert not report["external"], report["external"]
            report["passed"] = True
            print(json.dumps({"passed": True, "checks": report["checks"]}, indent=2))
            raise SystemExit(0)
        for width, height in VIEWPORTS:
            context = browser.new_context(viewport={"width": width, "height": height})
            observe(context)
            page = context.new_page()
            page.set_default_timeout(12000)
            for route in ROUTES:
                response = page.goto(args.url + route, wait_until="networkidle")
                assert response.status == 200, route
                expect(page.locator("main#main-content.growth-main")).to_be_visible()
                expect(page.locator("main h1")).to_have_count(1)
                assert page.locator('meta[name="description"]').get_attribute("content")
                canonical = "https://otterlygames.com" + route
                expect(page.locator('link[rel="canonical"]')).to_have_attribute("href", canonical)
                expect(page.locator('meta[property="og:url"]')).to_have_attribute("content", canonical)
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (route, width)
                assert page.locator('script[src*="ko-fi"],script[src*="adsbygoogle"],script[src*="gtag"]').count() == 0
                report["responsive"].append({"route": route, "width": width, "height": height})
                if (width, height) in [(1366, 768), (390, 844)]:
                    name = "learn" if route == "/learn/" else "parents" if route == "/parents/" else Path(route).stem
                    page.screenshot(path=str(args.output / f"{name}-{width}.png"), full_page=True)
            context.close()
        report["checks"].append("49 route/viewport cases: geometry, headings, canonical/OG metadata and SDK absence")

        context = browser.new_context(viewport={"width": 1366, "height": 768})
        observe(context)
        page = context.new_page()
        page.set_default_timeout(12000)
        open_sheet(page)
        original = check_arithmetic(page)
        expect(page.locator("#answer-key")).to_be_hidden()
        page.get_by_label("Sheet seed", exact=True).focus()
        page.keyboard.press("Tab")
        expect(page.get_by_role("button", name="Build this sheet", exact=True)).to_be_focused()
        page.get_by_label("Activity", exact=True).select_option("division")
        expect(page.get_by_role("button", name="Print worksheet", exact=True)).to_be_disabled()
        expect(page.get_by_label("Divide by", exact=True)).to_be_visible()
        page.get_by_label("Divide by", exact=True).select_option("9")
        page.get_by_label("Sheet seed", exact=True).fill("division-ui")
        page.get_by_label("Sheet seed", exact=True).press("Enter")
        division_prompts = check_arithmetic(page, division=True)
        assert division_prompts != original
        shared_url = page.url
        page.get_by_label("Show and print the answer key on a separate page", exact=True).focus()
        page.keyboard.press("Space")
        expect(page.locator("#answer-key")).to_be_visible()
        page.goto(shared_url, wait_until="networkidle")
        expect(page.locator("#answer-key")).to_be_hidden()
        assert check_arithmetic(page, division=True) == division_prompts
        before_seed = page.get_by_label("Sheet seed", exact=True).input_value()
        page.get_by_role("button", name="Generate fresh sheet", exact=True).click()
        after_seed = page.get_by_label("Sheet seed", exact=True).input_value()
        assert after_seed != before_seed
        assert parse_qs(urlsplit(page.url).query)["seed"] == [after_seed]
        page.get_by_label("Sheet seed", exact=True).fill("bad seed")
        page.get_by_role("button", name="Build this sheet", exact=True).click()
        expect(page.locator("#builder-feedback")).to_contain_text("default seed")
        expect(page.get_by_label("Sheet seed", exact=True)).to_have_value("otterly-1")
        report["checks"].append("Keyboard build/toggle, dirty-state guard, correct exact division, seed regeneration and share reproduction")

        open_sheet(page, "?activity=clock&activity=division&clock=hours&count=20&table=0&seed=%3Cbad%3E&child=not-kept#removed")
        expect(page.locator("#builder-feedback")).to_contain_text("12 different")
        expect(page.locator("#builder-feedback")).to_contain_text("Repeated link")
        expect(page.locator("#builder-feedback")).to_contain_text("Unrecognised link")
        expect(page.get_by_label("Activity", exact=True)).to_have_value("clock")
        expect(page.get_by_label("Question count", exact=True)).to_have_value("12")
        assert set(parse_qs(urlsplit(page.url).query)) == {"activity", "clock", "count", "seed"}
        assert not urlsplit(page.url).fragment
        assert page.locator(".worksheet-clock").count() == 12
        assert len(set(page.locator("#answer-key-list li").all_text_contents())) == 12
        page.screenshot(path=str(args.output / "invalid-link-corrected.png"), full_page=True)
        report["checks"].append("Invalid/duplicate/irrelevant URL settings visibly corrected; unknown fields and fragments removed; whole-hour count capped")

        open_sheet(page, "?activity=clock&clock=five-minutes&count=20&seed=clock-geometry")
        answers = page.locator("#answer-key-list li").all_text_contents()
        geometry = page.locator(".worksheet-clock").evaluate_all("""clocks => clocks.map(clock => {
          const hand = name => {
            const line = clock.querySelector('.clock-' + name + '-hand');
            return {x: Number(line.getAttribute('x2')), y: Number(line.getAttribute('y2'))};
          };
          return {hour: hand('hour'), minute: hand('minute'), description: clock.querySelector('desc').textContent};
        })""")
        assert len(answers) == 20 and len(set(answers)) == 20
        for answer, clock in zip(answers, geometry):
            hour, minute = map(int, answer.split(":"))
            for name, angle, length in [
                ("hour", (hour % 12) * 30 + minute * .5, 45),
                ("minute", minute * 6, 62),
            ]:
                assert abs(clock[name]["x"] - (100 + math.sin(math.radians(angle)) * length)) <= .001
                assert abs(clock[name]["y"] - (100 - math.cos(math.radians(angle)) * length)) <= .001
            assert "hour hand" in clock["description"] and "minute hand" in clock["description"]
        page.locator("#worksheet").scroll_into_view_if_needed()
        page.screenshot(path=str(args.output / "twenty-clocks-screen.png"), full_page=True)
        report["checks"].append("Twenty unique clock answers match independently calculated fractional-hour SVG geometry and accessible hand descriptions")

        for include_answers in [False, True]:
            page.get_by_label("Show and print the answer key on a separate page", exact=True).set_checked(include_answers)
            page.emulate_media(media="print")
            assert page.locator(".worksheet-controls").is_hidden()
            assert page.locator(".nav").is_hidden()
            assert page.locator("#worksheet").is_visible()
            assert page.locator("#answer-key").is_visible() == include_answers
            for paper in ["A4", "Letter"]:
                path = args.output / f"twenty-clocks-{paper}-{'key' if include_answers else 'questions'}.pdf"
                page.pdf(path=str(path), format=paper, print_background=False)
                with fitz.open(path) as pdf:
                    assert len(pdf) == (2 if include_answers else 1), (paper, include_answers, len(pdf))
                    text = "\n".join(sheet.get_text() for sheet in pdf)
                    assert "Read the clock: five-minute steps" in text
                    assert ("Answer key" in text) == include_answers
                    assert "Make a sheet that fits" not in text
                    assert "Copy sheet link" not in text
                    assert "20." in text
                    if include_answers:
                        key_page = next(index for index, sheet in enumerate(pdf) if "Answer key" in sheet.get_text())
                        assert key_page >= 1
                        assert all(answer in text for answer in answers)
                        pdf[key_page].get_pixmap(matrix=fitz.Matrix(1.5, 1.5)).save(
                            args.output / f"print-{paper}-answer-key.png")
                    for number, sheet in enumerate(pdf):
                        for block in sheet.get_text("blocks"):
                            assert block[0] >= 0 and block[1] >= 0
                            assert block[2] <= sheet.rect.width + 1 and block[3] <= sheet.rect.height + 1
                        if number == 0:
                            sheet.get_pixmap(matrix=fitz.Matrix(1.5, 1.5)).save(
                                args.output / f"print-{paper}-{'key' if include_answers else 'questions'}.png")
                    report["pdf"].append({"paper": paper, "answer_key": include_answers, "pages": len(pdf)})
            page.emulate_media(media="screen")
        report["checks"].append("Chromium print emulation and A4/Letter PDFs: no controls/navigation, optional answer key starts a separate page")

        open_sheet(page)
        page.evaluate("""() => { window.__copied = '';
          Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {
            writeText: async text => { window.__copied = text; }
          }});
        }""")
        page.get_by_role("button", name="Copy sheet link", exact=True).click()
        expect(page.locator("#copy-feedback")).to_contain_text("link copied")
        assert page.evaluate("window.__copied") == page.url
        page.evaluate("""() => {
          Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {
            writeText: async () => { throw new Error('Permission denied'); }
          }});
        }""")
        page.get_by_role("button", name="Copy sheet link", exact=True).click()
        expect(page.locator("#copy-feedback")).to_contain_text("could not be copied")
        expect(page.get_by_label("Copyable sheet link", exact=True)).to_be_visible()
        expect(page.get_by_label("Copyable sheet link", exact=True)).to_have_value(page.url)
        expect(page.get_by_label("Copyable sheet link", exact=True)).to_be_focused()
        page.screenshot(path=str(args.output / "clipboard-fallback.png"), full_page=True)
        page.evaluate("() => { window.__printCalls = 0; window.print = () => { window.__printCalls += 1; }; }")
        page.get_by_role("button", name="Print worksheet", exact=True).click()
        assert page.evaluate("window.__printCalls") == 1
        assert page.evaluate("localStorage.length") == 0
        report["checks"].append("Explicit print gesture, clipboard success and denied-permission fallback, no local-storage writes")

        links = set()
        titles = set()
        descriptions = set()
        for route in ROUTES:
            page.goto(args.url + route, wait_until="networkidle")
            titles.add(page.title())
            descriptions.add(page.locator('meta[name="description"]').get_attribute("content"))
            for href in page.locator("main a[href]").evaluate_all("links => links.map(link => link.getAttribute('href'))"):
                if href.startswith("/"):
                    links.add(urljoin(args.url, href))
        assert len(titles) == len(ROUTES)
        assert len(descriptions) == len(ROUTES)
        for link in sorted(links):
            assert page.request.get(link).status == 200, link
        report["checks"].append(f"{len(links)} distinct local main-content links return HTTP 200; seven unique page titles and descriptions")
        context.close()

        context = browser.new_context(viewport={"width": 390, "height": 844})
        observe(context)
        context.add_init_script("""
          for (const operation of ['getItem', 'setItem', 'removeItem']) {
            Storage.prototype[operation] = () => { throw new Error('Storage denied'); };
          }
        """)
        page = context.new_page()
        open_sheet(page, "?activity=clock&clock=hours&count=5&seed=phone")
        assert page.evaluate("() => { try { localStorage.getItem('probe'); return false; } catch { return true; } }")
        assert page.locator(".worksheet-clock").count() == 5
        page.get_by_label("Activity", exact=True).select_option("multiplication")
        page.get_by_label("Times table", exact=True).select_option("12")
        page.get_by_label("Sheet seed", exact=True).fill("phone-maths")
        page.get_by_role("button", name="Build this sheet", exact=True).click()
        assert len(check_arithmetic(page)) == 5
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.locator("#worksheet-settings").scroll_into_view_if_needed()
        page.screenshot(path=str(args.output / "mobile-controls-390.png"))
        page.locator("#worksheet").scroll_into_view_if_needed()
        page.screenshot(path=str(args.output / "mobile-paper-390.png"))
        page.get_by_label("Show and print the answer key on a separate page", exact=True).check()
        expect(page.locator("#answer-key")).to_be_visible()
        page.emulate_media(media="print")
        path = args.output / "multiplication-five-Letter-key.pdf"
        page.pdf(path=str(path), format="Letter", print_background=False)
        with fitz.open(path) as pdf:
            assert len(pdf) == 2
            assert "Answer key" not in pdf[0].get_text()
            assert "Answer key" in pdf[1].get_text()
            assert "Multiplication: 12 times table" in pdf[0].get_text()
        context.close()
        report["checks"].append("390px activity/build/answer-key flow works with browser storage denied; multiplication PDF separates questions from answers")

        context = browser.new_context(java_script_enabled=False, viewport={"width": 390, "height": 844})
        page = context.new_page()
        page.goto(args.url + BUILDER, wait_until="networkidle")
        expect(page.get_by_role("heading", name="JavaScript is needed to build a sheet")).to_be_visible()
        expect(page.locator("#worksheet")).to_be_hidden()
        expect(page.get_by_role("button", name="Build this sheet", exact=True)).to_be_disabled()
        page.screenshot(path=str(args.output / "no-javascript-390.png"), full_page=True)
        context.close()
        report["checks"].append("No-JavaScript fallback does not pretend a worksheet exists")
        check_fresh_seed_failure(browser)
        assert not report["errors"], report["errors"]
        assert not report["missing"], report["missing"]
        assert not report["external"], report["external"]
        report["passed"] = True
    finally:
        browser.close()
        report_name = "seed-failure-report.json" if args.only_fresh_seed_failure else "report.json"
        (args.output / report_name).write_text(json.dumps(report, indent=2), encoding="utf-8")

print(json.dumps({"passed": report.get("passed", False), "checks": report["checks"], "pdf": report["pdf"]}, indent=2))
