"""Prove generated lesson interactions against original questions on an existing preview.

Run: python scripts\\check-academy-lessons.py --base http://127.0.0.1:4198
     --output <session-files\\space-academy-lesson-ux>
Screenshots and an incremental JSON report must stay outside the repository.
No server, dependencies, game saves or question-bank fixtures are created.
"""

import argparse
import base64
import json
from pathlib import Path
import subprocess
import traceback
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parent.parent
MEASUREMENT = "/learn/olympiad/class-3/measurement.html"
GRAPHICS = "/learn/olympiad/class-3/reasoning.html"
ORIGINALS = """
import { CONTENT_VERSION, GRADES, LEVELS, chapterRoute, gameLink } from './js/space-academy/curriculum.mjs';
import { createMission } from './js/space-academy/questions.mjs';
import { choiceDescription } from './js/space-academy/question-display.mjs';
import { coachingHint } from './js/space-academy/coaching.mjs';
const example = (grade, chapter, level) => {
  const settings = { grade:grade.id, chapter:chapter.id, level,
    seed:`guide-${grade.id}-${chapter.id}${level === 1 ? '' : `-l${level}`}`, contentVersion:CONTENT_VERSION };
  const q = createMission(settings).questions[0];
  return { prompt:q.prompt, hint:coachingHint(q), explanation:q.explanation, correct:q.correctIndex,
    labels:q.options.map((_, index) => `Answer ${String.fromCharCode(65 + index)}. ${choiceDescription(q, index)}`),
    pictures:Boolean(q.optionVisuals), link:gameLink(settings) };
};
const rows = [{route:'/learn/olympiad/', examples:[]}];
for (const grade of GRADES) {
  const reasoning = grade.chapters.find(chapter => chapter.section === 'reasoning');
  rows.push({route:`/learn/olympiad/${grade.id}/`, examples:[example(grade, reasoning, 2)]});
  for (const chapter of grade.chapters)
    rows.push({route:chapterRoute(grade.id, chapter.id), examples:LEVELS.map(level => example(grade, chapter, level.id))});
}
console.log(JSON.stringify(rows));
"""
STORAGE_PROBE = """() => {
  window.__lessonStorageCalls = [];
  for (const method of ['getItem', 'setItem', 'removeItem', 'clear']) {
    const original = Storage.prototype[method];
    Storage.prototype[method] = function (...args) {
      window.__lessonStorageCalls.push({storage:'web',method,key:args[0]});
      return original.apply(this, args);
    };
  }
  const open = IDBFactory.prototype.open;
  IDBFactory.prototype.open = function (...args) {
    window.__lessonStorageCalls.push({storage:'indexedDB',method:'open',key:args[0]});
    return open.apply(this, args);
  };
}"""


def originals():
    result = subprocess.run(
        ["node", "--input-type=module", "-e", ORIGINALS], cwd=ROOT,
        check=True, capture_output=True, text=True, encoding="utf-8")
    return json.loads(result.stdout)


def geometry(page):
    result = page.evaluate("""() => {
      const main = document.querySelector('.academy-lessons');
      const bounds = node => {
        const r = node.getBoundingClientRect();
        return {left:r.left, right:r.right, width:r.width, height:r.height};
      };
      const visible = node => node.getClientRects().length && bounds(node).height > 0;
      const nodes = [...main.querySelectorAll(
        '.al-sample,.al-practice,.al-problem,.al-answers,.al-answer,.al-static-answer,.al-help,.growth-card,.al-notes-body'
      )].filter(visible);
      const controls = [...main.querySelectorAll('button,summary,.growth-button')].filter(visible);
      return {
        width:innerWidth, documentWidth:document.documentElement.scrollWidth,
        main:bounds(main), textSize:getComputedStyle(main).fontSize,
        outside:nodes.filter(node => bounds(node).left < -1 || bounds(node).right > innerWidth + 1)
          .map(node => ({class:node.className,...bounds(node)})),
        overflow:[...main.querySelectorAll('.al-answer,.sa-choice-label,.al-feedback,.al-problem h3')]
          .filter(node => visible(node) && node.scrollWidth > node.clientWidth + 2)
          .map(node => ({class:node.className,text:node.textContent.trim().slice(0,100),
            client:node.clientWidth,scroll:node.scrollWidth})),
        small:controls.filter(node => bounds(node).width < 44 || bounds(node).height < 44)
          .map(node => ({text:node.textContent.trim().slice(0,60),...bounds(node)})),
        broken:[...document.images].filter(image => image.complete && image.currentSrc && !image.naturalWidth)
          .map(image => image.currentSrc),
        pictures:[...main.querySelectorAll('.sa-v2-picture > svg')].filter(visible).map(node => ({
          description:node.getAttribute('aria-label'),...bounds(node)
        }))
      };
    }""")
    assert result["documentWidth"] <= result["width"] + 1, result
    assert not result["outside"], result
    assert not result["overflow"], result
    assert not result["small"], result
    assert not result["broken"], result
    assert all(picture["description"] and picture["width"] > 0 and picture["height"] > 0
               for picture in result["pictures"]), result
    return result


def open_lesson(page, base, row):
    response = page.goto(base + row["route"], wait_until="networkidle")
    assert response.status == 200, row["route"]
    expect(page.locator("[data-lesson-ready=true]")).to_have_count(len(row["examples"]))
    expect(page.locator("nav.nav")).to_have_count(1)
    expect(page.locator("footer.footer")).to_have_count(1)
    expect(page.locator("#main-content")).to_have_count(1)
    expect(page.locator(".al-parent-notes")).not_to_have_attribute("open", "")
    text = page.locator("main").inner_text()
    assert not any(copy in text for copy in
                   ["Original question code", "q2-", "q1-", "question-bank version",
                    "Question bank version", "full reproducible set"]), text
    for index, expected in enumerate(row["examples"]):
        card = page.locator("[data-lesson-sample]").nth(index)
        expect(card.locator("h3")).to_have_text(expected["prompt"])
        buttons = card.locator("[data-lesson-choice]")
        expect(buttons).to_have_count(len(expected["labels"]))
        assert card.get_attribute("data-correct-index") == str(expected["correct"])
        for choice, label in enumerate(expected["labels"]):
            expect(buttons.nth(choice)).to_have_attribute("aria-label", label)
        assert card.locator(".al-game-link").get_attribute("href") == expected["link"]
        if expected["pictures"]:
            expect(card.locator(".al-answers .sa-choice--picture")).to_have_count(len(expected["labels"]))
            assert card.locator(".al-answers svg").count() >= len(expected["labels"])
    return geometry(page)


def choose(card, expected, correct=True, keyboard=None):
    index = expected["correct"] if correct else (expected["correct"] + 1) % len(expected["labels"])
    button = card.locator("[data-lesson-choice]").nth(index)
    if keyboard:
        button.focus()
        button.press(keyboard)
    else:
        button.click()
    state = "correct" if correct else "incorrect"
    expect(card.locator("[data-lesson-response]")).to_have_attribute("data-state", state)
    expect(button).to_have_attribute("aria-pressed", "true")
    expect(button).to_have_attribute("data-result", state)
    expect(card.get_by_role("status")).to_contain_text("That’s right!" if correct else "Not quite.")
    details = card.locator("[data-lesson-method]" if correct else "[data-lesson-hint]")
    expect(details).to_have_attribute("open", "")
    expect(details.get_by_text(expected["explanation"] if correct else expected["hint"], exact=True)).to_be_visible()


def retry(card):
    card.get_by_role("button", name="Try again", exact=True).click()
    expect(card.get_by_role("status")).to_have_text("Ready for another go. Choose an answer.")
    assert card.locator('[aria-pressed="true"]').count() == 0
    assert card.locator("details[open]").count() == 0


def screenshot(page, output, name, card=None):
    if card is None:
        page.screenshot(path=str(output / name))
        return
    # Capture the real document crop without relocating fixed site navigation into a tall card.
    page.evaluate("scrollTo({top:0, behavior:'instant'})")
    box = card.bounding_box()
    session = page.context.new_cdp_session(page)
    try:
        image = session.send("Page.captureScreenshot", {
            "format": "png", "captureBeyondViewport": True,
            "clip": {"x": box["x"], "y": box["y"], "width": box["width"],
                     "height": box["height"], "scale": 1},
        })
        (output / name).write_bytes(base64.b64decode(image["data"]))
    finally:
        session.detach()


def run(args, report, save):
    rows = originals()
    by_route = {row["route"]: row for row in rows}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1366, "height": 768}, reduced_motion="reduce")
        context.add_init_script(STORAGE_PROBE)
        page = context.new_page()
        page.on("pageerror", lambda error: report["page_errors"].append(str(error)))
        page.on("console", lambda message: report["console_errors"].append(message.text)
                if message.type == "error" else None)
        page.on("response", lambda response: report["http_errors"].append(
            {"status": response.status, "url": response.url}) if response.status >= 400 else None)

        for row in rows:
            metrics = open_lesson(page, args.base, row)
            storage_before = page.evaluate("window.__lessonStorageCalls")
            if row["examples"]:
                choose(page.locator("[data-lesson-sample]").first, row["examples"][0])
            assert page.evaluate("window.__lessonStorageCalls") == storage_before
            report["routes"].append({"route": row["route"], "examples": len(row["examples"]),
                                     "geometry": metrics})
            save()

        row = by_route[MEASUREMENT]
        open_lesson(page, args.base, row)
        screenshot(page, args.output, "measurement-desktop.png")
        storage_before = page.evaluate("window.__lessonStorageCalls")
        cards = page.locator("[data-lesson-sample]")
        choose(cards.nth(0), row["examples"][0], correct=False, keyboard="Space")
        choose(cards.nth(1), row["examples"][1])
        choose(cards.nth(2), row["examples"][2], correct=False)
        screenshot(page, args.output, "independent-samples.png", page.locator(".sa-guide-samples"))
        retry(cards.nth(0))
        expect(cards.nth(1).locator("[data-lesson-response]")).to_have_attribute("data-state", "correct")
        expect(cards.nth(2).locator("[data-lesson-response]")).to_have_attribute("data-state", "incorrect")

        # Use native Tab and Enter, not a synthetic click, to select the real answer.
        first = cards.nth(0).locator("[data-lesson-choice]").first
        first.focus()
        for _ in range(row["examples"][0]["correct"]):
            page.keyboard.press("Tab")
        correct = cards.nth(0).locator("[data-lesson-choice]").nth(row["examples"][0]["correct"])
        expect(correct).to_be_focused()
        page.keyboard.press("Enter")
        expect(cards.nth(0).get_by_role("status")).to_contain_text("That’s right!")
        expect(cards.nth(0).locator("[data-lesson-method]")).to_have_attribute("open", "")
        choose(cards.nth(2), row["examples"][2])
        retry(cards.nth(1))
        for index in [0, 2]:
            expect(cards.nth(index).locator("[data-lesson-response]")).to_have_attribute("data-state", "correct")
        await_module = """async () => {
          const {enhanceLessonSamples} = await import('/js/academy-lessons.mjs');
          enhanceLessonSamples(document);
        }"""
        page.evaluate(await_module)
        expect(cards.nth(0).locator("[data-lesson-choice]")).to_have_count(4)
        expect(cards.nth(0).get_by_role("status")).to_contain_text("That’s right!")
        assert page.evaluate("window.__lessonStorageCalls") == storage_before
        databases = page.evaluate("async () => (await indexedDB.databases()).map(db => db.name)")
        assert "otterly-space-academy" not in databases, databases
        report["interaction"] = {"wrong": True, "correct": True, "retry": True,
                                 "native_tab_enter_space": True, "three_independent_samples": True,
                                 "idempotent_enhancement": True, "saved_game_accesses": 0}
        screenshot(page, args.output, "correct-method-desktop.png", cards.nth(0))
        save()

        for width, height in [(1366, 768), (390, 844), (844, 390)]:
            page.set_viewport_size({"width": width, "height": height})
            metrics = open_lesson(page, args.base, row)
            choose(page.locator("[data-lesson-sample]").first, row["examples"][0], correct=False)
            geometry(page)
            page.evaluate("scrollTo(0, 0)")
            screenshot(page, args.output, f"measurement-{width}x{height}.png")
            screenshot(page, args.output, f"answers-{width}x{height}.png",
                       page.locator("[data-lesson-sample]").first)
            report["layouts"].append({"route": MEASUREMENT, "viewport": [width, height],
                                      "text_percent": 100, "geometry": metrics})
            save()

        graphic_row = by_route[GRAPHICS]
        for width, height in [(1366, 768), (390, 844)]:
            page.set_viewport_size({"width": width, "height": height})
            metrics = open_lesson(page, args.base, graphic_row)
            graphic_card = page.locator("[data-lesson-sample]").nth(1)
            choose(graphic_card, graphic_row["examples"][1], correct=False)
            retry(graphic_card)
            choose(graphic_card, graphic_row["examples"][1], keyboard="Enter")
            geometry(page)
            screenshot(page, args.output, f"graphic-choices-{width}x{height}.png", graphic_card)
            report["layouts"].append({"route": GRAPHICS, "viewport": [width, height],
                                      "text_percent": 100, "geometry": metrics})
            save()

        for width, height in [(1366, 768), (390, 844)]:
            page.set_viewport_size({"width": width, "height": height})
            open_lesson(page, args.base, row)
            page.add_style_tag(content="html { font-size:200% !important; }")
            choose(page.locator("[data-lesson-sample]").first, row["examples"][0])
            metrics = geometry(page)
            screenshot(page, args.output, f"text-200-{width}x{height}.png",
                       page.locator("[data-lesson-sample]").first)
            report["layouts"].append({"route": MEASUREMENT, "viewport": [width, height],
                                      "text_percent": 200, "geometry": metrics})
            save()

        nojs = browser.new_context(java_script_enabled=False, viewport={"width": 390, "height": 844})
        fallback = nojs.new_page()
        for route in [MEASUREMENT, GRAPHICS, "/learn/olympiad/class-3/"]:
            response = fallback.goto(args.base + route, wait_until="networkidle")
            assert response.status == 200
            expected_row = by_route[route]
            expect(fallback.locator("[data-lesson-ready]")).to_have_count(0)
            expect(fallback.locator("[data-lesson-choice]")).to_have_count(0)
            expect(fallback.locator(".al-noscript")).to_be_visible()
            for index, expected in enumerate(expected_row["examples"]):
                card = fallback.locator("[data-lesson-sample]").nth(index)
                expect(card.locator("[data-lesson-option]")).to_have_count(len(expected["labels"]))
                expect(card.locator("[data-lesson-response]")).to_be_hidden()
                card.locator("[data-lesson-hint] > summary").click()
                expect(card.get_by_text(expected["hint"], exact=True)).to_be_visible()
                card.locator("[data-lesson-method] > summary").click()
                expect(card.get_by_text(expected["explanation"], exact=True)).to_be_visible()
            geometry(fallback)
            report["no_javascript"].append(route)
        fallback.goto(args.base + GRAPHICS, wait_until="networkidle")
        screenshot(fallback, args.output, "no-javascript-graphic-choices.png",
                   fallback.locator("[data-lesson-sample]").nth(1))
        fallback.locator(".al-parent-notes > summary").click()
        expect(fallback.locator(".al-parent-notes")).to_have_attribute("open", "")
        nojs.close()
        save()

        page.set_viewport_size({"width": 1366, "height": 768})
        open_lesson(page, args.base, row)
        expected_link = row["examples"][0]["link"]
        page.locator(".al-game-link").first.click()
        page.wait_for_load_state("networkidle")
        assert urlparse(page.url).path == "/play/space-academy.html", page.url
        assert parse_qs(urlparse(page.url).query) == parse_qs(urlparse(expected_link).query), page.url
        expect(page.locator("#academy")).to_have_attribute("data-screen", "welcome")
        report["game_link"] = {"settings_preserved": True, "deliberate_play_required": True,
                               "url": page.url}
        assert not report["page_errors"], report["page_errors"]
        assert not report["console_errors"], report["console_errors"]
        assert not report["http_errors"], report["http_errors"]
        context.close()
        browser.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="http://127.0.0.1:4198")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    args.base = args.base.rstrip("/")
    args.output = args.output.resolve()
    if args.output.is_relative_to(ROOT):
        parser.error("Use the session files directory outside the repository for browser evidence.")
    args.output.mkdir(parents=True, exist_ok=True)
    report = {"routes": [], "layouts": [], "no_javascript": [], "page_errors": [],
              "console_errors": [], "http_errors": [], "passed": False}

    def save():
        (args.output / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    try:
        run(args, report, save)
        report["passed"] = True
        print(f"PASS: {len(report['routes'])} routes, "
              f"{sum(row['examples'] for row in report['routes'])} examples, "
              f"{len(report['layouts'])} layout checks; wrong/correct/retry, keyboard, "
              "independence, original graphic choices, no-JS and deliberate game link.")
        return 0
    except Exception:
        report["failure"] = traceback.format_exc()
        print(report["failure"])
        return 1
    finally:
        save()


if __name__ == "__main__":
    raise SystemExit(main())
