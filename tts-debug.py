from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 412, 'height': 915})
    pg.on('console', lambda m: print('console', m.type, m.text))
    pg.on('pageerror', lambda e: print('pageerror', e))
    pg.goto('http://127.0.0.1:8777/play/pit-stop.html?test=1&demo=map&class=class-2')
    pg.wait_for_function('window.__pitstop && window.__pitstop.go')
    pg.wait_for_timeout(1500)
    print(pg.inner_text('body')[:400])
    try:
        pg.evaluate("""async () => { const m = await import('/js/space-academy/pitstop/missions.mjs'); await window.__pitstop.go('quiz', { mission: m.paperMission('class-2', 2) }); }""")
    except Exception as e:
        print('EVAL', e)
    pg.wait_for_timeout(1500)
    print(pg.inner_text('body')[:400])
    b.close()
