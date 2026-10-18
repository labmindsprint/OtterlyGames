"""Exercise real Arcade touch/keyboard input, camera mapping and installation discovery."""

import argparse
import json
import math
import re
import traceback
from contextlib import contextmanager
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SIZES = [(1366, 768), (1440, 900), (1920, 1080), (1280, 600),
         (800, 1000), (390, 844), (844, 390), (320, 740)]
GAMES = {
    "game": ("START GAME", "throw", "Space"),
    "pigeon": ("START PATROL", "drop", "Space"),
    "shepherd": ("Start herding", "bark", "Space"),
    "zombie": ("Start maze", "spike", "Digit1"),
}
SNAPSHOTS = {
    "game": """({x:player.x,y:player.y,timer:player.throwCooldown,
        shots:shurikens.length,kills:totalKills,coins,hp:player.hp})""",
    "pigeon": """({x:player.x,y:player.y,timer:game.t,
        shots:poops.length,ammo:game.ammo,lives:game.lives})""",
    "shepherd": """({x:dog.x,y:dog.y,timer:barkTimer,
        barks:totalBarks,fetchUses,treatUses,howlUses,score})""",
    "zombie": """({x:player.x,y:player.y,timer:activeTime,
        traps:traps.length,sneaking:player.sneaking})""",
}


class Touch:
    def __init__(self, context, page):
        self.session = context.new_cdp_session(page)
        self.page = page

    def point(self, selector, dx=0, dy=0, identity=1):
        element = self.page.locator(selector)
        expect(element).to_be_visible()
        box = element.bounding_box()
        return {"x": box["x"] + box["width"] / 2 + dx,
                "y": box["y"] + box["height"] / 2 + dy,
                "id": identity, "radiusX": 8, "radiusY": 8, "force": 1}

    def send(self, kind, points):
        self.session.send("Input.dispatchTouchEvent", {"type": kind, "touchPoints": points})

    def end(self):
        self.send("touchEnd", [])


def run():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:4196")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--only", default="", help="Regex matching case names")
    args = parser.parse_args()
    output = args.output.resolve()
    if output == ROOT or ROOT in output.parents:
        parser.error("--output must be outside the repository")
    output.mkdir(parents=True, exist_ok=True)
    base = args.url.rstrip("/")
    results = []

    def record(name, callback):
        if args.only and not re.search(args.only, name):
            return
        try:
            result = {"name": name, "passed": True, **(callback() or {})}
        except Exception as error:
            result = {"name": name, "passed": False, "error": str(error),
                      "traceback": traceback.format_exc()}
        results.append(result)
        (output / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
        print(("PASS " if result["passed"] else "FAIL ") + name, flush=True)
        if not result["passed"]:
            print(result["error"], flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()

        @contextmanager
        def fresh(route, size=(390, 844), javascript=True):
            context = browser.new_context(
                viewport={"width": size[0], "height": size[1]}, has_touch=size[0] <= 900,
                is_mobile=size[0] <= 900, reduced_motion="reduce", java_script_enabled=javascript)
            page = context.new_page()
            page.set_default_timeout(15000)
            issues, external = [], []
            page.on("pageerror", lambda e: issues.append(str(e)))
            page.on("console", lambda m: issues.append(m.text) if m.type == "error" else None)
            page.on("response", lambda r: issues.append(f"{r.status}: {r.url}") if r.status >= 400 else None)
            page.on("request", lambda r: external.append(r.url)
                    if not r.url.startswith((base + "/", "data:", "blob:")) else None)
            try:
                response = page.goto(base + route, wait_until="load")
                assert response.status == 200
                if javascript:
                    page.evaluate("document.fonts.ready")
                yield context, page
                assert not issues, issues
                assert not external, external
            except Exception:
                page.screenshot(path=str(output / ("FAIL-" + re.sub(r"\W", "-", route) +
                                                   f"-{size[0]}x{size[1]}.png")))
                raise
            finally:
                context.close()

        def start(page, slug):
            page.get_by_role("button", name=GAMES[slug][0], exact=False).click()
            expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "playing")

        def snapshot(page, slug):
            return page.evaluate(SNAPSHOTS[slug])

        def world_point(page, x, y):
            return page.locator("canvas").evaluate("""(canvas, point) => {
                const ctx=canvas.getContext('2d'), matrix=ctx.getTransform();
                const ratio=canvas.width/canvas.clientWidth;
                return {x:(point.x*matrix.a+matrix.e)/ratio,
                        y:(point.y*matrix.d+matrix.f)/ratio};
            }""", {"x": x, "y": y})

        def direction(page):
            return page.evaluate("""() => {
                if(typeof maze==='undefined') return {x:1,y:0,key:'ArrowRight'};
                for(const [dx,dy,key] of [[1,0,'ArrowRight'],[0,1,'ArrowDown']])
                    if(maze[1+dy][1+dx]===0) return {x:dx,y:dy,key};
                throw Error('No open route from maze spawn');
            }""")

        def matrix(slug, size):
            with fresh(f"/Arcade/{slug}.html", size) as (context, page):
                start(page, slug)
                step = direction(page)
                before = snapshot(page, slug)
                if size[0] <= 900:
                    touch = Touch(context, page)
                    touch.send("touchStart", [touch.point(".arcade-stick", step["x"] * 34, step["y"] * 34)])
                    page.wait_for_timeout(260)
                    touch.end()
                    page.wait_for_function("controls.direction.x===0 && controls.direction.y===0")
                    page.locator(f'[data-action="{GAMES[slug][1]}"]').tap()
                else:
                    page.keyboard.down(step["key"])
                    page.wait_for_timeout(260)
                    page.keyboard.up(step["key"])
                    page.keyboard.press(GAMES[slug][2])
                after = snapshot(page, slug)
                assert math.hypot(after["x"] - before["x"], after["y"] - before["y"]) > 5, (before, after)
                if slug == "game":
                    assert after["shots"] > 0, after
                elif slug == "pigeon":
                    assert after["shots"] > 0 and after["ammo"] < before["ammo"], after
                elif slug == "shepherd":
                    assert after["barks"] == before["barks"] + 1, after
                else:
                    assert after["traps"] == 1, after
                geometry = page.locator("canvas").evaluate("""canvas => {
                    const rect=canvas.getBoundingClientRect();
                    const ratio=canvas.width/canvas.clientWidth;
                    return {x:rect.x,y:rect.y,width:rect.width,height:rect.height,
                        scale:canvas.getContext('2d').getTransform().a/ratio,
                        overflow:document.documentElement.scrollWidth>innerWidth};
                }""")
                assert not geometry["overflow"], geometry
                assert geometry["x"] >= 0 and geometry["y"] >= 0, geometry
                assert geometry["x"] + geometry["width"] <= size[0] + 1, geometry
                assert geometry["y"] + geometry["height"] <= size[1] + 1, geometry
                if size[0] <= 900:
                    for control in page.locator(".arcade-stick,.arcade-action").all():
                        box = control.bounding_box()
                        assert box["width"] >= 44 and box["height"] >= 44, box
                        assert box["x"] >= 0 and box["y"] >= 0, box
                        assert box["x"] + box["width"] <= size[0] + 1, box
                        assert box["y"] + box["height"] <= size[1] + 1, box
                page.screenshot(path=str(output / f"{slug}-{size[0]}x{size[1]}-play.png"))
                page.get_by_role("button", name="Pause game", exact=True).click()
                dialog = page.get_by_role("dialog", name="Game paused")
                expect(dialog).to_be_visible()
                frozen = snapshot(page, slug)
                page.wait_for_timeout(220)
                assert snapshot(page, slug) == frozen
                dialog.get_by_role("button", name="Resume game", exact=True).click()
                expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "playing")
                expect(page.locator("canvas")).to_be_focused()
                return {"geometry": geometry, "movement": [before, after]}

        for slug in GAMES:
            for size in SIZES:
                record(f"matrix-{slug}-{size[0]}x{size[1]}", lambda g=slug, s=size: matrix(g, s))

        def lifecycle(slug):
            with fresh(f"/Arcade/{slug}.html") as (context, page):
                start(page, slug)
                step = direction(page)
                touch = Touch(context, page)
                points = [touch.point(".arcade-stick", step["x"] * 34, step["y"] * 34),
                          touch.point(f'[data-action="{GAMES[slug][1]}"]', identity=2)]
                touch.send("touchStart", points)
                page.wait_for_timeout(180)
                outside = page.locator("canvas").bounding_box()
                touch.send("touchMove", [
                    {**points[0], "x": outside["x"]+outside["width"]/2,
                     "y": outside["y"]+outside["height"]/2}, points[1],
                ])
                page.wait_for_timeout(50)
                touch.end()
                assert page.evaluate("controls.direction.x===0&&controls.direction.y===0")
                assert not page.evaluate(f"controls.held('{GAMES[slug][1]}')")
                touch.send("touchStart", points)
                page.wait_for_timeout(100)
                touch.send("touchCancel", [])
                assert page.evaluate("controls.direction.x===0&&controls.direction.y===0")
                assert not page.evaluate(f"controls.held('{GAMES[slug][1]}')")
                touch.send("touchStart", [touch.point(".arcade-stick", step["x"] * 34, step["y"] * 34)])
                page.wait_for_timeout(100)
                # Playwright keeps headless tabs visible/focused. Deliver the same
                # browser lifecycle signal explicitly; do not call the pause API.
                page.evaluate("""() => {
                    Object.defineProperty(document,'hidden',{configurable:true,value:true});
                    document.dispatchEvent(new Event('visibilitychange'));
                }""")
                expect(page.get_by_role("dialog", name="Game paused")).to_be_visible()
                touch.end()
                frozen = snapshot(page, slug)
                page.wait_for_timeout(300)
                assert snapshot(page, slug) == frozen
                assert page.evaluate("controls.direction.x===0&&controls.direction.y===0")
                page.evaluate("""() => {
                    delete document.hidden;
                    document.dispatchEvent(new Event('visibilitychange'));
                }""")
                page.get_by_role("dialog", name="Game paused").get_by_role("button", name="Resume game", exact=True).click()
                expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "playing")
                page.evaluate("window.dispatchEvent(new Event('blur'))")
                expect(page.get_by_role("dialog", name="Game paused")).to_be_visible()
                page.get_by_role("dialog", name="Game paused").get_by_role("button", name="Resume game", exact=True).click()
                expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "playing")
                page.get_by_role("button", name="How to play", exact=True).click()
                help_dialog = page.get_by_role("dialog", name="How to play")
                expect(help_dialog).to_be_visible()
                page.keyboard.press("Tab")
                page.keyboard.press("Tab")
                assert page.evaluate("!!document.activeElement.closest('.arcade-modal')")
                page.keyboard.press("Escape")
                expect(page.get_by_role("dialog", name="Game paused")).to_be_visible()
                # Repeated keydown must not undo a deliberate resume or pause.
                page.keyboard.down("p")
                expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "playing")
                page.keyboard.down("p")
                expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "playing")
                page.keyboard.up("p")
                page.keyboard.down("p")
                expect(page.get_by_role("dialog", name="Game paused")).to_be_visible()
                page.keyboard.down("p")
                expect(page.get_by_role("dialog", name="Game paused")).to_be_visible()
                page.keyboard.up("p")
                page.get_by_role("button", name="Restart this run", exact=True).click()
                if slug == "pigeon":
                    expect(page.locator("#overlay .mobile-instructions")).to_be_visible()
                    start(page, slug)
                else:
                    expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "playing")
                page.set_viewport_size({"width": 844, "height": 390})
                page.wait_for_timeout(150)
                if page.locator(".game-page").get_attribute("data-arcade-phase") == "paused":
                    page.get_by_role("dialog", name="Game paused").get_by_role("button", name="Resume game", exact=True).click()
                expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "playing")
                assert page.evaluate("controls.direction.x===0&&controls.direction.y===0")
                page.screenshot(path=str(output / f"{slug}-rotated.png"))
                page.get_by_role("button", name="How to play", exact=True).click()
                help_dialog = page.get_by_role("dialog", name="How to play")
                heading = help_dialog.get_by_role("heading", name="How to play", exact=True)
                expect(heading).to_be_focused()
                heading_bounds = heading.bounding_box()
                assert heading_bounds["y"] >= 0 and heading_bounds["y"] + heading_bounds["height"] <= 390
                page.screenshot(path=str(output / f"{slug}-landscape-help.png"))
                page.keyboard.press("End")
                expect(help_dialog.get_by_role("link", name="Back to all games")).to_be_in_viewport()
                page.keyboard.press("Escape")
                expect(page.get_by_role("dialog", name="Game paused")).to_be_visible()
                return {"lifecycleSignals": "explicitly emulated blur/visibility",
                        "touchInput": "CDP multi-contact release outside, cancel and hidden-held input"}

        for slug in GAMES:
            record(f"lifecycle-{slug}", lambda g=slug: lifecycle(g))

        def aimed_pigeon():
            with fresh("/Arcade/pigeon.html") as (_, page):
                start(page, "pigeon")
                before = snapshot(page, "pigeon")
                target = world_point(page, before["x"] + 90, 500)
                page.locator("canvas").tap(position=target)
                shot = page.evaluate("({...poops.at(-1)})")
                assert shot["aimed"] and shot["vx"] > 0, shot
                assert page.evaluate("game.ammo") == before["ammo"] - 1
                initial_x = shot["x"]
                page.wait_for_timeout(180)
                assert page.evaluate("poops.at(-1).x") > initial_x
                page.keyboard.press("Space")
                assert page.evaluate("!poops.at(-1).aimed")

        record("touch-pigeon-aim", aimed_pigeon)

        def dog_abilities():
            with fresh("/Arcade/shepherd.html") as (_, page):
                start(page, "shepherd")
                for action, expression in [
                    ("bark", "totalBarks===1&&barkTimer>0"),
                    ("wag", "wagTimer>0"), ("dash", "dashActive>0"),
                    ("treat", "treatUses===1&&treats.length===1"),
                    ("howl", "howlUses===0&&howlAnim!==null")]:
                    page.locator(f'[data-action="{action}"]').tap()
                    assert page.evaluate(expression), action
                expect(page.locator('[data-action="howl"]')).to_be_disabled()
                page.locator('[data-action="fetch"]').tap()
                expect(page.get_by_role("status")).to_have_text("Tap a spot on the field to throw the ball.")
                target = page.evaluate("({x:dog.x-40,y:dog.y-80})")
                page.locator("canvas").tap(position=world_point(page, target["x"], target["y"]))
                assert page.evaluate("fetchUses===1&&balls.length===1&&balls[0].vx<0&&balls[0].vy<0")
                # A position fixture isolates the new touch nudge from random sheep placement.
                target = page.evaluate("""() => {
                    Object.assign(sheep[0],{x:dog.x+24,y:dog.y,vx:0,vy:0,dead:false,lost:false,grabbed:false});
                    return {x:sheep[0].x,y:sheep[0].y};
                }""")
                page.locator("canvas").tap(position=world_point(page, target["x"], target["y"]))
                assert page.evaluate("dog.nudgeTarget!==null")
                page.get_by_role("button", name="Pause game", exact=True).click()
                frozen = page.evaluate("({barkTimer,wagTimer,dashTimer,fetchTimer,treatTimer,howlTimer})")
                page.wait_for_timeout(500)
                assert page.evaluate("({barkTimer,wagTimer,dashTimer,fetchTimer,treatTimer,howlTimer})") == frozen

        record("touch-shepherd-abilities", dog_abilities)

        def dog_results():
            with fresh("/Arcade/shepherd.html") as (_, page):
                start(page, "shepherd")
                # Result/intermission fixtures target the new DOM menus and pause UI.
                for state_name, title in [
                    ("WIN", "You protected the flock!"),
                    ("GAMEOVER", "Give the flock another try"),
                ]:
                    page.evaluate(f"state=S.{state_name};score=225;sheepSaved=6")
                    dialog = page.get_by_role("dialog", name=title, exact=True)
                    expect(dialog).to_be_visible()
                    dialog.get_by_role("button", name="Play again").click()
                    expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "playing")
                    assert page.evaluate("score===0&&wave===0&&fetchUses===2&&howlUses===1")
                page.evaluate("state=S.BETWEEN;betweenTimer=2")
                expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "between")
                page.get_by_role("button", name="Pause game", exact=True).click()
                expect(page.get_by_role("dialog", name="Game paused")).to_be_visible()
                frozen = page.evaluate("betweenTimer")
                page.wait_for_timeout(300)
                assert page.evaluate("betweenTimer") == frozen
                page.get_by_role("dialog", name="Game paused").get_by_role("button", name="Resume game", exact=True).click()
                expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "between")

        record("menu-shepherd-results-intermission", dog_results)

        def original_result(slug, size):
            with fresh(f"/Arcade/{slug}.html", size) as (_, page):
                start(page, slug)
                # Outcome/stat fixtures exercise the original result UI and real replay buttons.
                if slug == "game":
                    page.evaluate("coins=20;totalKills=12;level=3;gameOver()")
                    expect(page.get_by_role("heading", name=re.compile("Game Over"))).to_be_visible()
                    retry = page.get_by_role("button", name="TRY AGAIN", exact=True)
                else:
                    page.evaluate("game.score=120;game.stops=2;game.lives=0;game.wave=3;gameOver()")
                    expect(page.get_by_role("heading", name="Patrol Ended", exact=True)).to_be_visible()
                    retry = page.get_by_role("button", name="FLY AGAIN", exact=False)
                retry.scroll_into_view_if_needed()
                bounds = retry.bounding_box()
                assert bounds["width"] >= 44 and bounds["height"] >= 44, bounds
                assert bounds["x"] >= 0 and bounds["x"] + bounds["width"] <= size[0] + 1, bounds
                assert bounds["y"] >= 0 and bounds["y"] + bounds["height"] <= size[1] + 1, bounds
                page.screenshot(path=str(output / f"{slug}-result-{size[0]}x{size[1]}.png"))
                retry.tap()
                if slug == "pigeon":
                    start(page, slug)
                    assert page.evaluate("game.score===0&&game.lives===3&&game.wave===1")
                else:
                    assert page.evaluate("coins===0&&totalKills===0&&level===1&&player.hp===100")
                expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "playing")

        for slug in ["game", "pigeon"]:
            for size in [(390, 844), (844, 390)]:
                record(f"menu-{slug}-result-{size[0]}x{size[1]}",
                       lambda g=slug, s=size: original_result(g, s))

        def ninja_progress():
            with fresh("/Arcade/game.html") as (_, page):
                start(page, "game")
                expect(page.locator('[data-action="shockwave"]')).to_be_disabled()
                # Stage a nearby existing enemy; the actual projectile earns the kill and coins.
                page.evaluate("""() => {
                    enemies.forEach((enemy,index)=>{enemy.x=player.x+55+index*2;enemy.y=player.y;enemy.speed=0;});
                }""")
                page.locator('[data-action="throw"]').tap()
                page.wait_for_function("totalKills>=1&&coins>0")
                earned = page.evaluate("({totalKills,coins})")
                # Isolate late-progress controls from random enemy damage during boundary checks.
                page.evaluate("enemies=[];zombiesSpawned=ZOMBIES_PER_LEVEL")
                for index, power in enumerate(["shockwave", "meteor", "lightning", "freeze", "vortex"]):
                    page.evaluate(f"totalKills={(index+1)*10-1}")
                    control = page.locator(f'[data-action="{power}"]')
                    expect(control).to_be_disabled()
                    page.evaluate(f"totalKills={(index+1)*10}")
                    expect(control).to_be_enabled()
                    control.tap()
                    assert page.evaluate(f"powerCooldowns[{index}]>0")
                    expect(control).to_be_disabled()
                page.evaluate("levelComplete()")
                page.get_by_role("button", name="OPEN GARAGE", exact=True).click()
                expect(page.locator("#garage")).to_be_visible()
                page.get_by_role("button", name="Steel Fang", exact=True).click()
                assert page.evaluate("!SHURIKEN_TYPES[1].owned")
                # Explicit coin-balance fixture for the between-level purchase UI.
                page.evaluate("coins=30;renderGarage()")
                page.get_by_role("button", name=re.compile("BUY")).tap()
                assert page.evaluate("SHURIKEN_TYPES[1].owned&&coins===0")
                page.get_by_role("button", name="BACK", exact=True).tap()
                page.get_by_role("button", name="NEXT LEVEL", exact=True).tap()
                expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "playing")
                assert page.evaluate("selectedShuriken===1")
                return {"realProjectileEarnings": earned}

        record("touch-ninja-earned-progress-garage", ninja_progress)

        def maze_controls():
            with fresh("/Arcade/zombie.html") as (context, page):
                start(page, "zombie")
                step = direction(page)
                touch = Touch(context, page)
                points = [touch.point(".arcade-stick", step["x"] * 34, step["y"] * 34),
                          touch.point('[data-action="sneak"]', identity=2)]
                touch.send("touchStart", points)
                page.wait_for_function("player.sneaking&&player.moving")
                touch.end()
                page.wait_for_function("!player.sneaking&&!player.moving")
                for kind in ["spike", "bear", "mine"]:
                    if page.evaluate("traps.length") > 0:
                        page.evaluate("traps=[]")
                    page.locator(f'[data-action="{kind}"]').tap()
                    assert page.evaluate(f"traps.length===1&&traps[0].kind==='{kind}'")
                    page.locator(f'[data-action="{kind}"]').tap()
                    assert page.evaluate("traps.length===1")
                    expect(page.get_by_role("status")).to_have_text("A trap is already here.")
                page.get_by_role("button", name="Show whole maze", exact=True).tap()
                expect(page.get_by_role("button", name="Follow the player")).to_have_attribute("aria-pressed", "true")
                page.get_by_role("button", name="Follow the player", exact=True).tap()
                page.evaluate("zombies[0].state='stunned';zombies[0].stunUntil=activeTime+4000")
                page.get_by_role("button", name="Pause game", exact=True).click()
                frozen = page.evaluate("({activeTime,stun:zombies[0].stunUntil,trap:traps[0].armTime})")
                page.wait_for_timeout(600)
                assert page.evaluate("({activeTime,stun:zombies[0].stunUntil,trap:traps[0].armTime})") == frozen
                page.get_by_role("dialog", name="Game paused").get_by_role("button", name="Resume game", exact=True).click()
                page.evaluate("player.x=exitTile.x*TILE+TILE/2;player.y=exitTile.y*TILE+TILE/2")
                expect(page.get_by_role("dialog", name="You escaped!")).to_be_visible()
                page.get_by_role("button", name="Play a new maze", exact=True).tap()
                expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "playing")
                assert page.evaluate("!gameOver&&traps.length===0&&activeTime<1000")

        record("touch-zombie-traps-timers-exit", maze_controls)

        def maze_caught():
            with fresh("/Arcade/zombie.html", (844, 390)) as (_, page):
                start(page, "zombie")
                # Stage an existing enemy; the actual collision handler ends the run.
                page.evaluate("Object.assign(zombies[0],{x:player.x,y:player.y,state:'patrol',path:[]})")
                dialog = page.get_by_role("dialog", name="The zombies caught you", exact=True)
                expect(dialog).to_be_visible()
                assert page.evaluate("gameOver&&!won")
                page.screenshot(path=str(output / "zombie-caught-landscape.png"))
                dialog.get_by_role("button", name="Play a new maze", exact=True).tap()
                expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "playing")
                assert page.evaluate("!gameOver&&!won&&traps.length===0&&activeTime<1000")

        record("menu-zombie-caught-replay", maze_caught)

        def camera_edges(slug):
            with fresh(f"/Arcade/{slug}.html", (844, 390)) as (_, page):
                start(page, slug)
                actor = "player" if slug == "game" else "dog"
                if slug == "game":
                    page.evaluate("enemies=[];zombiesSpawned=ZOMBIES_PER_LEVEL")
                for edge, x in [("left", 20), ("right", 880)]:
                    page.evaluate(f"{actor}.x={x};{actor}.y=580;{actor}.vx=0;{actor}.vy=0")
                    page.wait_for_timeout(100)
                    point = world_point(page, x, 580)
                    box = page.locator("canvas").bounding_box()
                    sprite = {"x": point["x"]+box["x"], "y": point["y"]+box["y"]}
                    for selector in [".arcade-stick", ".arcade-actions"]:
                        control = page.locator(selector).bounding_box()
                        overlaps = (sprite["x"]+20 > control["x"] and sprite["x"]-20 < control["x"]+control["width"]
                                    and sprite["y"]+26 > control["y"] and sprite["y"]-26 < control["y"]+control["height"])
                        assert not overlaps, (sprite, control)
                    page.screenshot(path=str(output / f"{slug}-landscape-bottom-{edge}.png"))

        for slug in ["game", "shepherd"]:
            record(f"camera-{slug}-landscape-edges", lambda g=slug: camera_edges(g))

        def discovery(size, javascript):
            with fresh("/play/", size, javascript) as (_, page):
                cards = page.locator('[data-game-card][href="/play/ninja-shuriken.html"], [data-game-card][href="/play/zombie-hide-and-seek.html"], [data-game-card][href="/play/captain-pigeon.html"], [data-game-card][href="/play/dog-shepherd.html"]')
                expect(cards).to_have_count(4)
                assert "parent" in page.locator(".catalogue-maker").inner_text().lower()
                assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
                page.screenshot(path=str(output / f"play-arcade-{size[0]}x{size[1]}-{'js' if javascript else 'nojs'}.png"))
                for card in cards.all():
                    expect(card.locator(".catalogue-note")).not_to_be_empty()
                page.mouse.move(1, size[1]-1)
                page.evaluate("window.scrollTo({top:0,left:0,behavior:'instant'})")
                page.screenshot(full_page=True, path=str(
                    output / f"arcade-page-{size[0]}x{size[1]}-{'js' if javascript else 'nojs'}.png"))
                if javascript:
                    page.get_by_role("link", name="Play Ninja Shuriken", exact=True).click()
                    expect(page.locator("h1")).to_have_text("Ninja Shuriken")
                    page.get_by_role("link", name="Play Ninja Shuriken", exact=False).click()
                    page.get_by_role("button", name="START GAME", exact=True).click()
                    expect(page.locator(".game-page")).to_have_attribute("data-arcade-phase", "playing")
                    page.locator(".game-topbar .back-link").click()
                    expect(page).to_have_url(base + "/play/#creative-arcade")

        for size in [(1366, 768), (390, 844), (844, 390)]:
            for javascript in [True, False]:
                record(f"discovery-{size[0]}x{size[1]}-{'js' if javascript else 'nojs'}",
                       lambda s=size, j=javascript: discovery(s, j))

        def install(slug, package, size):
            with fresh(f"/play/{slug}.html", size) as (context, page):
                badge = page.locator(".web-game-store")
                expect(badge).to_be_visible()
                expect(badge).to_have_attribute("href", "https://play.google.com/store/apps/details?id=" + package)
                image = badge.locator("img")
                assert image.evaluate("e=>e.complete&&e.naturalWidth>0&&e.width>=190")
                box = badge.bounding_box()
                assert box["y"] >= 64 and box["y"] + box["height"] <= size[1] + 1, box
                expect(page.locator("#launch-game")).to_be_enabled()
                assert page.locator("#universe-frame").get_attribute("src") is None
                page.screenshot(path=str(output / f"install-{slug}-{size[0]}x{size[1]}.png"))
                # Keep the production-game launch silent; no progress/rewards are seeded.
                context.add_init_script("""
                    localStorage.setItem('clock_master_settings', '{"audioMuted":true}');
                    localStorage.setItem('mathTank_settings', JSON.stringify({
                        soundEnabled:false, musicEnabled:false, voiceVolume:0, playerAge:6
                    }));
                """)
                page.locator("#launch-game").click()
                frame = page.frame_locator("#universe-frame")
                if slug == "clock-master":
                    expect(frame.get_by_role("button", name="Learn the Clock", exact=True)).to_be_visible()
                else:
                    frame.get_by_role("button", name="Play Math Tank", exact=True).click()
                    expect(frame.get_by_test_id("math-tank-app")).to_have_attribute("data-screen", "home")
                page.wait_for_function("""() => {
                    const rect = document.getElementById('universe-frame').getBoundingClientRect();
                    return rect.top >= 63 && rect.bottom <= innerHeight + 1;
                }""")
                bounds = page.locator("#universe-frame").bounding_box()
                assert bounds["y"] >= 63 and bounds["y"] + bounds["height"] <= size[1] + 1, bounds
                assert bounds["x"] >= 0 and bounds["x"] + bounds["width"] <= size[0] + 1, bounds
                geometry = {"badge": box, "embeddedGame": bounds}
                if size in [(1366, 768), (844, 390)]:
                    fullscreen = page.locator("#fullscreen-game")
                    fullscreen.evaluate("element=>element.scrollIntoView({block:'center'})")
                    fullscreen.click()
                    # Fullscreen state can precede its resized paint.
                    page.wait_for_function("""async () => {
                        const frame = document.getElementById('universe-frame');
                        const fillsViewport = () => {
                            const rect = frame.getBoundingClientRect();
                            return document.fullscreenElement === frame && rect.x === 0 && rect.y === 0
                                && Math.abs(rect.width-innerWidth) <= 1
                                && Math.abs(rect.height-innerHeight) <= 1;
                        };
                        if (!fillsViewport()) return false;
                        await new Promise(requestAnimationFrame);
                        return fillsViewport();
                    }""")
                    full = page.locator("#universe-frame").bounding_box()
                    assert full["x"] == 0 and full["y"] == 0, full
                    assert abs(full["width"]-size[0]) <= 1 and abs(full["height"]-size[1]) <= 1, full
                    geometry["fullscreenGame"] = full
                    page.screenshot(path=str(output / f"fullscreen-{slug}-{size[0]}x{size[1]}.png"))
                    page.evaluate("document.exitFullscreen()")
                return geometry

        for slug, package in [("clock-master", "com.clockmaster.timeforjuniors"), ("math-tank", "com.namasya.mathtank")]:
            for size in SIZES:
                record(f"install-{slug}-{size[0]}x{size[1]}", lambda s=slug, p=package, v=size: install(s, p, v))
        browser.close()
    if not results:
        raise RuntimeError("--only did not match any checks")
    passed = sum(result["passed"] for result in results)
    print(f"{passed}/{len(results)} checks passed", flush=True)
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(run())
