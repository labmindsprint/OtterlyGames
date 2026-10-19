"""Three NASA-inspired OSA icon concepts (512 square). Run: python gen.py"""
import io
import sys
from pathlib import Path

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "b"))
import art  # noqa: E402

INK, CREAM, ORANGE, GOLD = art.INK, art.CREAM, art.ORANGE, art.GOLD
RED, BLUE, NAVY = "#e8342a", "#2b4aa8", "#1b2a63"
P = art.Pen()


def place(inner, x, y, k, rot=0):
    return f'<g transform="translate({x} {y}) rotate({rot}) scale({k}) translate(-{art.SHIP["cx"]} -{art.SHIP["cy"]})">{inner}</g>'


def ship_at(x, y, k, shadow=True, rot=0):
    s = art.ship_shadow() if shadow else ""
    return place(s + art.ship(P), x, y, k, rot)


def halftone_dots(x0, y0, x1, y1, color, step=20, r=3.2):
    out = []
    j = 0
    y = y0
    while y < y1:
        x = x0 + (step / 2 if j % 2 else 0)
        while x < x1:
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}"/>')
            x += step
        y += step * 0.866
        j += 1
    return f'<g fill="{color}">{"".join(out)}</g>'


def stars(items):
    return "".join(art.sparkle(x, y, r, c) for x, y, r, c in items)


def wrap(body, bg=True):
    defs = art.WOBBLE
    bgs = f'<rect width="512" height="512" fill="{CREAM}"/>{art.background_dots()}' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">'
            f'<defs>{defs}<clipPath id="c1"><circle cx="256" cy="256" r="186"/></clipPath>'
            f'<clipPath id="c2"><rect x="36" y="40" width="440" height="430" rx="48"/></clipPath></defs>'
            f'{bgs}<g filter="url(#wob)">{body}</g></svg>')


def lettering(txt, x, y, size, fam, weight, fill, ls=0, outline=14, shadow=10):
    a = (f'font-family="{fam}" font-weight="{weight}" font-size="{size}" text-anchor="middle" letter-spacing="{ls}" '
         'stroke-linejoin="round"')
    sh = f'<text x="{x}" y="{y}" {a} fill="{INK}" stroke="{INK}" stroke-width="{outline}" transform="translate({shadow} {shadow})">{txt}</text>' if shadow else ""
    mn = f'<text x="{x}" y="{y}" {a} fill="{fill}" stroke="{INK}" stroke-width="{outline}" paint-order="stroke">{txt}</text>'
    return sh + mn


def n1_body():
    sky = (halftone_dots(60, 60, 460, 460, "#3b5fc4")
           + stars([(150, 130, 20, "#fff"), (390, 120, 12, "#fff"), (110, 250, 11, GOLD), (410, 260, 14, "#fff"), (200, 215, 8, "#fff")])
           + '<ellipse cx="256" cy="262" rx="178" ry="58" transform="rotate(-24 256 262)" fill="none" stroke="#fff" stroke-width="5"/>')
    vector = (f'<path d="M62 372 C150 360 300 290 452 120 C420 250 330 350 190 392 C150 404 100 400 62 372 Z" '
              f'fill="{RED}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>')
    disc = (f'<circle cx="256" cy="256" r="186" fill="{INK}" transform="translate(14 14)"/>'
            f'<circle cx="256" cy="256" r="186" fill="{BLUE}"/>'
            f'<g clip-path="url(#c1)">{sky}{vector}</g>'
            f'<circle cx="256" cy="256" r="186" fill="none" stroke="{INK}" stroke-width="16"/>')
    ship = ship_at(330, 150, 0.62)
    text = lettering("OSA", 256, 352, 124, "Arial Black, Impact, sans-serif", 900, "#fff", ls=4, outline=13, shadow=8)
    return disc + ship + text


def n1_mono_body():
    pm = art.Pen(mono=True)
    stars_cut = "".join(art.sparkle(x, y, r, "#000") for x, y, r in [(150, 130, 20), (390, 120, 12), (110, 250, 11), (410, 260, 14)])
    inner = (stars_cut
             + '<ellipse cx="256" cy="262" rx="178" ry="58" transform="rotate(-24 256 262)" fill="none" stroke="#000" stroke-width="6"/>'
             + '<path d="M62 372 C150 360 300 290 452 120 C420 250 330 350 190 392 C150 404 100 400 62 372 Z" fill="none" stroke="#000" stroke-width="9" stroke-linejoin="round"/>')
    disc = ('<circle cx="256" cy="256" r="186" fill="#fff"/>'
            f'<g clip-path="url(#c1)">{inner}</g>')
    halo = f'<g stroke="#000" stroke-width="14" stroke-linejoin="round">{place(art.ship_shadow(0, 0), 330, 150, 0.62)}</g>'
    ship = place(art.ship(pm), 330, 150, 0.62)
    text = lettering("OSA", 256, 352, 124, "Arial Black, Impact, sans-serif", 900, "#000", ls=4, outline=0, shadow=0)
    text_halo = lettering("OSA", 256, 352, 124, "Arial Black, Impact, sans-serif", 900, "#fff", ls=4, outline=0, shadow=0).replace('stroke="#2b2b2b" stroke-width="0"', 'stroke="#fff" stroke-width="16"')
    return disc + halo + ship + text_halo + text


def n1_meatball():
    return wrap(n1_body())


def write_n1_layers(out_dir):
    """Install-ready SVGs for the build-icons.py pipeline (master + adaptive layers)."""
    K = 0.15
    t = f'translate(54 54) scale({K}) translate(-263 -263)'
    defs = f'{art.WOBBLE}<clipPath id="c1"><circle cx="256" cy="256" r="186"/></clipPath>'
    head = '<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">\n'
    out_dir = Path(out_dir)
    (out_dir / "icon-master.svg").write_text(n1_meatball(), encoding="utf-8")
    (out_dir / "ic_launcher_foreground.svg").write_text(
        head + f'  <defs>{defs}</defs>\n  <g transform="{t}"><g filter="url(#wob)">{n1_body()}</g></g>\n</svg>\n', encoding="utf-8")
    (out_dir / "ic_launcher_background.svg").write_text(art.layer_svg("bg"), encoding="utf-8")
    (out_dir / "ic_launcher_monochrome.svg").write_text(
        head + f'  <defs>{defs}<mask id="m" maskUnits="userSpaceOnUse" x="-100" y="-100" width="712" height="712">'
        f'<g filter="url(#wob)">{n1_mono_body()}</g></mask></defs>\n'
        f'  <g transform="{t}"><rect x="-100" y="-100" width="712" height="712" fill="#fff" mask="url(#m)"/></g>\n</svg>\n', encoding="utf-8")


def n2_shuttle():
    panel = 'x="36" y="40" width="440" height="430" rx="48"'
    sky = (f'<rect x="36" y="40" width="440" height="270" fill="{NAVY}"/>'
           + halftone_dots(36, 40, 476, 310, "#2a3c85")
           + stars([(110, 110, 20, "#fff"), (420, 120, 14, "#fff"), (90, 235, 10, GOLD), (430, 245, 10, "#fff"), (190, 90, 8, "#fff")]))
    body = (f'<rect x="36" y="296" width="440" height="180" fill="{CREAM}"/>'
            f'<rect x="36" y="290" width="440" height="12" fill="{INK}"/>')
    stripes = (f'<rect x="36" y="436" width="440" height="11" fill="{RED}"/>'
               f'<rect x="36" y="451" width="440" height="9" fill="{BLUE}"/>'
               f'<rect x="36" y="428" width="440" height="4" fill="{INK}"/>')
    text = (f'<text x="256" y="414" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="150" '
            f'text-anchor="middle" letter-spacing="2" fill="{INK}">OSA</text>')
    frame = f'<rect {panel} fill="none" stroke="{INK}" stroke-width="18"/>'
    shadow = f'<rect {panel} fill="{INK}" transform="translate(16 16)"/>'
    body_g = shadow + f'<g clip-path="url(#c2)">{sky}{body}{stripes}{text}</g>' + frame
    ship = ship_at(300, 170, 1.0)
    return wrap(body_g + ship)


def n3_worm():
    o = '<ellipse cx="160" cy="412" rx="31" ry="30"/>'
    s = '<path d="M277 392 C269 379 233 377 231 396 C229 413 275 410 275 430 C275 449 236 449 224 434"/>'
    a = '<path d="M306 444 L346 383 L386 444" stroke-linejoin="miter"/>'
    g = o + s + a
    xf = 'transform="translate(256 410) scale(1.18) translate(-257 -412)"'
    base = 'fill="none" stroke-linecap="round" stroke-linejoin="round"'
    letters = (f'<g {base} stroke="{INK}" stroke-width="30" transform="translate(10 10)"><g {xf}>{g}</g></g>'
               f'<g {base} stroke="{INK}" stroke-width="30"><g {xf}>{g}</g></g>'
               f'<g {base} stroke="{RED}" stroke-width="19"><g {xf}>{g}</g></g>')
    burst = (f'<path d="{art.star_pts(256, 215, 12, 110, 64, rot=8, jitter=0.12, seed=4)}" fill="{GOLD}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>'
             f'<path d="{art.star_pts(256, 215, 12, 74, 44, rot=20, jitter=0.1, seed=9)}" fill="{art.FLAME_PALE}"/>')
    sp = stars([(80, 110, 18, GOLD), (440, 90, 14, GOLD), (70, 300, 10, ORANGE), (450, 280, 12, ORANGE)])
    ship = ship_at(256, 175, 0.9)
    return wrap(sp + burst + ship + letters)


def main():
    designs = {"n1-meatball": n1_meatball(), "n2-shuttle": n2_shuttle(), "n3-worm": n3_worm()}
    imgs = []
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        for name, svg in designs.items():
            f = HERE / f"{name}.svg"
            f.write_text(svg, encoding="utf-8")
            pg = br.new_page(viewport={"width": 512, "height": 512})
            pg.goto(f.as_uri())
            png = pg.screenshot(type="png")
            pg.close()
            im = Image.open(io.BytesIO(png)).convert("RGBA")
            im.save(HERE / f"{name}.png")
            imgs.append(im)
        br.close()
    sheet = Image.new("RGBA", (512 * 3 + 40, 512 + 140), (236, 238, 243, 255))
    for i, im in enumerate(imgs):
        sheet.paste(im, (10 + i * 522, 10))
        m = Image.new("L", (144 * 4, 144 * 4), 0)
        ImageDraw.Draw(m).ellipse([0, 0, 144 * 4 - 1, 144 * 4 - 1], fill=255)
        m = m.resize((144, 144), Image.LANCZOS)
        small = im.resize((144, 144), Image.LANCZOS)
        sheet.paste(small, (10 + i * 522, 530), m)
        sheet.paste(im.resize((48, 48), Image.LANCZOS), (170 + i * 522, 580))
    sheet.save(HERE / "compare.png")


if __name__ == "__main__":
    main()
