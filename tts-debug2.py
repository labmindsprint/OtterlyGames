from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    for url in ['', '?test=1', '?test=1&demo=map&class=class-2']:
        pg = b.new_page(viewport={'width': 412, 'height': 915})
        pg.on('console', lambda m: print('console', m.type, m.text[:300]))
        pg.on('pageerror', lambda e: print('pageerror', str(e)[:400]))
        pg.goto('http://127.0.0.1:8777/play/pit-stop.html' + url)
        pg.wait_for_timeout(2000)
        print(url, '=>', pg.inner_text('body')[:150].replace('\n', ' | '))
        pg.close()
    b.close()
