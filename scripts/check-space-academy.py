"""Exercise Space Academy's seven real campaigns, retained saves and browser failure paths.

Every run uses isolated browser contexts. Golden backups are read unchanged;
late-layout fixtures use the frozen pre-campaign reducer. New campaign fixtures
complete real question missions and apply independent puzzle solutions through
the production reducer. The seven board flows themselves use visible controls,
including reload, undo/reset, system gates and actual flights.
"""

import argparse
from collections import deque
import json
from itertools import permutations, product
import re
import traceback
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import urlencode

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parent.parent
GAME = "/play/space-academy.html"
SIZES = [(1366, 768), (1440, 900), (1920, 1080), (1280, 600),
         (800, 1000), (390, 844), (844, 390)]
PART_IDS = ["engine", "body", "cockpit", "nose", "left-fin", "right-fin"]
# The launch sequence is 8.5 s of active time (reduced motion 0.45 s), then the discovery art loads.
FLIGHT_WAIT = 20000
READ_SAVE = """async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('otterly-space-academy', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction('academy', 'readonly');
      const request = transaction.objectStore('academy').get('save');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}"""
FAULTS = """() => {
  window.__academyFault = null;
  for (const method of ['get', 'put', 'delete']) {
    const original = IDBObjectStore.prototype[method];
    IDBObjectStore.prototype[method] = function (...args) {
      const key = method === 'put' ? args[1] : args[0];
      if (this.name === 'academy' && window.__academyFault?.method === method &&
          window.__academyFault.key === key) {
        throw new DOMException('Injected ' + method + ' failure for ' + key, 'QuotaExceededError');
      }
      return original.apply(this, args);
    };
  }
}"""


def journey(save):
    explorer = save["explorers"][save["activeExplorer"]]
    return explorer["journeys"].get(explorer["grade"], {})


def read_save(page):
    return page.evaluate(READ_SAVE)


def section(page, name):
    view = {"Missions": "missions", "Craft lab": "workshop",
            "Expedition": "map", "Passport": "passport", "My progress": "progress"}[name]
    academy = page.locator("#academy")
    if academy.get_attribute("data-screen") == "mission":
        # Questions and flights have no journey ribbon; leave through their own button first.
        page.get_by_role("button", name="Pause game", exact=True).click()
    elif page.locator("[data-flight]").count():
        if view == "map":
            expect(academy).to_have_attribute("data-screen", "map")
            return
        page.get_by_role("button", name="Save flight & take a break", exact=True).click()
    tab = page.locator(f'nav.sa-ribbon button[data-action="view"][data-view="{view}"]')
    expect(tab).to_have_count(1)
    assert (tab.get_attribute("aria-label") or tab.inner_text()).strip()
    tab.click()
    expect(academy).to_have_attribute("data-screen", view)
    if view == "passport":
        passport_contract(page)


def visible_chapter_shelf(page):
    expect(page.locator("#academy")).not_to_have_attribute("aria-busy", "true")
    home = page.locator("section.sa-launchpad")
    expect(home).to_be_visible()
    for selector in ["div.sa-hangar-scene", ".sa-hero-craft", ".sa-hangar-caption"]:
        expect(home.locator(selector)).to_be_visible()
    guide = page.locator("#academy .sa-dock .sa-guide .sa-guide-go")
    expect(guide).to_have_count(1)
    expect(guide).to_be_visible()
    expect(guide).to_be_enabled()
    shelf = page.locator("section.sa-chapter-section")
    expect(shelf).to_be_visible()
    expect(shelf.locator("h3#sa-chapters-title")).to_be_visible()
    assert not shelf.locator("xpath=ancestor-or-self::details").count()
    nodes = shelf.locator(":scope > ul.sa-strip")
    expect(nodes).to_be_visible()
    assert not nodes.locator("xpath=ancestor::details").count()
    controls = nodes.get_by_role("button")
    assert controls.count()
    for control in controls.all():
        expect(control).to_be_visible()
        expect(control).to_be_enabled()
    expect(shelf.locator(":scope > details.sa-more > summary")).to_be_visible()
    return shelf


def passport_contract(page):
    passport = page.locator("section.sa-passport")
    expect(passport).to_be_visible()
    regions = passport.locator("article.sa-passport-region")
    expect(regions).to_have_count(7)
    headers = regions.locator('button.sa-region-open[data-action="campaign-grade"][data-grade]')
    expect(headers).to_have_count(7)
    assert len(set(headers.evaluate_all("nodes => nodes.map(node => node.dataset.grade)"))) == 7
    tiles = passport.locator("button.sa-world-tile")
    expect(tiles).to_have_count(30)
    collected = passport.locator("button.sa-world-tile.is-discovered").count()
    expect(passport.locator(".sa-passport-ring b")).to_have_text(str(collected))
    expect(passport.locator(".sa-passport-ring")).to_have_text(
        re.compile(rf"\s*{collected}\s*/\s*30\s*"))
    for tile in tiles.all():
        if "is-discovered" in tile.get_attribute("class").split():
            expect(tile).to_be_enabled()
            expect(tile.locator("img")).to_have_count(1)
        else:
            expect(tile).to_be_disabled()
            expect(tile.locator("img")).to_have_count(0)
            assert tile.get_attribute("aria-label").startswith("Undiscovered signal")
    all_found = passport.get_by_text("All 30 discoveries are yours!", exact=True)
    if collected == 30:
        expect(all_found).to_be_visible()
    else:
        expect(all_found).to_have_count(0)


def reveal_details(control):
    expect(control.page.locator("#academy")).not_to_have_attribute("aria-busy", "true")
    control.wait_for(state="attached")
    while control.locator("xpath=ancestor-or-self::details[not(@open)][last()]").count():
        details = control.locator("xpath=ancestor-or-self::details[not(@open)][last()]")
        node = details.element_handle()
        try:
            details.locator(":scope > summary").click()
            assert node.get_attribute("open") == ""
        finally:
            node.dispose()
    return control


def select_part(page, part):
    return page.locator(f'[data-action="select-part"][data-part="{part}"]')


def part_slot(page, part):
    return page.locator(f'.sa-assembly [data-slot="{part}"]')


def launch_blocked(page):
    # Not ready: the old disabled Launch button is gone; the guide shows the one button that fixes what is missing.
    expect(page.locator('[data-action="launch"]')).to_have_count(0)
    guide = page.locator("#academy .sa-dock .sa-guide .sa-guide-go")
    expect(guide).to_have_count(1)
    expect(guide).to_be_visible()
    expect(guide).to_be_enabled()
    expect(page.locator("#academy .sa-dock .sa-guide-say")).not_to_be_empty()


def assert_legacy_preserved(migrated, original):
    assert migrated["version"] == 2
    assert migrated["activeExplorer"] == original["activeExplorer"]
    for explorer_id, explorer in original["explorers"].items():
        actual = migrated["explorers"][explorer_id]
        assert actual["grade"] == explorer["grade"] and actual["level"] == explorer["level"]
        assert set(actual["journeys"]) == set(explorer["journeys"])
        for grade, saved in explorer["journeys"].items():
            current = actual["journeys"][grade]
            assert {key: current[key] for key in saved} == saved, (explorer_id, grade)
            expedition = current["expedition"]
            assert expedition["legacyCompleted"] == saved["completed"]
            assert expedition["legacyParts"] == saved["earned"]
            assert expedition["visits"] == [] and expedition["paid"] == []
            assert expedition["activity"] is None


def enter_game(page):
    opener = page.locator('#academy button[data-action="open"]')
    expect(opener).to_have_count(1)
    expect(opener).to_be_visible()
    assert (opener.get_attribute("aria-label") or opener.inner_text()).strip()
    opener.click()


def open_game(page, base, query=""):
    response = page.goto(base + GAME + query, wait_until="networkidle")
    assert response.status == 200
    expect(page.locator("#academy")).to_have_attribute("data-screen", "welcome")
    geometry(page)
    enter_game(page)
    expect(page.locator("#academy")).not_to_have_attribute("data-screen", "welcome")


def start(page, name):
    control = page.locator('[data-action="start-linked"]') if name == "Start linked set" else page.get_by_role(
        "button", name=name, exact=True, include_hidden=True)
    reveal_details(control).click()
    if page.get_by_role("dialog").count():
        page.get_by_role("button", name="Replace unfinished set", exact=True).click()
    expect(page.locator("#academy")).to_have_attribute("data-screen", "mission")


def answer_current(page, correct=True, hint=False):
    active = journey(read_save(page))["active"]
    index = active["index"]
    question = active["mission"]["questions"][index]
    if hint:
        page.get_by_role("button", name="Give me a hint", exact=True).click()
        expect(page.locator(".sa-hint")).to_be_visible()
    choice = question["correctIndex"] if correct else (question["correctIndex"] + 1) % len(question["options"])
    control = page.get_by_role("group", name="Answer choices", exact=True).get_by_role("button").nth(choice)
    assert control.get_attribute("data-choice") == str(choice)
    assert control.get_attribute("aria-label")
    control.click()
    expect(page.locator(".sa-feedback")).to_be_visible()
    next_action = "complete" if index == len(active["answers"]) - 1 else "next"
    advance = page.locator(f'.sa-feedback [data-action="{next_action}"]')
    expect(advance).to_be_focused()
    if hint:
        before_share = read_save(page)
        assert mission_link(page) == page.url
        assert read_save(page) == before_share
    if correct:
        expect(page.locator(".sa-answer-method")).not_to_have_attribute("open", "")
    else:
        expect(page.locator(".sa-answer-method")).to_have_attribute("open", "")
    reveal_details(page.locator(".sa-answer-method"))
    assert question["explanation"] in page.locator(".sa-feedback").inner_text()
    if index == len(active["answers"]) - 1:
        advance.click()
        expect(page.locator("#academy")).to_have_attribute("data-screen", "result")
    else:
        advance.click()
        expect(page.locator(".sa-question-progress")).to_contain_text(
            re.compile(rf"Question {index + 2}\s*/\s*{len(active['answers'])}"))


def mission_link(page):
    page.locator('[data-action="share"]').click()
    dialog = page.get_by_role("dialog")
    expect(dialog).to_be_visible()
    field = dialog.get_by_role("textbox", name="Share this mission link", exact=True)
    expect(field).to_have_attribute("readonly", "")
    value = field.input_value()
    dialog.locator('[data-action="close-dialog"]').click()
    expect(dialog).to_have_count(0)
    return value


def finish_set(page, wrong=False, first_hint=False):
    active = journey(read_save(page))["active"]
    count = len(active["answers"])
    for index in range(active["index"], count):
        answer_current(page, correct=not wrong or (first_hint and index == 0),
                       hint=first_hint and index == 0)
    result = journey(read_save(page))["lastResult"]
    assert result["correct"] == (1 if wrong and first_hint else 0 if wrong else count)
    return result


def hidden_signal(page, hidden):
    page.evaluate("""hidden => {
      Object.defineProperty(document, 'hidden', {configurable:true, get:() => hidden});
      Object.defineProperty(document, 'visibilityState', {configurable:true, get:() => hidden ? 'hidden' : 'visible'});
      document.dispatchEvent(new Event('visibilitychange'));
    }""", hidden)


def geometry(page):
    metrics = page.evaluate("""() => {
      const rect = node => {
        const r = node.getBoundingClientRect();
        return {width:r.width, height:r.height, left:r.left, right:r.right, top:r.top, bottom:r.bottom};
      };
      const app = document.getElementById('academy');
      return {
        width:innerWidth, documentWidth:document.documentElement.scrollWidth, app:rect(app),
        oversized:[...app.querySelectorAll('.sa-content,.sa-question-card,.sa-answers,.sa-workbench-layout,.sa-world-grid,.sa-activity,.sa-expedition-layout,.sa-passport,.sa-passport-atlas,dialog')]
          .filter(node => node.getBoundingClientRect().width > innerWidth + 1).map(node => ({class:node.className,...rect(node)})),
        broken:[...document.images].filter(image => image.complete && image.currentSrc && !image.naturalWidth).map(image => image.currentSrc),
        contentOverflow:[...app.querySelectorAll('.sa-section-title,.sa-pill,.sa-passport-region,.sa-world-tile')]
          .filter(node => node.scrollWidth > node.clientWidth + 1)
          .map(node => ({class:node.className,text:node.textContent.trim().slice(0,100),
            clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,...rect(node)})),
        craft:[...app.querySelectorAll('.sa-assembly > svg,.sa-preview-craft > svg')].map(node => ({
          ...rect(node),description:node.getAttribute('aria-label')
        })),
        activity:[...app.querySelectorAll('.sa-activity')].map(node => ({
          kind:node.dataset.activityKind,...rect(node),
          controls:[...node.querySelectorAll('button')].map(control => ({
            ...rect(control),label:control.getAttribute('aria-label'),disabled:control.disabled
          }))
        })),
        flight:[...app.querySelectorAll('[data-flight]')].map(node => ({
          ...rect(node),elapsed:Number(node.dataset.elapsed),craft:rect(node.querySelector('.sa-flying-rocket'))
        })),
        diagrams:[...app.querySelectorAll('.sa-v2-picture > svg')].map(node => {
          const box = node.getBBox(), view = node.viewBox.baseVal, screen = node.getBoundingClientRect();
          return {description:node.getAttribute('aria-label'),width:screen.width,height:screen.height,
            box:{x:box.x,y:box.y,width:box.width,height:box.height},
            view:{x:view.x,y:view.y,width:view.width,height:view.height}};
        })
      };
    }""")
    assert metrics["documentWidth"] <= metrics["width"] + 1, metrics
    assert metrics["app"]["left"] >= -1 and metrics["app"]["right"] <= metrics["width"] + 1, metrics
    assert not metrics["oversized"], metrics
    assert not metrics["broken"], metrics
    for board in metrics["activity"]:
        assert board["kind"] and board["controls"], board
        assert all(control["label"] and control["width"] >= 44 and control["height"] >= 44
                   for control in board["controls"]), board
    for diagram in metrics["diagrams"]:
        assert diagram["description"] and diagram["width"] > 0 and diagram["height"] > 0, diagram
        bounds, view = diagram["box"], diagram["view"]
        assert bounds["x"] >= view["x"] - 3 and bounds["y"] >= view["y"] - 3, diagram
        assert bounds["x"] + bounds["width"] <= view["x"] + view["width"] + 3, diagram
        assert bounds["y"] + bounds["height"] <= view["y"] + view["height"] + 3, diagram
    return metrics


def write_fixture(page, save):
    """Retain root-v1 input so the actual storage transaction performs migration."""
    page.evaluate("""async save => {
      const {validateSave} = await import('/js/space-academy/progress.mjs');
      validateSave(save);
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('otterly-space-academy', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('academy');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      try {
        await new Promise((resolve, reject) => {
          const transaction = db.transaction('academy', 'readwrite');
          transaction.objectStore('academy').put(save, 'save');
          transaction.oncomplete = resolve;
          transaction.onabort = () => reject(transaction.error);
        });
      } finally { db.close(); }
    }""", save)


def layout_fixture(page, visits, fitted=True, grade="class-1"):
    """Build valid historical progress with the frozen reducer, not new campaign rules."""
    return page.evaluate("""async ({visits, fitted, grade}) => {
      const {newSave, applyAction, currentJourney} = await import('/js/space-academy/progress-v1.mjs');
      const {createMission} = await import('/js/space-academy/questions.mjs');
      const {getGrade} = await import('/js/space-academy/curriculum.mjs');
      const {PARTS} = await import('/js/space-academy/destinations.mjs');
      let save = applyAction(newSave(),{type:'grade',id:grade});
      for (let i = 0; i < Math.max(6, visits); i++) {
        const mission = createMission({grade,chapter:grade === 'class-1' ? 'operations' : getGrade(grade).chapters[0].id,
          seed:'layout-fixture-' + i});
        save = applyAction(save, {type:'start',mission});
        for (let q = 0; q < mission.questions.length; q++) {
          save = applyAction(save, {type:'answer',missionId:mission.id,choice:mission.questions[q].correctIndex});
          if (q < mission.questions.length - 1) save = applyAction(save, {type:'next',missionId:mission.id});
        }
        save = applyAction(save, {type:'complete',missionId:mission.id});
      }
      for (const part of PARTS) save = applyAction(save, {type:'fit',part:part.id,slot:part.id});
      for (let i = 0; i < visits; i++) {
        save = applyAction(save, {type:'launch'});
        const flight = currentJourney(save).flight;
        save = applyAction(save, {type:'arrive',flightId:flight.id,destination:flight.destination});
      }
      if (!fitted) for (const part of PARTS) save = applyAction(save, {type:'remove',part:part.id});
      return save;
    }""", {"visits": visits, "fitted": fitted, "grade": grade})


def campaign_fixture(page, grade, save=None, fitted=True):
    return page.evaluate("""async ({gradeId, previous, fitted}) => {
      const {newSave,applyAction,currentJourney,chapterObjectives} = await import('/js/space-academy/progress.mjs');
      const {getGrade} = await import('/js/space-academy/curriculum.mjs');
      const {createMission} = await import('/js/space-academy/questions.mjs');
      const {PARTS} = await import('/js/space-academy/destinations.mjs');
      let save = applyAction(previous ?? newSave(),{type:'grade',id:gradeId});
      for (const chapter of getGrade(gradeId).chapters) {
        let attempt = 0;
        while (!chapterObjectives(gradeId,currentJourney(save)).find(item => item.id === chapter.id).complete) {
          if (attempt++ > 4) throw new Error('Fixture did not complete a chapter objective: ' + chapter.id);
          const mission = createMission({grade:gradeId,chapter:chapter.id,
            seed:'browser-' + gradeId + '-' + chapter.id + '-' + currentJourney(save).completed.length});
          save = applyAction(save,{type:'start',mission,replace:true});
          for (let index = 0; index < mission.questions.length; index++) {
            if (index === 0) save = applyAction(save,{type:'hint',missionId:mission.id});
            save = applyAction(save,{type:'answer',missionId:mission.id,
              choice:(mission.questions[index].correctIndex + 1) % mission.questions[index].options.length});
            if (index < mission.questions.length - 1) save = applyAction(save,{type:'next',missionId:mission.id});
          }
          save = applyAction(save,{type:'complete',missionId:mission.id});
        }
      }
      if (fitted) for (const part of PARTS) save = applyAction(save,{type:'fit',part:part.id,slot:part.id});
      return save;
    }""", {"gradeId": grade, "previous": save, "fitted": fitted})


def current_activity(page):
    return page.evaluate("""async save =>
      (await import('/js/space-academy/progress.mjs')).currentActivity(save)""", read_save(page))


def activity_control(page, operation, value=None):
    selector = f'[data-action="activity"][data-activity-op="{operation}"]'
    if value is not None:
        selector += f'[data-activity-value="{value}"]'
    return page.locator(".sa-activity").locator(selector)


def activity_surface(page, kind):
    selector = {
        "picture-collection": ".sa-activity-collection",
        "pattern-blueprint": ".sa-activity-slots",
        "rover-rescue": ".sa-activity-rover-grid",
        "probe-loading": ".sa-activity-resource-cards",
        "beacon-route": ".sa-activity-network",
        "station-layout": ".sa-activity-station-grid",
        "galaxy-command": ".sa-activity-sector-grid",
    }[kind]
    surface = page.locator(selector)
    surface.scroll_into_view_if_needed()
    surface.evaluate("""node => {
      const navigation = document.querySelector('nav.nav');
      const offset = Math.max(72, navigation?.getBoundingClientRect().bottom ?? 0) + 12;
      scrollBy({top:node.getBoundingClientRect().top - offset,behavior:'instant'});
    }""")
    return surface


def activity_move(page, move, keyboard=False):
    control = activity_control(page, move["type"], move.get("value"))
    expect(control).to_be_enabled()
    before = read_save(page)["revision"]
    if keyboard:
        control.focus()
        page.keyboard.press("Enter")
    else:
        control.click()
    expect(page.locator("#academy")).not_to_have_attribute("aria-busy", "true")
    assert read_save(page)["revision"] > before, move


def activity_instructions(page, grade_id):
    before = read_save(page)
    instructions = page.locator(".sa-activity details")
    expect(instructions).to_have_count(1)
    summary = instructions.locator("summary")
    closed_text = instructions.inner_text()
    summary.focus()
    page.keyboard.press("Enter")
    expect(instructions).to_have_attribute("open", "")
    assert instructions.inner_text() != closed_text
    if grade_id == "class-4":
        expect(instructions).to_contain_text("Core")
    geometry(page)
    page.keyboard.press("Enter")
    expect(instructions).not_to_have_attribute("open", "")
    expect(summary).to_be_focused()
    assert read_save(page) == before
    return {"keyboardOpenAndClose": True, "revealsGuidance": True, "saveUnchanged": True}


def spatial_rover(page):
    activity = current_activity(page)
    assert activity["kind"] == "rover-rescue"
    board = page.locator('.sa-activity[data-activity-kind="rover-rescue"]')
    grid = board.locator(".sa-activity-rover-grid")
    assert not re.search(r"\b(?:Clear|Rock|Crate)\b", grid.inner_text(), re.I)
    labels = grid.locator(".sa-activity-rover-cell").evaluate_all(
        "nodes => nodes.map(node => node.getAttribute('aria-label'))")
    model = activity["model"]
    assert len(labels) == model["width"] * model["height"]
    for cell, label in enumerate(labels):
        assert label.startswith(f"Row {cell // model['width'] + 1}, column {cell % model['width'] + 1}: ")
    assert "Rover" in labels[activity["state"]["path"][-1]]
    assert "exit" in labels[model["exit"]].lower()
    assert all("Rock" in labels[cell] for cell in model["walls"])
    assert all("crate" in labels[cell].lower() for cell in model["crates"])
    assert grid.locator("svg").count()
    expect(activity_control(page, "undo")).to_have_count(1)
    expect(activity_control(page, "reset")).to_have_count(1)
    bounds = board.bounding_box()
    compact = page.viewport_size["width"] >= 700 and page.viewport_size["height"] <= 500
    if compact:
        assert bounds["height"] <= 318.5, bounds
    return {"bounds": bounds, "tileDescriptions": labels, "visibleRepeatedTileWords": False,
            "singleUndoAndReset": True, "compactShortLandscape": compact}


def activity_solution(activity):
    """Solve public puzzle givens independently; never alter the model or renderer."""
    model, kind = activity["model"], activity["kind"]
    moves = []

    def add(operation, value=None):
        moves.append({"type": operation, **({"value": str(value)} if value is not None else {})})

    if kind == "picture-collection":
        for item in [item for item in model["objects"] if item["type"] == model["targetType"]][:model["targetCount"]]:
            add("toggle", item["id"])
    elif kind == "pattern-blueprint":
        selected = None
        for index in range(model["slotCount"]):
            component = model["cycle"][(model["givenCount"] + index) % len(model["cycle"])]
            if component != selected:
                add("select", component)
                selected = component
            add("place", index)
    elif kind == "rover-rescue":
        width, height = model["width"], model["height"]
        crates = {cell: 1 << index for index, cell in enumerate(model["crates"])}
        required = (1 << len(crates)) - 1
        queue = deque([(model["start"], crates.get(model["start"], 0), [])])
        seen = set()
        solution = None
        while queue:
            cell, collected, trail = queue.popleft()
            if (cell, collected) in seen:
                continue
            seen.add((cell, collected))
            if cell == model["exit"] and collected == required:
                solution = trail
                break
            if len(trail) >= model["maxSteps"]:
                continue
            for direction, dx, dy in [("up", 0, -1), ("down", 0, 1), ("left", -1, 0), ("right", 1, 0)]:
                x, y = cell % width + dx, cell // width + dy
                next_cell = y * width + x
                if 0 <= x < width and 0 <= y < height and next_cell not in model["walls"]:
                    queue.append((next_cell, collected | crates.get(next_cell, 0), trail + [direction]))
        assert solution is not None, model
        for direction in solution:
            add("move", direction)
    elif kind == "probe-loading":
        feasible = []
        for counts in product(range(model["maxPerItem"] + 1), repeat=len(model["items"])):
            totals = {key: sum(count * item[key] for count, item in zip(counts, model["items"]))
                      for key in ["fuel", "supplies", "cargo", "cost"]}
            if (totals["fuel"] >= model["requiredFuel"] and totals["supplies"] >= model["requiredSupplies"]
                    and totals["cargo"] <= model["cargoCapacity"] and totals["cost"] <= model["budget"]):
                feasible.append(counts)
        assert feasible, model
        counts = min(feasible, key=lambda counts: (sum(counts), counts))
        for item, count in zip(model["items"], counts):
            for _ in range(count):
                add("increase", item["id"])
    elif kind == "beacon-route":
        def search(route, cost):
            if route[-1] == model["end"] and model["checkpoint"] in route:
                return route
            for edge in model["edges"]:
                if edge["from"] == route[-1] and edge["to"] not in route and cost + edge["cost"] <= model["fuelBudget"]:
                    found = search(route + [edge["to"]], cost + edge["cost"])
                    if found:
                        return found
            return None
        route = search([model["start"]], 0)
        assert route, model
        for node in route[1:]:
            add("travel", node)
    elif kind == "station-layout":
        width, height = model["width"], model["height"]

        def adjacent(cell, occupied):
            x, y = cell % width, cell // width
            return ((x > 0 and cell - 1 in occupied) or (x + 1 < width and cell + 1 in occupied)
                    or (y > 0 and cell - width in occupied) or (y + 1 < height and cell + width in occupied))

        def place(index, occupied, placements):
            if index == len(model["modules"]):
                return placements
            module = model["modules"][index]
            for turned in ([True, False] if module["width"] != module["height"] else [False]):
                columns, rows = ((module["height"], module["width"]) if turned
                                 else (module["width"], module["height"]))
                for y in range(height - rows + 1):
                    for x in range(width - columns + 1):
                        cells = {(y + row) * width + x + column for row in range(rows) for column in range(columns)}
                        if not cells & occupied and any(adjacent(cell, occupied) for cell in cells):
                            found = place(index + 1, occupied | cells,
                                          placements + [{"cell": y * width + x, "turned": turned}])
                            if found:
                                return found
            return None
        placements = place(0, {model["core"]}, [])
        assert placements, model
        for module, placement in zip(model["modules"], placements):
            add("select", module["id"])
            if placement["turned"]:
                add("rotate")
            add("place", placement["cell"])
    elif kind == "galaxy-command":
        chosen = None
        for probes in permutations(model["probes"], len(model["sectors"])):
            if any(sector["id"] not in probe["compatible"] for probe, sector in zip(probes, model["sectors"])):
                continue
            cost = sum(probe["cost"] for probe in probes)
            energy = sum(probe["energy"] - (model["specialistSaving"] if probe["speciality"] == sector["id"] else 0)
                         for probe, sector in zip(probes, model["sectors"]))
            science = sum(probe["science"] + (model["specialistScience"] if probe["speciality"] == sector["id"] else 0)
                          for probe, sector in zip(probes, model["sectors"]))
            if cost <= model["budget"] and energy <= model["energyCapacity"] and science >= model["requiredScience"]:
                chosen = probes
                break
        assert chosen, model
        for probe, sector in zip(chosen, model["sectors"]):
            add("select", probe["id"])
            add("assign", sector["id"])
    else:
        raise AssertionError("No independent browser solution for " + kind)
    assert moves
    return moves


def solve_board(page):
    activity_move(page, {"type": "reset"})
    moves = activity_solution(current_activity(page))
    for move in moves:
        activity_move(page, move)
    expect(page.locator("[data-activity-readiness]")).to_contain_text("Puzzle complete!")
    expect(page.locator(".sa-activity-status")).to_contain_text("Board ready!")
    return moves


def anonymous_art(page):
    """Check the mounted game, excluding the launcher's public Earth/Moon decoration."""
    requested = page.evaluate("""() => {
      const opened = performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd;
      return [...performance.getEntriesByType('resource').filter(entry => entry.startTime >= opened).map(entry => entry.name),
        ...[...document.querySelectorAll('#academy img')].map(image => image.currentSrc)]
        .filter(url => /\\/art\\/universe\\/[^/]+\\.webp(?:\\?|$)/.test(url));
    }""")
    known = page.evaluate("""async save =>
      (await import('/js/space-academy/progress.mjs')).universePassport(save).map(world => world.id)""", read_save(page))
    for url in requested:
        world_id = url.split("/")[-1].split("?")[0].removesuffix(".webp").removesuffix("-atlas")
        assert world_id in known, {"undiscoveredArtworkRequest": url, "passport": known}
    return requested


def advance_campaign_fixture(page, save, count):
    for _ in range(count):
        activity = page.evaluate("""async save =>
          (await import('/js/space-academy/progress.mjs')).currentActivity(save)""", save)
        moves = activity_solution(activity)
        save = page.evaluate("""async ({save, moves}) => {
          const {applyAction,currentJourney,campaignStatus} = await import('/js/space-academy/progress.mjs');
          for (const move of moves) save = applyAction(save,{type:'activity',move});
          if (!campaignStatus(save).ready) throw new Error('Independently solved fixture is not launch ready');
          save = applyAction(save,{type:'launch'});
          const flight = currentJourney(save).flight;
          return applyAction(save,{type:'arrive',flightId:flight.id,destination:flight.destination});
        }""", {"save": save, "moves": moves})
    return save


def run():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:4198")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--only", default="", help="Regex selecting test-case names")
    args = parser.parse_args()
    output = args.output.resolve()
    if output == ROOT or ROOT in output.parents:
        parser.error("--output must be outside the repository")
    output.mkdir(parents=True, exist_ok=True)
    base = args.url.rstrip("/")
    results = []
    current_case = ""

    def record(name, callback):
        nonlocal current_case
        if args.only and not re.search(args.only, name):
            return
        current_case = name
        try:
            result = {"name": name, "passed": True, **(callback() or {})}
        except Exception as error:
            result = {"name": name, "passed": False, "error": str(error), "traceback": traceback.format_exc()}
        results.append(result)
        (output / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
        print(("PASS " if result["passed"] else "FAIL ") + name, flush=True)
        if not result["passed"]:
            print(result["error"], flush=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()

        @contextmanager
        def session(size=(1366, 768), reduced=False, javascript=True, expected_resources=()):
            context = browser.new_context(
                viewport={"width": size[0], "height": size[1]},
                has_touch=size[0] <= 600, java_script_enabled=javascript,
                reduced_motion="reduce" if reduced else "no-preference",
            )
            issues, external, expected_errors = [], [], []
            def observe(page):
                page.set_default_timeout(10000)
                page.on("pageerror", lambda error: issues.append(str(error)))
                page.on("console", lambda message: (
                    expected_errors if any(message.location.get("url", "").endswith(path) for path in expected_resources)
                    else issues).append(message.text) if message.type == "error" else None)
            context.on("page", observe)
            context.on("response", lambda response: (
                expected_errors if any(response.url.endswith(path) for path in expected_resources)
                else issues).append(f"{response.status}: {response.url}") if response.status >= 400 else None)
            context.on("requestfailed", lambda request: (
                expected_errors if any(request.url.endswith(path) for path in expected_resources)
                else issues).append(f"{request.failure}: {request.url}"))
            context.on("request", lambda request: external.append(request.url)
                       if not request.url.startswith((base + "/", "data:", "blob:")) else None)
            page = context.new_page()
            try:
                yield context, page
                assert not issues, issues
                assert not external, external
            except Exception:
                page.screenshot(path=str(output / f"FAIL-{re.sub('[^a-zA-Z0-9-]', '-', current_case)}.png"))
                raise
            finally:
                context.close()

        def end_to_end():
            with session() as (context, page):
                response = page.goto(base + GAME, wait_until="networkidle")
                assert response.status == 200
                assert not page.evaluate("indexedDB.databases().then(items => items.some(item => item.name === 'otterly-space-academy'))")
                page.evaluate("""() => {
                  localStorage.setItem('clock_master_settings','native-clock-sentinel');
                  localStorage.setItem('mathTank_settings','native-maths-sentinel');
                }""")
                enter_game(page)
                expect(page.locator("#academy")).to_have_attribute("data-screen", "missions")
                expect(page.locator(".sa-hangar-caption")).to_contain_text("0/6 parts fitted")
                visible_chapter_shelf(page)
                objectives = page.locator(".sa-chapter-objective")
                expect(objectives).to_have_count(8)
                labels = page.locator(".sa-chapter-pick > span:not(.sa-chapter-part)").all_text_contents()
                assert len(set(labels)) == 6, labels
                expect(objectives.first).to_contain_text("towards this chapter")
                expect(objectives.first.locator("progress")).to_have_attribute("value", "0")
                expect(objectives.first.locator("progress")).to_have_attribute("max", "8")
                grades = page.evaluate("import('/js/space-academy/curriculum.mjs').then(module => module.GRADES)")
                grade = next(grade for grade in grades if grade["id"] == "class-1")
                chapters = ["operations", "operations"] + [
                    chapter["id"] for chapter in grade["chapters"] if chapter["id"] != "operations"]
                sets = []
                for index, chapter_id in enumerate(chapters):
                    if index:
                        section(page, "Missions")
                    chapter = next(chapter for chapter in grade["chapters"] if chapter["id"] == chapter_id)
                    start(page, "Start " + chapter["title"])
                    active = journey(read_save(page))["active"]
                    sets.append(active["mission"]["id"])
                    if index == 0:
                        assert mission_link(page) == page.url
                        answer_current(page, correct=True, hint=True)
                        before = journey(read_save(page))["active"]
                        page.reload(wait_until="networkidle")
                        enter_game(page)
                        expect(page.locator("#academy")).to_have_attribute("data-screen", "mission")
                        assert journey(read_save(page))["active"] == before
                        for _ in range(1, len(before["answers"])):
                            answer_current(page, correct=False)
                        result = journey(read_save(page))["lastResult"]
                        assert result["correct"] == 1 and result["helped"] == 1
                    else:
                        finish_set(page, wrong=True)
                    saved = journey(read_save(page))
                    assert saved["charges"] == index + 1
                    if index < 2:
                        assert saved["earned"] == ["engine"]
                        assert saved["lastResult"]["parts"] == (["engine"] if index == 0 else [])
                    objective = page.evaluate("""async save => {
                      const {chapterObjectives,currentJourney} = await import('/js/space-academy/progress.mjs');
                      return chapterObjectives('class-1',currentJourney(save));
                    }""", read_save(page))
                    assert next(item for item in objective if item["id"] == chapter_id)["complete"]
                    expect(page.locator(".sa-review")).not_to_have_attribute("open", "")
                    reveal_details(page.locator(".sa-review"))
                    assert page.locator(".sa-review-question").count() == 8
                    expect(page.locator(".sa-review-question").first).to_be_visible()
                    if saved["lastResult"]["parts"]:
                        earned_part = saved["lastResult"]["parts"][0]
                        reward = page.locator(
                            f'[data-action="view"][data-view="workshop"][data-part="{earned_part}"]')
                        expect(reward).to_have_count(1)
                        expect(reward).to_contain_text("BUILD")
                        expect(reward).to_have_attribute("aria-label", "Build: fit my new part")
                        expect(page.locator(".sa-guide-say")).to_have_text("You won a part! Let's build!")
                        reward.click()
                        expect(select_part(page, earned_part)).to_have_attribute("aria-pressed", "true")
                        expect(page.locator('[data-action="fit-selected"]')).to_be_enabled()
                    else:
                        expect(page.locator(".sa-reward-stage > .sa-pill")).to_have_text("WELL DONE")
                        expect(page.locator(".sa-guide-say")).not_to_contain_text("You won a part")
                assert len(set(sets)) == len(chapters) == 9
                assert journey(read_save(page))["earned"] == PART_IDS
                section(page, "Missions")
                visible_chapter_shelf(page)
                for chapter in grade["chapters"]:
                    expect(page.locator(f'[data-objective="{chapter["id"]}"]')).to_contain_text("8/8")
                section(page, "My progress")
                expect(page.locator(".sa-skill-card--next").first).to_be_visible()
                reveal_details(page.locator(".sa-report-method"))
                expect(page.locator(".sa-report-method")).to_contain_text("not IQ scores")
                page.screenshot(path=str(output / "real-earned-progress.png"))
                section(page, "Craft lab")
                reveal_details(page.get_by_text("How to earn parts", exact=True))
                expect(page.locator(".sa-launch-check")).to_contain_text("different questions")
                page.screenshot(path=str(output / "real-earned-workshop-before.png"))
                select_part(page, "engine").focus()
                page.keyboard.press("Enter")
                part_slot(page, "nose").click()
                expect(page.locator("#sa-notice")).to_contain_text("matching labelled slot")
                assert not journey(read_save(page))["fitted"]
                page.locator('[data-action="fit-selected"]').focus()
                page.keyboard.press("Enter")
                assert journey(read_save(page))["fitted"] == ["engine"]
                for part in PART_IDS[1:]:
                    select_part(page, part).click()
                    page.locator('[data-action="fit-selected"]').click()
                part_slot(page, "engine").click()
                assert len(journey(read_save(page))["fitted"]) == 5
                select_part(page, "engine").click()
                page.locator('[data-action="fit-selected"]').click()
                page.get_by_role("button", name="Comet mint", exact=True).click()
                assert journey(read_save(page))["paint"] == "mint"
                page.screenshot(path=str(output / "real-earned-workshop-fitted.png"))
                section(page, "Expedition")
                assert page.locator(".sa-world-tile img").count() == 0
                assert page.locator(".sa-world-tile").count() == 3
                assert not page.locator(".sa-world-art").count()
                solve_board(page)
                page.get_by_role("button", name="Launch to the next signal", exact=True).click()
                expect(page.locator("[data-flight]")).to_be_visible()
                page.wait_for_timeout(450)
                page.get_by_role("button", name="Pause flight", exact=True).click()
                elapsed = int(page.locator("[data-flight]").get_attribute("data-elapsed"))
                page.wait_for_timeout(650)
                assert int(page.locator("[data-flight]").get_attribute("data-elapsed")) == elapsed
                charge = journey(read_save(page))["charges"]
                assert charge == 8
                page.reload(wait_until="networkidle")
                enter_game(page)
                section(page, "Expedition")
                assert journey(read_save(page))["charges"] == charge
                expect(page.locator(".sa-world-art canvas")).to_have_attribute("data-ready", "true", timeout=FLIGHT_WAIT)
                assert journey(read_save(page))["expedition"]["visits"] == ["mars"]
                assert journey(read_save(page))["visits"] == []
                assert len(journey(read_save(page))["earned"]) == 6
                expect(page.locator(".sa-discovery-feature")).to_contain_text("Mars")
                page.screenshot(path=str(output / "real-first-discovery.png"))
                section(page, "Passport")
                expect(page.locator(".sa-passport-region")).to_have_count(7)
                assert page.locator(".sa-world-tile").count() == 30
                assert page.locator(".sa-world-tile.is-discovered").count() == 1
                page.get_by_role("combobox", name="Learning grade", exact=True).select_option("pp1")
                section(page, "Missions")
                start(page, "Start Little star counters")
                answer_current(page, correct=True)
                page.get_by_role("combobox", name="Local explorer", exact=True).select_option("explorer-2")
                page.get_by_role("combobox", name="Learning grade", exact=True).select_option("pp2")
                start(page, "Start Number neighbours")
                answer_current(page, correct=False)
                before_backup = read_save(page)
                assert len(before_backup["explorers"]["explorer-1"]["journeys"]["class-1"]["completed"]) == 9
                assert before_backup["explorers"]["explorer-1"]["journeys"]["pp1"]["active"]["index"] == 1
                page.get_by_role("button", name="Help & saves", exact=True).click()
                with page.expect_download() as download:
                    page.get_by_role("button", name="Download progress backup", exact=True).click()
                backup_path = output / "real-progress-backup.json"
                download.value.save_as(backup_path)
                backup = json.loads(backup_path.read_text(encoding="utf-8"))
                assert backup == before_backup
                page.locator("#sa-restore-file").set_input_files(
                    {"name": "invalid.json", "mimeType": "application/json", "buffer": b'{"version":99}'})
                expect(page.locator("#sa-import-error")).to_contain_text("Your current progress has not changed")
                assert read_save(page) == before_backup
                reveal_details(page.get_by_role("button", name="Reset Explorer 2...", exact=True, include_hidden=True)).click()
                expect(page.get_by_role("dialog")).to_contain_text("Other explorers and other games will not change")
                page.get_by_role("button", name="Reset Explorer 2", exact=True).click()
                reset = read_save(page)
                assert reset["explorers"]["explorer-1"] == backup["explorers"]["explorer-1"]
                assert not reset["explorers"]["explorer-2"]["journeys"]
                page.get_by_role("button", name="Help & saves", exact=True).click()
                page.locator("#sa-restore-file").set_input_files(str(backup_path))
                page.get_by_role("button", name="Keep current progress", exact=True).click()
                assert read_save(page) == reset
                page.get_by_role("button", name="Help & saves", exact=True).click()
                page.locator("#sa-restore-file").set_input_files(str(backup_path))
                page.get_by_role("button", name="Replace Academy saves", exact=True).click()
                expect(page.locator("#academy")).to_have_attribute("data-screen", "mission")
                restored = read_save(page)
                assert restored["explorers"] == backup["explorers"]
                assert page.evaluate("localStorage.getItem('clock_master_settings')") == "native-clock-sentinel"
                assert page.evaluate("localStorage.getItem('mathTank_settings')") == "native-maths-sentinel"
                geometry(page)
                return {"realMissionsCompleted": 9, "realQuestionsAnswered": 74,
                        "rewardRule": "Chapter-specific distinct-question participation earned six systems; repeating operations earned a charge but no extra system",
                        "checks": ["hint separation", "reload/resume", "all answer reviews", "practice suggestions",
                                   "share/report dialog before and after answers", "new reward preselects the actual earned part",
                                   "feedback advances first and receives focus", "visible chapter shelf without a disclosure",
                                   "native report/review/reset disclosures",
                                   "keyboard assembly", "wrong slot", "remove/refit", "paint", "saved pending flight",
                                   "first discovery", "grade/explorer isolation", "backup/cancel/invalid/restore", "scoped reset"]}

        def grade_modes():
            with session(reduced=True) as (_, page):
                open_game(page, base)
                grades = page.evaluate("import('/js/space-academy/curriculum.mjs').then(module => module.GRADES)")
                checked = []
                for grade in grades:
                    section(page, "Missions")
                    page.get_by_role("combobox", name="Learning grade", exact=True).select_option(grade["id"])
                    shelf = visible_chapter_shelf(page)
                    expect(shelf.locator(".sa-chapter-pick")).to_have_count(len(grade["chapters"]))
                    for chapter in grade["chapters"]:
                        start(page, "Start " + chapter["title"])
                        mission = journey(read_save(page))["active"]["mission"]
                        assert mission["grade"] == grade["id"] and mission["chapter"] == chapter["id"]
                        assert len(mission["questions"]) == grade["missionSize"]
                        checked.append(grade["id"] + "/" + chapter["id"])
                        section(page, "Missions")
                    for level in [1, 2, 3]:
                        reveal_details(page.locator("#sa-level"))
                        expect(page.locator("#sa-level")).to_be_visible()
                        page.get_by_role("combobox", name="Challenge level", exact=True).select_option(str(level))
                        start(page, "Start " + grade["chapters"][0]["title"])
                        assert journey(read_save(page))["active"]["mission"]["level"] == level
                        section(page, "Missions")
                    start(page, "Start mixed set")
                    assert journey(read_save(page))["active"]["mission"]["mode"] == "mixed"
                    section(page, "Missions")
                    if grade["year"] > 0:
                        count = 50 if grade["year"] == 5 else 35
                        start(page, f"Try {count}-question paper")
                        assert len(journey(read_save(page))["active"]["answers"]) == count
                        section(page, "Missions")
                    else:
                        assert not page.get_by_role("button", name=re.compile(r"question paper"),
                                                    include_hidden=True).count()
                for mode in ["chapter", "mixed", "paper"]:
                    query = {"grade": "class-4", "mode": mode, "level": 2, "seed": "browser-linked-" + mode, "bank": 2}
                    if mode == "chapter":
                        query["chapter"] = "fractions"
                    open_game(page, base, "?" + urlencode(query))
                    section(page, "Missions")
                    start(page, "Start linked set")
                    active = journey(read_save(page))["active"]["mission"]
                    assert active["mode"] == mode and active["seed"] == query["seed"]
                    assert active["contentVersion"] == 2
                return {"chaptersOpened": checked, "levels": "all three at all seven grades",
                        "modes": "chapter, mixed, grade-appropriate papers and seeded deep links"}

        def paper_completion():
            with session(reduced=True) as (_, page):
                open_game(page, base, "?grade=class-5&mode=paper&level=2&seed=full-paper&bank=2")
                start(page, "Start linked set")
                result = finish_set(page)
                assert len(result["answers"]) == 50 and result["correct"] == 50
                reveal_details(page.locator(".sa-review"))
                assert page.locator(".sa-review-question").count() == 50
                expect(page.locator(".sa-review-question").last).to_be_visible()
                campaign = page.evaluate("import('/js/space-academy/campaigns.mjs').then(module => module.getCampaign('class-5'))")
                chapters = {}
                for question in result["mission"]["questions"]:
                    chapters.setdefault(question["chapter"], set()).add(question["id"])
                expected_parts = [system["id"] for system in campaign["systems"] if all(
                    len(chapters.get(chapter, set())) >= campaign["questionTarget"] for chapter in system["chapters"])]
                saved = journey(read_save(page))
                assert saved["earned"] == result["parts"] == expected_parts
                assert saved["charges"] == 1
                for chapter, questions in chapters.items():
                    assert len(saved["expedition"]["credits"][chapter]) == min(len(questions), campaign["questionTarget"])
                return {"questionsActuallyAnswered": 50, "reviewed": 50,
                        "reward": {"charge": 1, "chapterSystems": expected_parts},
                        "participation": {chapter: len(questions) for chapter, questions in chapters.items()}}

        def legacy_backup():
            legacy_path = ROOT / "scripts" / "fixtures" / "space-academy-v1-save.json"
            original = json.loads(legacy_path.read_text(encoding="utf-8"))
            expected = original["explorers"]["explorer-1"]["journeys"]["class-1"]
            with session(reduced=True) as (_, page):
                open_game(page, base)
                page.get_by_role("button", name="Help & saves", exact=True).click()
                page.locator("#sa-restore-file").set_input_files(str(legacy_path))
                page.get_by_role("button", name="Replace Academy saves", exact=True).click()
                assert_legacy_preserved(read_save(page), original)
                page.get_by_role("combobox", name="Local explorer", exact=True).select_option("explorer-2")
                if page.locator("#academy").get_attribute("data-screen") != "mission":
                    section(page, "Missions")
                    start(page, "Resume saved mission")
                active = journey(read_save(page))["active"]
                assert active["mission"]["contentVersion"] == 1 and active["index"] == 1
                assert active["answers"][0] == original["explorers"]["explorer-2"]["journeys"]["class-5"]["active"]["answers"][0]
                for _ in range(active["index"], len(active["answers"])):
                    answer_current(page)
                assert journey(read_save(page))["lastResult"]["correct"] == 7
                assert journey(read_save(page))["lastResult"]["helped"] == 1
                page.get_by_role("combobox", name="Local explorer", exact=True).select_option("explorer-1")
                saved = journey(read_save(page))
                for key in ["completed", "earned", "fitted", "paint", "charges", "flight"]:
                    assert saved[key] == expected[key], key
                section(page, "My progress")
                page.get_by_role("button", name="Review latest completed set", exact=True).click()
                reveal_details(page.locator(".sa-review"))
                expect(page.locator(".sa-review-question")).to_have_count(8)
                section(page, "Missions")
                start(page, "Start Add, subtract, investigate")
                assert journey(read_save(page))["active"]["mission"]["contentVersion"] == 2
                answer_current(page, correct=False)
                current = journey(read_save(page))
                assert sum(attempt["id"].startswith("q2-") for attempt in current["attempts"]) == 1
                assert current["completed"] == expected["completed"]
                section(page, "Expedition")
                expect(page.locator("[data-flight]")).to_have_count(0, timeout=FLIGHT_WAIT)
                assert journey(read_save(page))["visits"] == ["earth"]
                assert journey(read_save(page))["charges"] == expected["charges"]
                assert journey(read_save(page))["active"]["mission"]["contentVersion"] == 2
                section(page, "Passport")
                page.locator('[data-action="world"][data-world="earth"]').click()
                expect(page.locator(".sa-world-art canvas")).to_have_attribute("data-ready", "true", timeout=12000)
                page.get_by_role("combobox", name="Learning grade", exact=True).select_option("pp1")
                if page.locator("#academy").get_attribute("data-screen") != "mission":
                    section(page, "Missions")
                    start(page, "Resume saved mission")
                active = journey(read_save(page))["active"]
                assert active["mission"]["contentVersion"] == 1 and active["index"] == 1
                for _ in range(active["index"], len(active["answers"])):
                    answer_current(page)
                assert journey(read_save(page))["lastResult"]["correct"] == 5
                assert journey(read_save(page))["earned"] == ["engine"]
                return {"restored": "unchanged original-bank/root-v1 golden backup, not regenerated",
                        "resumed": ["Explorer 2 Class 5", "Explorer 1 PP1"],
                        "preserved": ["old reviews", "six parts", "mint paint", "pending flight", "charges", "separate explorers"],
                        "newMission": "v2 without mixing old evidence"}

        def atomic_legacy_migration(filename):
            path = ROOT / "scripts" / "fixtures" / filename
            original = json.loads(path.read_text(encoding="utf-8"))
            with session(reduced=True) as (_, page):
                page.goto(base + GAME, wait_until="networkidle")
                write_fixture(page, original)
                page.evaluate(FAULTS)
                page.evaluate("window.__academyFault = {method:'put',key:'save'}")
                enter_game(page)
                expect(page.locator("#academy")).to_have_attribute("data-screen", "storage-error")
                assert read_save(page) == original
                page.evaluate("window.__academyFault = null")
                page.get_by_role("button", name="Try opening the save again", exact=True).click()
                expect(page.locator("#academy")).not_to_have_attribute("data-screen", "storage-error")
                migrated = read_save(page)
                assert_legacy_preserved(migrated, original)
                assert migrated["revision"] == original["revision"] + 1
                open_game(page, base)
                assert read_save(page) == migrated
                flight_grade, saved_journey = next(
                    (grade, saved) for grade, saved in original["explorers"]["explorer-1"]["journeys"].items()
                    if saved["flight"])
                page.get_by_role("combobox", name="Learning grade", exact=True).select_option(flight_grade)
                assert journey(read_save(page))["flight"] == saved_journey["flight"]
                assert journey(read_save(page))["charges"] == saved_journey["charges"]
                section(page, "Expedition")
                expect(page.locator("[data-flight]")).to_have_count(0, timeout=FLIGHT_WAIT)
                arrived = journey(read_save(page))
                destination = saved_journey["flight"]["destination"]
                assert arrived["visits"] == saved_journey["visits"] + [destination]
                assert arrived["expedition"]["visits"] == []
                assert arrived["charges"] == saved_journey["charges"]
                for key in ["completed", "earned", "fitted", "paint", "active", "attempts", "lastResult"]:
                    assert arrived[key] == saved_journey[key], key
                section(page, "Passport")
                worlds = {world for explorer_journey in read_save(page)["explorers"]["explorer-1"]["journeys"].values()
                          for world in explorer_journey["visits"]}
                assert page.locator(".sa-world-tile.is-discovered").count() == len(worlds)
                page.locator(f'[data-action="world"][data-world="{destination}"]').click()
                expect(page.locator(".sa-world-art canvas")).to_have_attribute("data-ready", "true")
                geometry(page)
                page.screenshot(path=str(output / (path.stem + "-migrated-passport.png")))
                return {"fixture": filename, "originalRootVersion": 1, "migratedRootVersion": 2,
                        "atomicWriteFailure": "Original bytes and revision survived the failed migration transaction",
                        "retry": "Every original journey field retained; revision incremented exactly once",
                        "legacyFlight": {"grade": flight_grade, "arrivedAtOriginalDestination": destination,
                                         "additionalChargeDebit": 0},
                        "reload": "Root-v2 save not migrated again"}

        def pre_campaign_restore_resume():
            path = ROOT / "scripts" / "fixtures" / "space-academy-pre-campaign-save.json"
            original = json.loads(path.read_text(encoding="utf-8"))
            with session(reduced=True) as (_, page):
                open_game(page, base)
                before_restore = read_save(page)
                page.get_by_role("button", name="Help & saves", exact=True).click()
                page.locator("#sa-restore-file").set_input_files(str(path))
                page.evaluate(FAULTS)
                page.evaluate("window.__academyFault = {method:'put',key:'save'}")
                page.get_by_role("button", name="Replace Academy saves", exact=True).click()
                expect(page.locator("#academy")).to_have_attribute("data-screen", "storage-error")
                assert read_save(page) == before_restore
                page.evaluate("window.__academyFault = null")
                page.get_by_role("button", name="Try opening the save again", exact=True).click()
                expect(page.locator("#academy")).to_have_attribute("data-screen", "missions")
                page.get_by_role("button", name="Help & saves", exact=True).click()
                page.locator("#sa-restore-file").set_input_files(str(path))
                page.get_by_role("button", name="Replace Academy saves", exact=True).click()
                expect(page.locator("#academy")).to_have_attribute("data-screen", "mission")
                assert_legacy_preserved(read_save(page), original)
                completed = []
                for explorer_id, grade_id in [("explorer-1", "class-1"), ("explorer-2", "pp2")]:
                    if read_save(page)["activeExplorer"] != explorer_id:
                        page.get_by_role("combobox", name="Local explorer", exact=True).select_option(explorer_id)
                    if page.locator("#academy").get_attribute("data-screen") != "mission":
                        section(page, "Missions")
                        start(page, "Resume saved mission")
                    expect(page.locator("#academy")).to_have_attribute("data-screen", "mission")
                    old = original["explorers"][explorer_id]["journeys"][grade_id]
                    active = journey(read_save(page))["active"]
                    assert active == old["active"] and active["mission"]["contentVersion"] == 2
                    expected_correct = sum(answer["choice"] is None or answer["choice"] == question["correctIndex"]
                                           for answer, question in zip(active["answers"], active["mission"]["questions"]))
                    expected_helped = sum(answer["hinted"] for answer in active["answers"])
                    for index in range(active["index"], len(active["answers"])):
                        if journey(read_save(page))["active"]["answers"][index]["choice"] is None:
                            answer_current(page)
                        else:
                            action = "complete" if index == len(active["answers"]) - 1 else "next"
                            page.locator(f'.sa-feedback [data-action="{action}"]').click()
                    saved = journey(read_save(page))
                    result = saved["lastResult"]
                    assert result["mission"] == active["mission"]
                    assert result["correct"] == expected_correct and result["helped"] == expected_helped
                    for index, answer in enumerate(old["active"]["answers"]):
                        if answer["choice"] is not None:
                            assert result["answers"][index] == answer
                    assert saved["completed"] == old["completed"] + [active["mission"]["id"]]
                    assert saved["charges"] == old["charges"] + 1
                    completed.append({"explorer": explorer_id, "grade": grade_id, "correct": result["correct"],
                                      "helped": result["helped"], "bank": result["mission"]["contentVersion"]})
                retained = read_save(page)["explorers"]["explorer-1"]["journeys"]["class-5"]
                old_flagship = original["explorers"]["explorer-1"]["journeys"]["class-5"]
                for key in old_flagship:
                    assert retained[key] == old_flagship[key], key
                open_game(page, base)
                assert journey(read_save(page))["lastResult"]["mission"]["contentVersion"] == 2
                return {"fixture": path.name, "failedRestore": "Current root-v2 save unchanged by aborted replacement",
                        "resumedToRealUiCompletion": completed,
                        "retained": "Class 5's six fitted mint systems, Earth discovery, paid pending Moon flight and charge balance"}

        def visual_answer_flow():
            with session(size=(390, 844)) as (_, page):
                open_game(page, base, "?grade=class-2&chapter=geometry&level=2&seed=visual-ui&bank=2")
                start(page, "Start linked set")
                active = journey(read_save(page))["active"]
                assert active["mission"]["contentVersion"] == 2
                question = active["mission"]["questions"][0]
                assert all(question["optionVisuals"])
                controls = page.get_by_role("group", name="Answer choices", exact=True).get_by_role("button")
                expect(controls).to_have_count(4)
                for index in range(4):
                    assert "Picture " in controls.nth(index).get_attribute("aria-label")
                    assert controls.nth(index).locator("svg").count()
                geometry(page)
                page.screenshot(path=str(output / "visual-choices-phone.png"))
                answer_current(page, correct=False)
                assert journey(read_save(page))["attempts"][-1]["misconception"]
                active = journey(read_save(page))["active"]
                for _ in range(active["index"], len(active["answers"])):
                    answer_current(page)
                reveal_details(page.locator(".sa-review"))
                expect(page.locator(".sa-review-question")).to_have_count(8)
                assert page.locator(".sa-review-question svg").count() >= 16
                assert not re.search(r"(?:bundle|grid|tile|symbol|clock):", page.locator(".sa-review").inner_text())
                page.reload(wait_until="networkidle")
                enter_game(page)
                assert journey(read_save(page))["earned"] == ["body"]
                return {"result": "real graphical choices, wrong-answer practice feedback, completion, illustrated review and reload"}

        def visual_curriculum(size):
            with session(size=size, reduced=True) as (_, page):
                open_game(page, base)
                catalogue = page.evaluate("""async () => {
                  const {GRADES} = await import('/js/space-academy/curriculum.mjs');
                  const {createMission} = await import('/js/space-academy/questions.mjs');
                  const found = new Map();
                  for (const grade of [...GRADES].reverse()) for (const chapter of grade.chapters) for (const level of [3,2,1]) {
                    const settings = {grade:grade.id,chapter:chapter.id,level,seed:'visual-curriculum'};
                    const mission = createMission(settings);
                    mission.questions.forEach((question,index) => {
                      const pictures = (question.optionVisuals ?? []).filter(Boolean);
                      if (!question.visual && !pictures.length) return;
                      const format = [question.visual?.kind ?? '',question.visual?.format ?? '',...new Set(pictures.map(picture=>picture.kind))].join('|');
                      const key = [question.family,format,grade.year < 1 ? grade.id : 'school'].join('|');
                      if (!found.has(key)) found.set(key,{...settings,index,family:question.family,format});
                    });
                  }
                  return [...found.values()];
                }""")
                if size != (1366, 768):
                    formats = {}
                    for sample in catalogue:
                        formats.setdefault(sample["format"], sample)
                    catalogue = list(formats.values())
                checked = []
                failures = []
                for sample in catalogue:
                    fixture = page.evaluate("""async settings => {
                      const {newSave,applyAction} = await import('/js/space-academy/progress.mjs');
                      const {createMission} = await import('/js/space-academy/questions.mjs');
                      const mission = createMission(settings);
                      let save = applyAction(newSave(),{type:'grade',id:settings.grade});
                      save = applyAction(save,{type:'start',mission});
                      for (let index=0;index<settings.index;index++) {
                        save = applyAction(save,{type:'answer',missionId:mission.id,choice:mission.questions[index].correctIndex});
                        save = applyAction(save,{type:'next',missionId:mission.id});
                      }
                      return save;
                    }""", sample)
                    write_fixture(page, fixture)
                    open_game(page, base)
                    assert journey(read_save(page))["active"]["mission"]["questions"][sample["index"]]["family"] == sample["family"]
                    try:
                        metrics = geometry(page)
                        assert metrics["diagrams"], sample
                        assert not re.search(r"(?:bundle|grid|tile|symbol|clock):", page.locator(".sa-answers").inner_text())
                    except AssertionError as error:
                        failures.append({"sample": sample, "error": str(error)})
                        page.screenshot(path=str(output / f"FAIL-bank-{sample['grade']}-{sample['family']}-{size[0]}x{size[1]}.png"))
                        continue
                    if sample["family"] in ["abacus-change", "cube-net", "clock-error", "decimal-statements",
                                            "scene-statements", "fraction-left", "graph-parts", "path-condition",
                                            "picture-analogy", "balance-missing"]:
                        page.screenshot(path=str(output / f"bank-{sample['grade']}-{sample['family']}-l{sample['level']}-{size[0]}x{size[1]}.png"))
                    checked.append({**sample, "diagramCount": len(metrics["diagrams"])})
                assert not failures, json.dumps(failures, indent=2)
                return {"viewport": size, "samples": checked,
                        "fixture": "Unmodified production missions with reducer-generated bookmarks for visual inspection; real answer/reward flow checked separately"}

        def invalid_board_move(page, initial):
            kind, model = initial["kind"], initial["model"]
            expect(activity_control(page, "undo")).to_be_disabled()
            if kind == "picture-collection":
                wrong = next(item for item in model["objects"] if item["type"] != model["targetType"])
                activity_move(page, {"type": "toggle", "value": wrong["id"]})
                expect(page.locator(".sa-activity-status")).to_contain_text("Put back 1 item")
                launch_blocked(page)
                activity_move(page, {"type": "undo"})
                assert current_activity(page) == initial
                return "Wrong picture gives explicit put-back feedback; Undo restores the empty collection"
            if kind == "probe-loading":
                expect(activity_control(page, "decrease", model["items"][0]["id"])).to_be_disabled()
                assert current_activity(page) == initial
                return "Removing a nonexistent pack is deliberately disabled"
            invalid = {
                "pattern-blueprint": ("place", "0", "Choose a component"),
                "beacon-route": ("travel", model.get("end"), "no one-way link"),
                "station-layout": ("place", str(model.get("core")), "Choose a station module"),
                "galaxy-command": ("assign", "dust", "Choose a probe"),
            }
            if kind == "rover-rescue":
                direction = "left" if model["start"] % model["width"] == 0 else "right"
                operation, value, message = "move", direction, "leaves the map"
            else:
                operation, value, message = invalid[kind]
            before = read_save(page)
            activity_control(page, operation, value).click()
            expect(page.locator("#sa-activity-notice")).to_be_visible()
            expect(page.locator("#sa-activity-notice")).to_contain_text(message)
            assert read_save(page) == before
            return "Visible invalid move refused without a save write: " + message

        def campaign_board(grade_id):
            with session(reduced=True) as (_, page):
                open_game(page, base, "?" + urlencode({"grade": grade_id}))
                campaign = page.evaluate("""async grade =>
                  (await import('/js/space-academy/campaigns.mjs')).getCampaign(grade)""", grade_id)
                expect(page.locator(".sa-launchpad-heading")).to_contain_text(campaign["title"])
                assert not any(saved["completed"] for saved in
                               read_save(page)["explorers"]["explorer-1"]["journeys"].values())
                fixture = campaign_fixture(page, grade_id, fitted=False)
                assert fixture["explorers"]["explorer-1"]["journeys"][grade_id]["expedition"]["legacyParts"] == []
                write_fixture(page, fixture)
                open_game(page, base)
                section(page, "Craft lab")
                expect(page.locator(".sa-assembly [data-craft-grade]").first).to_have_attribute("data-craft-grade", grade_id)
                assert page.locator(".sa-assembly").bounding_box()["width"] >= 230
                for part in PART_IDS:
                    select_part(page, part).click()
                    page.locator('[data-action="fit-selected"]').click()
                assert journey(read_save(page))["fitted"] == PART_IDS
                page.get_by_role("button", name="Comet mint", exact=True).click()
                expect(page.locator('[data-action="paint"][data-paint="mint"]')).to_have_attribute("aria-pressed", "true")
                assert journey(read_save(page))["paint"] == "mint"
                craft_metrics = geometry(page)
                page.screenshot(path=str(output / f"craft-{grade_id}-1366x768.png"), full_page=True)
                section(page, "Expedition")
                expect(page.locator(".sa-world-tile")).to_have_count(len(campaign["destinations"]))
                assert not page.locator(".sa-world-tile img").count()
                for tile in page.locator(".sa-world-tile").all():
                    expect(tile).to_be_disabled()
                    assert tile.get_attribute("aria-label").startswith("Undiscovered signal")
                assert anonymous_art(page) == []
                initial = current_activity(page)
                expect(page.locator(".sa-activity")).to_have_attribute("data-activity-kind", initial["kind"])
                launch_blocked(page)
                disclosure = activity_instructions(page, grade_id)
                assert current_activity(page) == initial
                rover = spatial_rover(page) if grade_id == "class-1" else None
                invalid_feedback = invalid_board_move(page, initial)
                activity_move(page, {"type": "reset"})
                assert current_activity(page) == initial
                moves = activity_solution(initial)
                snapshots = [initial]
                prefix = 0
                for index, move in enumerate(moves):
                    activity_move(page, move, keyboard=index == 0)
                    snapshots.append(current_activity(page))
                    prefix = index + 1
                    if move["type"] in ["toggle", "place", "move", "increase", "travel", "assign"]:
                        expect(activity_control(page, move["type"], move.get("value"))).to_be_focused()
                        break
                partial = journey(read_save(page))["expedition"]["activity"]
                assert partial is not None and partial["state"] != initial["state"]
                open_game(page, base)
                section(page, "Expedition")
                assert journey(read_save(page))["expedition"]["activity"] == partial
                assert current_activity(page) == partial
                activity_move(page, {"type": "undo"})
                assert current_activity(page) == snapshots[-2]
                activity_move(page, moves[prefix - 1])
                assert current_activity(page) == partial
                for move in moves[prefix:]:
                    activity_move(page, move)
                expect(page.locator("[data-activity-readiness]")).to_contain_text("Puzzle complete!")
                expect(page.locator('[data-action="launch"]')).to_be_enabled()
                activity_move(page, {"type": "reset"})
                assert current_activity(page) == initial
                launch_blocked(page)
                solve_board(page)
                board_metrics = geometry(page)
                page.screenshot(path=str(output / f"board-{grade_id}-solved-1366x768.png"), full_page=True)
                section(page, "Craft lab")
                part_slot(page, "engine").click()
                section(page, "Expedition")
                launch_blocked(page)
                expect(page.locator("[data-activity-readiness]")).to_contain_text("Puzzle complete!")
                section(page, "Craft lab")
                select_part(page, "engine").click()
                page.locator('[data-action="fit-selected"]').click()
                section(page, "Expedition")
                expect(page.locator('[data-action="launch"]')).to_be_enabled()
                before_launch = read_save(page)
                page.locator('[data-action="launch"]').click()
                expect(page.locator("[data-flight]")).to_be_visible()
                assert journey(read_save(page))["charges"] == journey(before_launch)["charges"] - 1
                expect(page.locator(".sa-world-art canvas")).to_have_attribute("data-ready", "true", timeout=FLIGHT_WAIT)
                saved = journey(read_save(page))
                assert saved["expedition"]["visits"] == [campaign["destinations"][0]]
                assert saved["expedition"]["paid"] == [campaign["destinations"][0]]
                assert saved["earned"] == PART_IDS and len(saved["fitted"]) == 6 and saved["paint"] == "mint"
                anonymous_art(page)
                section(page, "Passport")
                expect(page.locator(".sa-world-tile")).to_have_count(30)
                expect(page.locator(".sa-world-tile.is-discovered")).to_have_count(1)
                return {"grade": grade_id, "campaign": campaign["title"], "board": initial["kind"],
                        "movesThroughVisibleControls": moves, "invalidMove": invalid_feedback,
                        "nativeInstructionsDisclosure": True, "disclosure": disclosure,
                        "spatialRover": rover,
                        "checks": ["direct grade entry without younger-grade prerequisites", "six visible fitted craft systems",
                                   "anonymous undiscovered route", "keyboard board move", "active-control focus",
                                   "partial-move reload/resume", "undo and redo", "same-seed reset",
                                   "solved activity and fitted-system launch gates", "real arrival and one charge debit"],
                        "craftGeometry": craft_metrics, "boardGeometry": board_metrics,
                        "fixture": "All-wrong, hinted chapter missions completed by unmodified production reducer; board solved through real UI"}

        def campaign_responsive(size):
            with session(size=size, reduced=True) as (_, page):
                open_game(page, base)
                grades = page.evaluate("import('/js/space-academy/curriculum.mjs').then(module => module.GRADES.map(grade=>grade.id))")
                metrics = {}
                for grade_id in grades:
                    fixture = campaign_fixture(page, grade_id)
                    write_fixture(page, fixture)
                    open_game(page, base)
                    section(page, "Craft lab")
                    craft_metrics = geometry(page)
                    assert page.locator(".sa-assembly").bounding_box()["width"] >= 230
                    if size in [(1366, 768), (390, 844), (844, 390)]:
                        page.locator(".sa-assembly").scroll_into_view_if_needed()
                        page.screenshot(path=str(output / f"craft-{grade_id}-{size[0]}x{size[1]}-viewport.png"))
                    section(page, "Expedition")
                    initial = current_activity(page)
                    disclosure = activity_instructions(page, grade_id)
                    board_metrics = geometry(page)
                    rover = spatial_rover(page) if grade_id == "class-1" else None
                    if size in [(1366, 768), (390, 844), (844, 390)]:
                        page.locator(".sa-activity").scroll_into_view_if_needed()
                        page.screenshot(path=str(output / f"board-{grade_id}-{size[0]}x{size[1]}-viewport.png"))
                    move = activity_solution(initial)[0]
                    activity_move(page, move)
                    activity_control(page, "undo").click()
                    expect(page.locator("#academy")).not_to_have_attribute("aria-busy", "true")
                    assert current_activity(page) == initial
                    if size in [(1366, 768), (390, 844), (844, 390)]:
                        activity_surface(page, initial["kind"])
                        page.screenshot(path=str(output / f"board-{grade_id}-{size[0]}x{size[1]}-controls.png"))
                    metrics[grade_id] = {"craft": craft_metrics, "board": board_metrics,
                                         "interaction": move, "undo": "restored original state",
                                         "disclosure": disclosure, "spatialRover": rover}
                return {"viewport": size, "allSevenCampaigns": metrics}

        def late_campaign(size):
            with session(size=size, reduced=True) as (_, page):
                open_game(page, base)
                fixture = advance_campaign_fixture(page, campaign_fixture(page, "class-5"), 5)
                write_fixture(page, fixture)
                open_game(page, base)
                section(page, "Expedition")
                expect(page.locator(".sa-map > .sa-section-title .sa-pill")).to_have_text("5 / 6")
                reveal_details(page.locator(".sa-campaign-route"))
                expect(page.locator(".sa-world-tile.is-discovered")).to_have_count(5)
                unknown = page.locator('[data-world="black_hole"]')
                expect(unknown).to_be_disabled()
                assert not unknown.locator("img").count()
                assert "black hole" not in unknown.inner_text().lower()
                anonymous_art(page)
                before = geometry(page)
                page.locator(".sa-activity").scroll_into_view_if_needed()
                page.screenshot(path=str(output / f"campaign-late-class-5-{size[0]}x{size[1]}.png"))
                solve_board(page)
                charges = journey(read_save(page))["charges"]
                page.locator('[data-action="launch"]').click()
                expect(page.locator(".sa-world-art canvas")).to_have_attribute("data-ready", "true", timeout=FLIGHT_WAIT)
                assert journey(read_save(page))["charges"] == charges - 1
                assert journey(read_save(page))["expedition"]["visits"][-1] == "black_hole"
                section(page, "Expedition")
                expect(page.locator(".sa-map > .sa-section-title h2")).to_contain_text("Galaxy Command")
                expect(page.locator(".sa-campaign-complete")).to_contain_text("All 6 worlds found!")
                expect(page.locator(".sa-world-tile.is-discovered")).to_have_count(6)
                assert not page.locator(".sa-activity").count()
                assert not page.locator('[data-action="launch"]').count()
                complete = geometry(page)
                page.screenshot(path=str(output / f"campaign-complete-class-5-{size[0]}x{size[1]}.png"))
                section(page, "Passport")
                expect(page.locator(".sa-world-tile.is-discovered")).to_have_count(6)
                passport = geometry(page)
                return {"viewport": size, "late": before, "completed": complete, "passport": passport,
                        "checks": ["last hidden signal", "real final board and flight", "six-object campaign complete",
                                   "no unnecessary activity or launch after completion", "global passport retains all six"],
                        "fixture": "First five expeditions advanced with independent model solutions and unmodified production actions; final expedition played visibly"}

        def passport_isolation():
            with session(reduced=True) as (_, page):
                open_game(page, base, "?grade=class-5")
                write_fixture(page, campaign_fixture(page, "class-5"))
                open_game(page, base)
                assert "pp1" not in read_save(page)["explorers"]["explorer-1"]["journeys"]
                section(page, "Expedition")
                first_moves = activity_solution(current_activity(page))[:2]
                for move in first_moves:
                    activity_move(page, move)
                flagship = journey(read_save(page))
                page.get_by_role("combobox", name="Learning grade", exact=True).select_option("pp1")
                section(page, "Expedition")
                assert not journey(read_save(page)).get("earned", [])
                activity_move(page, activity_solution(current_activity(page))[0])
                capsule = journey(read_save(page))
                page.get_by_role("combobox", name="Learning grade", exact=True).select_option("class-5")
                assert journey(read_save(page)) == flagship
                page.get_by_role("combobox", name="Local explorer", exact=True).select_option("explorer-2")
                page.get_by_role("combobox", name="Learning grade", exact=True).select_option("class-5")
                section(page, "Expedition")
                assert not journey(read_save(page)).get("earned", [])
                assert current_activity(page)["state"]["assignments"] == [None, None, None]
                for move in first_moves:
                    activity_move(page, move)
                second_flagship = journey(read_save(page))
                assert second_flagship["fitted"] == []
                assert read_save(page)["explorers"]["explorer-1"]["journeys"]["class-5"] == flagship
                page.get_by_role("combobox", name="Local explorer", exact=True).select_option("explorer-1")
                section(page, "Expedition")
                assert journey(read_save(page)) == flagship
                solve_board(page)
                page.locator('[data-action="launch"]').click()
                expect(page.locator(".sa-world-art canvas")).to_have_attribute("data-ready", "true", timeout=FLIGHT_WAIT)
                assert journey(read_save(page))["expedition"]["visits"] == ["milky_way"]
                page.get_by_role("combobox", name="Learning grade", exact=True).select_option("pp1")
                assert journey(read_save(page)) == capsule
                section(page, "Passport")
                expect(page.locator(".sa-world-tile.is-discovered")).to_have_count(1)
                expect(page.locator('[data-world="milky_way"]')).to_be_enabled()
                section(page, "Expedition")
                expect(page.locator(".sa-world-tile")).to_have_count(3)
                assert not page.locator('[data-world="milky_way"]').count()
                assert current_activity(page) == capsule["expedition"]["activity"]
                page.get_by_role("combobox", name="Local explorer", exact=True).select_option("explorer-2")
                section(page, "Passport")
                expect(page.locator(".sa-world-tile.is-discovered")).to_have_count(0)
                assert journey(read_save(page)) == second_flagship
                return {"directStart": "Class 5 without PP1 progress",
                        "gradeIsolation": "PP1 picture collection and Class 5 probe assignments retained independently",
                        "explorerIsolation": "Second explorer has its own unfitted craft, board, charges and empty Passport",
                        "sharedPassport": "Explorer 1's real Class 5 Milky Way arrival is visible from PP1 without adding it to the PP1 route"}

        def free_retained_revisit():
            with session(reduced=True) as (_, page):
                open_game(page, base)
                write_fixture(page, layout_fixture(page, 6, grade="pp1"))
                open_game(page, base)
                before = journey(read_save(page))
                assert before["charges"] == 0 and len(before["visits"]) == 6 and len(before["fitted"]) == 6
                section(page, "Passport")
                expect(page.locator(".sa-world-tile.is-discovered")).to_have_count(6)
                page.get_by_role("combobox", name="Learning grade", exact=True).select_option("pp2")
                section(page, "Passport")
                expect(page.locator(".sa-world-tile.is-discovered")).to_have_count(6)
                page.get_by_role("combobox", name="Learning grade", exact=True).select_option("pp1")
                section(page, "Expedition")
                expect(page.locator(".sa-expedition-checklist")).to_contain_text("Free revisit.")
                solve_board(page)
                expect(page.locator('[data-action="launch"]')).to_be_enabled()
                page.locator('[data-action="launch"]').click()
                expect(page.locator(".sa-world-art canvas")).to_have_attribute("data-ready", "true", timeout=FLIGHT_WAIT)
                after = journey(read_save(page))
                assert after["charges"] == 0 and after["visits"] == before["visits"]
                assert after["expedition"]["visits"] == ["earth"] and after["expedition"]["paid"] == []
                section(page, "Passport")
                expect(page.locator(".sa-world-tile.is-discovered")).to_have_count(6)
                open_game(page, base)
                assert journey(read_save(page)) == after
                return {"legacyFixture": "Frozen v1 reducer earned six PP1 systems and visited six original worlds",
                        "checks": ["global legacy Passport is shared across grades", "zero-charge objective revisit enabled by solved board",
                                   "no duplicate discovery", "no extra debit", "legacy visits untouched", "new expedition visit retained after reload"]}

        def modern_complete_passport():
            with session(reduced=True) as (_, page):
                open_game(page, base)
                campaigns = page.evaluate("import('/js/space-academy/campaigns.mjs').then(module => Object.values(module.CAMPAIGNS))")
                save = None
                for campaign in campaigns:
                    save = campaign_fixture(page, campaign["grade"], save=save)
                    save = advance_campaign_fixture(page, save, len(campaign["stages"]))
                write_fixture(page, save)
                open_game(page, base)
                section(page, "Passport")
                expect(page.locator(".sa-world-tile.is-discovered")).to_have_count(30)
                expect(page.locator(".sa-passport")).to_contain_text("All 30 discoveries are yours!")
                expect(page.locator(".sa-passport-region")).to_have_count(7)
                assert not page.locator(".sa-world-tile:disabled").count()
                geometry(page)
                page.screenshot(path=str(output / "modern-all-seven-complete-passport.png"))
                worlds = page.evaluate("import('/js/space-academy/destinations.mjs').then(module => module.DESTINATIONS)")
                for world in worlds:
                    page.locator(f'[data-action="world"][data-world="{world["id"]}"]').click()
                    expect(page.locator("#academy")).to_have_attribute("data-screen", "discovery")
                    expect(page.locator("#sa-focus")).to_have_text(world["name"])
                    expect(page.locator(".sa-world-art canvas")).to_have_attribute("data-ready", "true", timeout=12000)
                    expect(page.locator(".sa-discovery-feature")).to_contain_text(world["fact"])
                    geometry(page)
                    page.get_by_role("button", name="Back to my worlds", exact=True).click()
                    expect(page.locator("#academy")).to_have_attribute("data-screen", "passport")
                for campaign in campaigns:
                    section(page, "Passport")
                    page.locator(f'[data-action="campaign-grade"][data-grade="{campaign["grade"]}"]').click()
                    expect(page.locator("#academy")).to_have_attribute("data-screen", "missions")
                    expect(page.locator(".sa-launchpad-heading")).to_contain_text(campaign["title"])
                    section(page, "Expedition")
                    expect(page.locator(".sa-campaign-complete")).to_be_visible()
                    expect(page.locator(".sa-world-tile")).to_have_count(len(campaign["destinations"]))
                    assert journey(read_save(page))["expedition"]["visits"] == campaign["destinations"]
                page.get_by_role("combobox", name="Local explorer", exact=True).select_option("explorer-2")
                section(page, "Passport")
                expect(page.locator(".sa-world-tile.is-discovered")).to_have_count(0)
                return {"completedModernCampaigns": [campaign["title"] for campaign in campaigns],
                        "uniquePassportObjects": 30, "otherExplorerPassportObjects": 0,
                        "actualArtAndFactInspections": [world["id"] for world in worlds],
                        "fixture": "Current reducer completed all chapter objectives and all seven campaigns with independent puzzle solutions; each board's real UI is verified separately"}

        def campaign_save_failure():
            with session(reduced=True) as (_, page):
                open_game(page, base)
                write_fixture(page, campaign_fixture(page, "pp1"))
                open_game(page, base)
                section(page, "Expedition")
                moves = activity_solution(current_activity(page))
                activity_move(page, moves[0])
                before = read_save(page)
                page.evaluate(FAULTS)
                page.evaluate("window.__academyFault = {method:'put',key:'save'}")
                activity_control(page, moves[1]["type"], moves[1].get("value")).click()
                expect(page.locator("#academy")).to_have_attribute("data-screen", "storage-error")
                assert read_save(page) == before
                page.evaluate("window.__academyFault = null")
                page.get_by_role("button", name="Try opening the save again", exact=True).click()
                expect(page.locator("#academy")).to_have_attribute("data-screen", "missions")
                section(page, "Expedition")
                assert current_activity(page) == journey(before)["expedition"]["activity"]
                for move in moves[1:]:
                    activity_move(page, move)
                expect(page.locator('[data-action="launch"]')).to_be_enabled()
                return {"result": "A failed board write blocks play, retains the last persisted partial model and all charges, and resumes correctly after explicit retry"}

        def campaign_multi_tab():
            with session(reduced=True) as (context, first):
                open_game(first, base)
                write_fixture(first, campaign_fixture(first, "pp1"))
                open_game(first, base)
                section(first, "Expedition")
                second = context.new_page()
                open_game(second, base)
                section(second, "Expedition")
                moves = activity_solution(current_activity(first))
                activity_move(first, moves[0])
                activity_control(second, moves[1]["type"], moves[1].get("value")).click()
                expect(second.locator("#sa-notice")).to_contain_text("Your action was not applied")
                assert current_activity(second)["state"]["selected"] == [moves[0]["value"]]
                section(second, "Expedition")
                activity_move(second, moves[1])
                activity_control(first, "reset").click()
                expect(first.locator("#sa-notice")).to_contain_text("Your action was not applied")
                assert current_activity(first)["state"]["selected"] == [moves[0]["value"], moves[1]["value"]]
                assert read_save(first) == read_save(second)
                return {"result": "Stale board selection and stale Reset both abort instead of overwriting another tab's committed activity"}

        def campaign_fullscreen():
            checked = {}
            for grade_id in ["class-1", "class-4", "class-5"]:
                with session(size=(844, 390), reduced=True) as (_, page):
                    open_game(page, base)
                    write_fixture(page, campaign_fixture(page, grade_id))
                    open_game(page, base)
                    section(page, "Expedition")
                    page.get_by_role("button", name="Toggle full screen", exact=True).click()
                    page.wait_for_function("document.fullscreenElement?.id === 'academy'")
                    initial = current_activity(page)
                    disclosure = activity_instructions(page, grade_id)
                    page.locator(".sa-activity").scroll_into_view_if_needed()
                    rover = spatial_rover(page) if grade_id == "class-1" else None
                    name = {"class-1": "rover", "class-4": "station", "class-5": "command"}[grade_id]
                    if grade_id == "class-1":
                        page.screenshot(path=str(output / f"{name}-board-initial-fullscreen-844x390.png"))
                    for move in activity_solution(initial):
                        control = activity_control(page, move["type"], move.get("value"))
                        control.scroll_into_view_if_needed()
                        before = page.locator(".sa-content").evaluate("node => node.scrollTop")
                        activity_move(page, move)
                        expect(activity_control(page, move["type"], move.get("value"))).to_be_focused()
                        after = page.locator(".sa-content").evaluate("node => node.scrollTop")
                        assert abs(after - before) <= 2, {"grade": grade_id, "move": move,
                                                         "scrollBefore": before, "scrollAfter": after}
                    expect(page.locator('[data-action="launch"]')).to_be_enabled()
                    metrics = geometry(page)
                    if grade_id == "class-1":
                        metrics["spatialRover"] = {"initial": rover, "solved": spatial_rover(page)}
                    activity_surface(page, initial["kind"]).scroll_into_view_if_needed()
                    page.screenshot(path=str(output / f"{name}-board-controls-fullscreen-844x390.png"))
                    page.locator('[data-action="launch"]').scroll_into_view_if_needed()
                    page.screenshot(path=str(output / f"{name}-board-fullscreen-844x390.png"))
                    page.get_by_role("button", name="Toggle full screen", exact=True).click()
                    page.wait_for_function("!document.fullscreenElement")
                    assert current_activity(page)["model"] == initial["model"]
                    expect(page.locator('[data-action="launch"]')).to_be_enabled()
                    checked[grade_id] = {"kind": initial["kind"], "geometry": metrics, "disclosure": disclosure}
            return {"viewport": [844, 390], "fullscreen": "Actual Fullscreen API entered and exited",
                    "boards": checked,
                    "checks": ["complete rover, station and galaxy-command boards through visible controls in short landscape",
                               "spatial rover retains full tile descriptions, single footer controls and a board no taller than 318.5px",
                               "selection, rotation, placements and assignments preserve focused control and fullscreen content scroll",
                               "solved states remain after leaving fullscreen"]}

        def phone_near_arrival():
            with session(size=(390, 844)) as (_, page):
                open_game(page, base)
                write_fixture(page, campaign_fixture(page, "class-1"))
                open_game(page, base)
                section(page, "Expedition")
                solve_board(page)
                charges = journey(read_save(page))["charges"]
                page.locator('[data-action="launch"]').click()
                expect(page.locator("[data-flight]")).to_be_visible()
                page.locator("[data-flight]").scroll_into_view_if_needed()
                page.wait_for_function("Number(document.querySelector('[data-flight]')?.dataset.elapsed) >= 7650", timeout=FLIGHT_WAIT)
                page.get_by_role("button", name="Pause flight", exact=True).click()
                expect(page.get_by_role("button", name="Resume flight", exact=True)).to_be_visible()
                elapsed = int(page.locator("[data-flight]").get_attribute("data-elapsed"))
                assert 7650 <= elapsed < 8500, elapsed
                assert page.locator("[data-flight]").get_attribute("data-phase") == "arrive"
                page.wait_for_timeout(650)
                assert int(page.locator("[data-flight]").get_attribute("data-elapsed")) == elapsed
                metrics = geometry(page)
                flight = metrics["flight"][0]
                assert flight["left"] - 1 <= flight["craft"]["left"]
                assert flight["craft"]["right"] <= flight["right"] + 1, flight
                assert flight["craft"]["width"] >= 100, flight
                assert flight["top"] - 1 <= flight["craft"]["top"]
                assert flight["craft"]["bottom"] <= flight["bottom"] + 1, flight
                page.screenshot(path=str(output / "flight-near-arrival-class-1-390x844.png"))
                page.get_by_role("button", name="Resume flight", exact=True).click()
                expect(page.locator(".sa-world-art canvas")).to_have_attribute("data-ready", "true", timeout=12000)
                assert journey(read_save(page))["expedition"]["visits"] == ["mars"]
                assert journey(read_save(page))["charges"] == charges - 1
                geometry(page)
                return {"viewport": [390, 844], "pausedActiveMilliseconds": elapsed, "geometry": metrics,
                        "checks": ["real rover-plus-carrier flight beyond 90% active time",
                                   "paused beyond its remaining duration", "wide craft remains inside flight bounds",
                                   "no document overflow", "visible resume arrives with one charge debit"]}

        def responsive(size):
            with session(size=size) as (_, page):
                open_game(page, base)
                metrics = {"missions": geometry(page)}
                if size in [(1366, 768), (390, 844), (844, 390)]:
                    page.screenshot(path=str(output / f"missions-{size[0]}x{size[1]}.png"))
                start(page, "Start Measure the mission")
                metrics["question"] = geometry(page)
                expect(page.locator(".sa-v2-picture > svg").first).to_be_visible()
                assert page.locator(".sa-v2-picture > svg").first.bounding_box()["width"] >= min(220, size[0] - 120)
                answer_current(page, correct=False, hint=True)
                if size in [(1366, 768), (390, 844), (844, 390)]:
                    page.screenshot(path=str(output / f"question-{size[0]}x{size[1]}.png"))
                fixture = layout_fixture(page, 0, fitted=False)
                write_fixture(page, fixture)
                open_game(page, base)
                section(page, "Craft lab")
                metrics["workshop"] = geometry(page)
                assert page.locator(".sa-assembly").bounding_box()["width"] >= 230
                if size[0] <= 600:
                    select_part(page, "engine").tap()
                    page.locator('[data-action="fit-selected"]').tap()
                else:
                    source = select_part(page, "engine")
                    target = part_slot(page, "engine")
                    page.locator(".sa-workbench-layout").evaluate(
                        "node => scrollTo({top:scrollY + node.getBoundingClientRect().top - 85,behavior:'instant'})")
                    a, b = source.bounding_box(), target.bounding_box()
                    if a["y"] >= 65 and b["y"] + b["height"] <= size[1]:
                        for control in [source, target]:
                            assert control.evaluate("""node => {
                              const box = node.getBoundingClientRect();
                              return node.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
                            }""")
                        page.mouse.move(a["x"] + a["width"] / 2, a["y"] + a["height"] / 2)
                        page.mouse.down()
                        page.mouse.move(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2, steps=14)
                        page.mouse.up()
                        expect(page.locator(".sa-slot.is-fitted")).to_have_count(1)
                    else:
                        source.click()
                        page.locator('[data-action="fit-selected"]').click()
                assert journey(read_save(page))["fitted"] == ["engine"]
                selected_name = select_part(page, "body").get_attribute("aria-label").removeprefix("Select ")
                select_part(page, "body").click()
                expect(page.locator(".sa-fit-control")).to_contain_text("Fit " + selected_name)
                if size in [(1366, 768), (390, 844), (844, 390)]:
                    page.screenshot(path=str(output / f"workshop-{size[0]}x{size[1]}.png"))
                page.get_by_role("button", name="Help & saves", exact=True).click()
                expect(page.get_by_role("dialog")).to_be_visible()
                metrics["dialog"] = geometry(page)
                page.get_by_role("button", name="Close dialog", exact=True).click()
                page.get_by_role("button", name="Toggle full screen", exact=True).click()
                page.wait_for_function("document.fullscreenElement?.id === 'academy'")
                metrics["fullscreen"] = geometry(page)
                assert page.locator("#academy").bounding_box()["height"] == size[1]
                page.get_by_role("button", name="Help & saves", exact=True).click()
                expect(page.get_by_role("dialog")).to_be_visible()
                page.get_by_role("button", name="Close dialog", exact=True).click()
                page.get_by_role("button", name="Toggle full screen", exact=True).click()
                page.wait_for_function("!document.fullscreenElement")
                return {"viewport": size, "screens": metrics,
                        "fixture": "Reducer-generated earned parts for layout only; real earning is checked separately"}

        def flight_lifecycle():
            with session(size=(1280, 600)) as (context, host):
                fixture_url = base + "/__academy_lifecycle_fixture"
                context.route(fixture_url, lambda route: route.fulfill(
                    content_type="text/html",
                    body=f"""<!doctype html><html lang="en"><meta charset="utf-8">
                      <title>Academy offscreen lifecycle fixture</title>
                      <style>body{{margin:0}}iframe{{display:block;width:100%;height:600px;border:0}}
                      footer{{height:800px;display:grid;place-items:center}}</style>
                      <iframe name="academy-lifecycle" title="Real Space Academy" src="{base + GAME}" allowfullscreen></iframe>
                      <footer id="flight-offscreen-target">Scroll target outside the unchanged game frame</footer></html>"""))
                host.goto(fixture_url, wait_until="networkidle")
                page = host.frame(name="academy-lifecycle")
                assert page is not None
                open_game(page, base)
                write_fixture(page, layout_fixture(page, 0))
                open_game(page, base)
                section(page, "Expedition")
                solve_board(page)
                page.get_by_role("button", name="Launch to the next signal", exact=True).click()
                expect(page.locator("[data-flight]")).to_be_visible()
                page.wait_for_timeout(350)
                hidden_signal(page, True)
                before = int(page.locator("[data-flight]").get_attribute("data-elapsed"))
                held = page.locator("[data-flight]").evaluate(
                    "node => [node.dataset.phase, node.style.getPropertyValue('--flight-progress')].join('|')")
                page.wait_for_timeout(900)
                assert int(page.locator("[data-flight]").get_attribute("data-elapsed")) == before
                assert page.locator("[data-flight]").evaluate(
                    "node => [node.dataset.phase, node.style.getPropertyValue('--flight-progress')].join('|')") == held
                hidden_signal(page, False)
                page.wait_for_timeout(250)
                after = int(page.locator("[data-flight]").get_attribute("data-elapsed"))
                assert before < after < before + 450
                host.locator("#flight-offscreen-target").scroll_into_view_if_needed()
                page.wait_for_timeout(100)
                bounds = page.locator("[data-flight]").bounding_box()
                assert bounds["y"] + bounds["height"] < 0 or bounds["y"] > 600, bounds
                offscreen = int(page.locator("[data-flight]").get_attribute("data-elapsed"))
                page.wait_for_timeout(750)
                assert int(page.locator("[data-flight]").get_attribute("data-elapsed")) == offscreen
                host.locator('iframe[name="academy-lifecycle"]').scroll_into_view_if_needed()
                page.locator("[data-flight]").scroll_into_view_if_needed()
                page.wait_for_timeout(250)
                resumed = int(page.locator("[data-flight]").get_attribute("data-elapsed"))
                assert offscreen < resumed < offscreen + 450, {"offscreen": offscreen, "resumed": resumed}
                page.get_by_role("button", name="Help & saves", exact=True).click()
                paused = int(page.locator("[data-flight]").get_attribute("data-elapsed"))
                page.wait_for_timeout(550)
                assert int(page.locator("[data-flight]").get_attribute("data-elapsed")) == paused
                page.get_by_role("button", name="Close dialog", exact=True).click()
                page.locator("[data-flight]").scroll_into_view_if_needed()
                page.evaluate("dispatchEvent(new PageTransitionEvent('pagehide', {persisted:true}))")
                page.evaluate("dispatchEvent(new PageTransitionEvent('pageshow', {persisted:true}))")
                expect(page.locator("[data-flight]")).to_be_visible()
                host.emulate_media(reduced_motion="reduce")
                expect(page.locator(".sa-world-art canvas")).to_have_attribute("data-ready", "true")
                before = page.locator(".sa-world-art canvas").evaluate("node => node.toDataURL()")
                page.wait_for_timeout(250)
                assert page.locator(".sa-world-art canvas").evaluate("node => node.toDataURL()") == before
                host.emulate_media(reduced_motion="no-preference")
                page.wait_for_timeout(400)
                assert page.locator(".sa-world-art canvas").evaluate("node => node.toDataURL()") != before
                return {"hidden": "explicit document lifecycle signal, not an OS tab-switch claim",
                        "offscreen": "actual flight rectangle outside the outer viewport in a same-origin iframe fixture",
                        "fixture": "Only the scrollable host document is supplied by the checker; game page, assets, controls and persistence are unchanged production resources",
                        "checks": ["remaining active time", "help pause", "persisted page-event recovery",
                                   "runtime reduced-motion preference change", "static and animated atlas"]}

        FX_KINDS = """() => {
          window.__fxKinds = {};
          new MutationObserver(list => {
            for (const record of list) for (const node of record.addedNodes) {
              if (node.nodeType === 1 && node.parentNode?.classList?.contains('sa-fx-layer'))
                window.__fxKinds[node.className] = (window.__fxKinds[node.className] || 0) + 1;
            }
          }).observe(document.querySelector('#academy'), {childList: true, subtree: true});
        }"""

        def fit_effect(reduced):
            with session(size=(390, 844) if reduced else (1366, 768), reduced=reduced) as (_, page):
                open_game(page, base)
                write_fixture(page, campaign_fixture(page, "class-3", fitted=False))
                open_game(page, base)
                section(page, "Craft lab")
                page.evaluate(FX_KINDS)
                select_part(page, "engine").focus()
                page.keyboard.press("Enter")
                page.locator('[data-action="fit-selected"]').focus()
                page.keyboard.press("Enter")
                layer = page.locator(".sa-craft-assembly .sa-fx-layer")
                expect(layer).to_have_attribute("aria-hidden", "true")
                assert layer.evaluate("node => getComputedStyle(node).pointerEvents") == "none"
                expect(page.locator(".sa-craft-assembly .is-just-fitted")).to_have_count(0 if reduced else 1)
                page.wait_for_timeout(1700)
                kinds = page.evaluate("window.__fxKinds")
                if reduced:
                    assert set(kinds) == {"sa-fx-glow"}, kinds
                else:
                    assert kinds.get("sa-fx-spark", 0) >= 8 and kinds.get("sa-fx-steam", 0) >= 3, kinds
                    assert kinds.get("sa-fx-flash", 0) >= 1 and kinds.get("sa-fx-ring") == 1, kinds
                expect(page.locator(".sa-craft-assembly .sa-fx-layer > i")).to_have_count(0)
                expect(page.locator(".sa-craft-assembly .is-just-fitted")).to_have_count(0)
                assert journey(read_save(page))["fitted"] == ["engine"]
                return {"reduced": reduced, "particles": kinds,
                        "checks": ["fit by keyboard", "aria-hidden non-interactive layer", "soft glow only when reduced",
                                   "sparks, steam, flash and ring otherwise", "every particle and class cleaned up"]}

        def launch_stage(reduced):
            with session(size=(390, 844), reduced=reduced) as (_, page):
                open_game(page, base)
                write_fixture(page, campaign_fixture(page, "class-3"))
                open_game(page, base)
                section(page, "Expedition")
                solve_board(page)
                charges = journey(read_save(page))["charges"]
                if reduced:
                    page.locator('[data-action="launch"]').click()
                    expect(page.locator(".sa-world-art canvas")).to_have_attribute("data-ready", "true", timeout=6000)
                    assert len(journey(read_save(page))["expedition"]["visits"]) == 1
                    return {"reduced": True, "checks": ["the 450 ms reduced-motion flight reaches the discovery"]}
                page.locator('[data-action="launch"]').click()
                flight = page.locator("[data-flight]")
                expect(flight).to_be_visible()
                expect(page.get_by_role("progressbar", name="Flight progress")).to_be_attached()
                page.evaluate("""() => {
                  const node = document.querySelector('[data-flight]');
                  window.__phases = [node.dataset.phase];
                  new MutationObserver(() => window.__phases.push(node.dataset.phase))
                    .observe(node, {attributes: true, attributeFilter: ['data-phase']});
                }""")
                page.wait_for_function("document.querySelector('[data-flight]')?.dataset.phase === 'liftoff'", timeout=FLIGHT_WAIT)
                assert flight.evaluate("""node => node.querySelector('.sa-flying-rocket')
                  .getAnimations({subtree: true}).some(item => item.playState === 'running')"""), "the flame is alive"
                phases = page.evaluate("window.__phases")
                order = ["countdown", "ignite", "liftoff"]
                assert phases == order[order.index(phases[0]):], phases
                assert float(flight.evaluate("node => node.style.getPropertyValue('--flight-progress')")) > 0.3
                skip = page.get_by_role("button", name="Skip to arrival", exact=True)
                skip.focus()
                page.keyboard.press("Enter")
                expect(page.locator(".sa-world-art canvas")).to_have_attribute("data-ready", "true", timeout=6000)
                after = journey(read_save(page))
                assert len(after["expedition"]["visits"]) == 1 and after["charges"] == charges - 1, after["expedition"]
                return {"phases": phases,
                        "checks": ["countdown, ignite and liftoff arrive in order from the active clock",
                                   "running flame animation and progress meter", "Skip by keyboard arrives exactly once"]}

        def discovery_layout(size, visits):
            with session(size=size, reduced=True) as (_, page):
                open_game(page, base)
                write_fixture(page, layout_fixture(page, visits))
                open_game(page, base)
                section(page, "Passport")
                assert page.locator(".sa-world-tile.is-discovered").count() == visits
                if visits == 30:
                    expect(page.locator("#academy")).to_contain_text("30 / 30")
                    assert not page.get_by_role("button", name="Launch to the next signal", exact=True).count()
                passport_metrics = geometry(page)
                page.screenshot(path=str(output / f"passport-fixture-{visits}-{size[0]}x{size[1]}.png"))
                if visits >= 3:
                    page.get_by_role("button", name="International Space Station", exact=True).click()
                    expect(page.locator(".sa-world-art canvas")).to_have_attribute("data-ready", "true")
                    canvas = page.locator(".sa-world-art canvas")
                    assert canvas.evaluate("node => node.width > node.height")
                    assert journey(read_save(page))["visits"][-1] != "iss" or visits == 3
                    section(page, "Passport")
                    page.locator(".sa-world-tile.is-discovered").last.click()
                    expect(page.locator(".sa-world-art canvas")).to_have_attribute("data-ready", "true")
                assert page.locator(".sa-world-art").bounding_box()["width"] >= 250
                metrics = geometry(page)
                page.screenshot(path=str(output / f"map-fixture-{visits}-{size[0]}x{size[1]}.png"))
                return {"viewport": size, "discoveries": visits, "metrics": metrics, "passport": passport_metrics,
                        "fixture": "Authentic frozen pre-campaign reducer fixture migrated to the global Passport; not claimed UI-earned progress"}

        def storage_fault(method, key, startup):
            with session() as (_, page):
                page.goto(base + GAME, wait_until="networkidle")
                page.evaluate(FAULTS)
                if not startup:
                    enter_game(page)
                    start(page, "Start Add, subtract, investigate")
                    before = read_save(page)
                page.evaluate("fault => window.__academyFault = fault", {"method": method, "key": key})
                if startup:
                    enter_game(page)
                elif key == "probe":
                    page.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
                else:
                    question = journey(before)["active"]["mission"]["questions"][0]
                    page.get_by_role("group", name="Answer choices", exact=True).get_by_role("button").nth(question["correctIndex"]).click()
                expect(page.locator("#academy")).to_have_attribute("data-screen", "storage-error")
                expect(page.locator("#academy")).to_contain_text("not cleared your existing save")
                assert not page.locator(".sa-game-footer").count()
                page.evaluate("window.__academyFault = null")
                if not startup:
                    assert read_save(page) == before
                page.get_by_role("button", name="Try opening the save again", exact=True).click()
                expect(page.locator("#academy")).to_have_attribute("data-screen", "missions" if startup else "mission")
                return {"operation": method, "key": key, "stage": "startup" if startup else "later",
                        "result": "blocked without saved-success UI, data unchanged, explicit retry recovered"}

        def denied_storage():
            with session() as (context, page):
                context.add_init_script("Object.defineProperty(window,'indexedDB',{get(){throw new DOMException('Storage denied','SecurityError')}})")
                page.goto(base + GAME, wait_until="networkidle")
                enter_game(page)
                expect(page.locator("#academy")).to_have_attribute("data-screen", "storage-error")
                return {"result": "denied IndexedDB getter blocks launch without an unsaved game"}

        def corrupt_storage():
            with session() as (_, page):
                open_game(page, base)
                start(page, "Start Add, subtract, investigate")
                answer_current(page, correct=False)
                before = read_save(page)
                page.evaluate("""async () => {
                  const db = await new Promise(resolve => {
                    const request = indexedDB.open('otterly-space-academy', 1);
                    request.onsuccess = () => resolve(request.result);
                  });
                  await new Promise((resolve, reject) => {
                    const transaction = db.transaction('academy', 'readwrite');
                    const store = transaction.objectStore('academy');
                    const request = store.get('save');
                    request.onsuccess = () => store.put({...request.result,version:99}, 'save');
                    transaction.oncomplete = resolve;
                    transaction.onabort = () => reject(transaction.error);
                  });
                  db.close();
                }""")
                page.reload(wait_until="networkidle")
                enter_game(page)
                expect(page.locator("#academy")).to_have_attribute("data-screen", "storage-error")
                expect(page.locator("#academy")).to_contain_text("not a supported Space Academy save")
                after = read_save(page)
                assert after["version"] == 99 and after["explorers"] == before["explorers"]
                assert not page.locator(".sa-game-footer").count()
                return {"result": "unsupported stored data remained intact; no reset or saved-success fallback"}

        def random_failure():
            with session() as (context, page):
                context.add_init_script("""(() => {
                  const original = crypto.getRandomValues.bind(crypto);
                  window.__randomFail = false;
                  crypto.getRandomValues = array => {
                    if (window.__randomFail) throw new Error('Deliberate secure-random failure');
                    return original(array);
                  };
                })();""")
                open_game(page, base)
                start(page, "Start Add, subtract, investigate")
                answer_current(page, correct=True)
                section(page, "Missions")
                before = read_save(page)
                before_url = page.url
                page.evaluate("window.__randomFail = true")
                reveal_details(page.get_by_role("button", name="Start Add, subtract, investigate",
                                                exact=True, include_hidden=True)).click()
                expect(page.locator("#sa-notice")).to_contain_text("The set could not be started")
                assert read_save(page) == before and page.url == before_url
                assert not page.get_by_role("dialog").count()
                page.evaluate("window.__randomFail = false")
                start(page, "Start Add, subtract, investigate")
                assert journey(read_save(page))["active"]["mission"]["id"] != journey(before)["active"]["mission"]["id"]
                return {"result": "failed randomness visibly preserved the existing set, answers and URL; retry recovered"}

        def multi_tab():
            with session() as (context, first):
                open_game(first, base)
                second = context.new_page()
                open_game(second, base)
                start(first, "Start Add, subtract, investigate")
                second.get_by_role("combobox", name="Learning grade", exact=True).select_option("class-2")
                expect(second.locator("#sa-notice")).to_contain_text("Your action was not applied")
                expect(second.locator("#academy")).to_have_attribute("data-screen", "mission")
                assert read_save(second)["explorers"]["explorer-1"]["grade"] == "class-1"
                question = journey(read_save(first))["active"]["mission"]["questions"][0]
                second.get_by_role("group", name="Answer choices", exact=True).get_by_role("button").nth(question["correctIndex"]).click()
                expect(second.locator(".sa-feedback")).to_be_visible()
                first.get_by_role("button", name="Give me a hint", exact=True).click()
                expect(first.locator("#sa-notice")).to_contain_text("Your action was not applied")
                assert journey(read_save(first))["active"]["answers"][0]["hinted"] is False
                assert read_save(first) == read_save(second)
                return {"result": "stale grade and hint writes aborted; both tabs loaded the committed answer"}

        def speech_and_input():
            with session(size=(800, 1000)) as (_, page):
                open_game(page, base)
                page.evaluate("""() => {
                  window.__speechCalls = {speak:0,cancel:0};
                  for (const method of ['speak','cancel']) {
                    const original = speechSynthesis[method].bind(speechSynthesis);
                    speechSynthesis[method] = (...args) => {window.__speechCalls[method]++; return original(...args);};
                  }
                }""")
                start(page, "Start Shapes in space")
                page.get_by_role("button", name="Read question aloud", exact=True).click()
                assert page.evaluate("window.__speechCalls.speak") == 1
                cancelled = page.evaluate("window.__speechCalls.cancel")
                section(page, "Missions")
                assert page.evaluate("window.__speechCalls.cancel") > cancelled
                start(page, "Start Shapes in space")
                page.get_by_role("button", name="Read question aloud", exact=True).click()
                cancelled = page.evaluate("window.__speechCalls.cancel")
                hidden_signal(page, True)
                assert page.evaluate("window.__speechCalls.cancel") > cancelled
                hidden_signal(page, False)
                stop = page.locator('[data-action="stop-speech"]')
                expect(stop).to_be_hidden()
                page.evaluate("speechSynthesis.pause()")
                try:
                    page.get_by_role("button", name="Read question aloud", exact=True).click()
                    expect(stop).to_be_visible()
                    cancelled = page.evaluate("window.__speechCalls.cancel")
                    stop.click()
                    assert page.evaluate("window.__speechCalls.cancel") > cancelled
                    expect(stop).to_be_hidden()
                finally:
                    page.evaluate("speechSynthesis.resume()")
                page.evaluate("document.documentElement.style.fontSize='200%'")
                geometry(page)
                page.get_by_role("button", name="Help & saves", exact=True).click()
                expect(page.get_by_role("dialog")).to_be_visible()
                page.keyboard.press("Escape")
                expect(page.get_by_role("dialog")).to_have_count(0)
                return {"speech": "real speak/cancel APIs invoked; visible Stop cancels a natively paused queued utterance; audio hardware and voice quality not assessed",
                        "accessibility": "200% text, keyboard, Escape and labelled answer controls"}

        def art_failure():
            path = "/games/clockmaster/art/universe/earth-atlas.webp"
            with session(reduced=True, expected_resources=(path,)) as (context, page):
                context.route("**" + path, lambda route: route.fulfill(status=503, body="Deliberately unavailable atlas"))
                open_game(page, base)
                write_fixture(page, layout_fixture(page, 1))
                open_game(page, base)
                section(page, "Passport")
                page.locator('[data-action="world"][data-world="earth"]').click()
                expect(page.locator("#sa-art-notice")).to_contain_text("could not load")
                assert page.locator(".sa-world-art img").evaluate("node => node.naturalWidth > 0 && getComputedStyle(node).opacity === '1'")
                assert not page.locator('.sa-world-art canvas[data-ready="true"]').count()
                return {"expectedFailure": "only earth-atlas.webp returned deliberate HTTP 503",
                        "result": "visible animation error with real still art and readable discovery, no fake animation success"}

        def static_discovery():
            with session(size=(390, 844), javascript=False) as (_, page):
                routes = ["/learn/olympiad/", "/learn/olympiad/pp1/",
                          "/learn/olympiad/pp1/counting.html",
                          "/learn/olympiad/class-5/", "/learn/olympiad/class-5/geometry.html"]
                for route in routes:
                    response = page.goto(base + route, wait_until="networkidle")
                    assert response.status == 200
                    expect(page.locator("h1")).to_be_visible()
                    assert page.locator('link[rel="canonical"]').get_attribute("href") == "https://otterlygames.com" + route
                    if route.endswith(".html"):
                        expect(page.locator(".sa-guide-sample")).to_have_count(3)
                        method = page.locator("[data-lesson-method]").first
                        method.locator("summary").click()
                        expect(method).to_have_attribute("open", "")
                        expect(method.locator("p").first).to_be_visible()
                    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
                page.screenshot(path=str(output / "nojs-worked-chapter-mobile.png"))
                page.goto(base + GAME, wait_until="networkidle")
                expect(page.locator(".sa-noscript")).to_contain_text("grade and chapter collection")
                expect(page.get_by_role("link", name="grade and chapter collection", exact=True)).to_be_visible()
                return {"noJavaScript": routes, "result": "real samples, methods, grade links and game fallback remain readable"}

        record("real-earning-assembly-flight-backups", end_to_end)
        record("all-grades-chapters-levels-modes-links", grade_modes)
        record("class-5-paper-full-completion", paper_completion)
        record("legacy-v1-backup-resume-and-new-bank", legacy_backup)
        record("legacy-v1-bank-v1-atomic-migration",
               lambda: atomic_legacy_migration("space-academy-v1-save.json"))
        record("pre-campaign-root-v1-bank-v2-atomic-migration",
               lambda: atomic_legacy_migration("space-academy-pre-campaign-save.json"))
        record("pre-campaign-backup-restore-atomic-resume", pre_campaign_restore_resume)
        for grade_id in ["pp1", "pp2", "class-1", "class-2", "class-3", "class-4", "class-5"]:
            record(f"campaign-board-{grade_id}", lambda grade_id=grade_id: campaign_board(grade_id))
        for size in SIZES:
            record(f"campaign-responsive-{size[0]}x{size[1]}", lambda size=size: campaign_responsive(size))
        for size in [(1366, 768), (390, 844), (844, 390)]:
            record(f"campaign-late-final-{size[0]}x{size[1]}", lambda size=size: late_campaign(size))
        record("campaign-grade-explorer-shared-passport", passport_isolation)
        record("campaign-free-retained-passport-revisit", free_retained_revisit)
        record("campaign-modern-all-seven-complete-passport", modern_complete_passport)
        record("campaign-board-write-failure-resume", campaign_save_failure)
        record("campaign-board-multi-tab-conflicts", campaign_multi_tab)
        record("campaign-board-fullscreen-short-landscape", campaign_fullscreen)
        record("campaign-phone-near-end-flight", phone_near_arrival)
        record("graphical-answers-feedback-review-reload", visual_answer_flow)
        for size in [(1366, 768), (390, 844), (844, 390)]:
            record(f"visual-curriculum-{size[0]}x{size[1]}", lambda size=size: visual_curriculum(size))
        for size in SIZES:
            record(f"responsive-{size[0]}x{size[1]}", lambda size=size: responsive(size))
        record("flight-hidden-offscreen-dialog-restoration-motion", flight_lifecycle)
        record("flight-fit-effect-keyboard-cleanup", lambda: fit_effect(False))
        record("flight-fit-effect-reduced-motion", lambda: fit_effect(True))
        record("flight-launch-stage-phases-keyboard-skip", lambda: launch_stage(False))
        record("flight-launch-stage-reduced-motion", lambda: launch_stage(True))
        for visits in [3, 29, 30]:
            for size in [(1366, 768), (390, 844), (844, 390)]:
                record(f"discovery-fixture-{visits}-{size[0]}x{size[1]}",
                       lambda size=size, visits=visits: discovery_layout(size, visits))
        record("storage-startup-denied", denied_storage)
        record("storage-corrupt-version-preserved", corrupt_storage)
        for method, key in [("get", "save"), ("put", "probe"), ("delete", "probe")]:
            record(f"storage-startup-{method}-{key}", lambda method=method, key=key: storage_fault(method, key, True))
        for method, key in [("get", "save"), ("put", "save"), ("put", "probe"), ("delete", "probe")]:
            record(f"storage-later-{method}-{key}", lambda method=method, key=key: storage_fault(method, key, False))
        record("multi-tab-conflicts", multi_tab)
        record("fresh-random-failure-preserves-set", random_failure)
        record("speech-keyboard-text-zoom", speech_and_input)
        record("missing-animation-explicit-fallback", art_failure)
        record("static-nojs-worked-discovery", static_discovery)
        browser.close()
    failed = [result for result in results if not result["passed"]]
    summary = {"passed": len(results) - len(failed), "failed": len(failed), "output": str(output)}
    (output / "summary.json").write_text(json.dumps({
        **summary, "failedCases": [result["name"] for result in failed], "viewports": SIZES,
        "entryPoint": base + GAME, "results": str(output / "results.json"),
    }, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 1 if failed or not results else 0


if __name__ == "__main__":
    raise SystemExit(run())
