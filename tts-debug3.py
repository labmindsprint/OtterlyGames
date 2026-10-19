from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 412, 'height': 915})
    pg.goto('http://127.0.0.1:8777/play/pit-stop.html?test=1&demo=map&class=class-2')
    pg.wait_for_function('window.__pitstop && window.__pitstop.go')
    pg.wait_for_timeout(1500)
    print(pg.evaluate("""async () => { try { const m = await import('/js/space-academy/pitstop/missions.mjs'); const ms = m.paperMission('class-2', 2); return 'ok ' + ms.questions.length + ' ' + ms.kind; } catch (e) { return 'ERR ' + e.stack; } }"""))
    print(pg.evaluate("""async () => { try { const v = await import('/js/space-academy/pitstop/view-quiz.mjs'); const m = await import('/js/space-academy/pitstop/missions.mjs'); const app = window.__pitstop; const mission = m.paperMission('class-2', 2); v.show(app, { mission }); return 'shown'; } catch (e) { return 'ERR ' + e.stack; } }"""))
    pg.wait_for_timeout(500)
    print(pg.inner_text('body')[:200])
    b.close()
