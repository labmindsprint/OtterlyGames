"""Play feature graphic (1024x500) in the NASA-meatball comic style. Run: python feature_graphic.py"""
import io
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import gen  # noqa: E402
from gen import art, halftone_dots, lettering, n1_body, stars  # noqa: E402

STORE = HERE.parent.parent
FONT = (STORE / "fonts" / "patrick-hand-latin.woff2").as_uri()
BG = "#10204f"


def build():
    disc = f'<g transform="translate(250 250) scale(0.86) translate(-256 -256)">{n1_body()}</g>'
    sky = (f'<rect width="1024" height="500" fill="{BG}"/>'
           + halftone_dots(0, 0, 1024, 500, "#1f3a85", step=22, r=3.6)
           + stars([(520, 60, 14, "#fff"), (960, 70, 18, "#fff"), (930, 440, 12, gen.GOLD), (560, 450, 10, "#fff"), (640, 30, 8, "#fff")]))
    wob = f'<g filter="url(#wob)">{disc}</g>'
    title = (lettering("SPACE", 700, 190, 118, "Arial Black, Impact, sans-serif", 900, "#fff", ls=4, outline=12, shadow=8)
             + lettering("ACADEMY", 700, 292, 94, "Arial Black, Impact, sans-serif", 900, gen.GOLD, ls=2, outline=12, shadow=8))
    ribbon = (f'<g transform="rotate(-2 700 380)"><rect x="480" y="340" width="440" height="72" rx="14" fill="{gen.RED}" '
              f'stroke="{gen.INK}" stroke-width="7"/>'
              f'<text x="700" y="392" font-family="Patrick Hand, Comic Sans MS, cursive" font-size="40" fill="#fff" '
              f'text-anchor="middle">Olympiad maths, rocket-fast</text></g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">'
            f'<defs><style>@font-face{{font-family:"Patrick Hand";src:url("{FONT}") format("woff2");}}</style>{art.WOBBLE}'
            f'<clipPath id="c1"><circle cx="256" cy="256" r="186"/></clipPath></defs>'
            f'{sky}{wob}<g filter="url(#wob)">{title}</g>{ribbon}</svg>')


def main():
    svg = STORE / "feature-graphic.svg"
    svg.write_text(build(), encoding="utf-8")
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        pg = br.new_page(viewport={"width": 1024, "height": 500})
        pg.goto(svg.as_uri())
        pg.evaluate("document.fonts.ready")
        png = pg.screenshot(type="png")
        br.close()
    im = Image.open(io.BytesIO(png)).convert("RGB")
    assert im.size == (1024, 500), im.size
    im.save(STORE / "feature-graphic-1024x500.png", optimize=True)
    print("ok", im.size)


if __name__ == "__main__":
    main()
