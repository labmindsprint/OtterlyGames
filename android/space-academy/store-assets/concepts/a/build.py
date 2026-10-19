#!/usr/bin/env python3
"""Concept A 'Comic sticker': Ringo cheering out of a rocket. Generates the SVGs, then renders PNGs + previews.

Usage: python build.py     (needs: pip install playwright pillow; playwright install chromium)
Outputs next to this file: icon-master.svg, ic_launcher_{foreground,background,monochrome}.svg,
icon-512.png, preview-masks.png
All art is authored in the 108dp adaptive canvas; the 512 master is a crop of it (full-bleed).
"""
import io
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
SS = 4

INK, CREAM, ORANGE, GOLD, BLUE, NIGHT = "#2b2b2b", "#fffdf8", "#ff6a28", "#f5b82e", "#4a8fe0", "#2f3650"
OTTER, BELLY, GLASS = "#b9855a", "#efe6d2", "#d3e6fb"
SW = 2.8  # main outline, dp (3-4px at 108 scale)

# ---------------------------------------------------------------- geometry helpers


def wob(x, y):
    """Smooth displacement field: a gentle hand-drawn wobble (same idea as the game's feTurbulence filter)."""
    return (0.2 * math.sin(0.55 * y + 1.3) + 0.11 * math.sin(1.15 * x + 0.5),
            0.2 * math.sin(0.5 * x + 2.1) + 0.11 * math.sin(1.05 * y + 0.2))


def bez(p0, p1, p2, p3, n=14):
    out = []
    for i in range(1, n + 1):
        t = i / n
        u = 1 - t
        out.append((u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
                    u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]))
    return out


def shape(*segs):
    """segs: ('M',p) ('L',p) ('C',c1,c2,p). Returns a densely sampled point list."""
    pts, cur = [], None
    for s in segs:
        if s[0] in "ML":
            if s[0] == "L" and cur:
                for i in range(1, 5):
                    t = i / 4
                    pts.append((cur[0] + (s[1][0] - cur[0]) * t, cur[1] + (s[1][1] - cur[1]) * t))
            else:
                pts.append(s[1])
            cur = s[1]
        else:
            pts += bez(cur, s[1], s[2], s[3])
            cur = s[3]
    return pts


def circle_pts(cx, cy, r, n=40, rot=0.0):
    return [(cx + r * math.cos(rot + 2 * math.pi * i / n), cy + r * math.sin(rot + 2 * math.pi * i / n)) for i in range(n)]


def ell_pts(cx, cy, rx, ry, n=40):
    return [(cx + rx * math.cos(2 * math.pi * i / n), cy + ry * math.sin(2 * math.pi * i / n)) for i in range(n)]


def star_pts(cx, cy, ro, ri, n, rot=-math.pi / 2):
    return [(cx + (ro if i % 2 == 0 else ri) * math.cos(rot + math.pi * i / n),
             cy + (ro if i % 2 == 0 else ri) * math.sin(rot + math.pi * i / n)) for i in range(2 * n)]


def rrect(x, y, w, h, r):
    k = r * 0.55
    return shape(("M", (x + r, y)), ("L", (x + w - r, y)), ("C", (x + w - r + k, y), (x + w, y + r - k), (x + w, y + r)),
                 ("L", (x + w, y + h - r)), ("C", (x + w, y + h - r + k), (x + w - r + k, y + h), (x + w - r, y + h)),
                 ("L", (x + r, y + h)), ("C", (x + r - k, y + h), (x, y + h - r + k), (x, y + h - r)),
                 ("L", (x, y + r)), ("C", (x, y + r - k), (x + r - k, y), (x + r, y)))


def rounded_poly(pts):
    """Sharp polygon with slightly rounded corners (keeps comic starburst points inky and bold)."""
    out, n = [], len(pts)
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        a = (p1[0] + (p0[0] - p1[0]) * 0.12, p1[1] + (p0[1] - p1[1]) * 0.12)
        b = (p1[0] + (p2[0] - p1[0]) * 0.12, p1[1] + (p2[1] - p1[1]) * 0.12)
        out += [a] + bez(a, p1, p1, b, 3)
    return out


def d_of(pts, closed=True, dx=0.0, dy=0.0):
    s = []
    for i, (x, y) in enumerate(pts):
        wx, wy = wob(x, y)
        s.append(f"{'M' if i == 0 else 'L'}{x + wx + dx:.2f} {y + wy + dy:.2f}")
    return " ".join(s) + (" Z" if closed else "")


# ---------------------------------------------------------------- art

CX, CY = 54, 54
TILT = -9


class Art:
    """Builds the sticker art. mode 'color' for launcher/master, 'mono' for the themed-icon alpha mask."""

    def __init__(self, mode="color"):
        self.mode = mode
        self.uid = 0
        self.defs = []

    def fill(self, c):
        return c if self.mode == "color" else "#fff"

    def stroke(self):
        return INK if self.mode == "color" else "#000"

    def shp(self, pts, fill, sw=SW, closed=True, dx=0, dy=0, stroke=None):
        st = stroke or self.stroke()
        f = self.fill(fill) if fill else "none"
        return (f'<path d="{d_of(pts, closed, dx, dy)}" fill="{f}" stroke="{st}" stroke-width="{sw}" '
                f'stroke-linejoin="round" stroke-linecap="round"/>')

    def clip(self, pts):
        self.uid += 1
        cid = f"c{self.uid}"
        self.defs.append(f'<clipPath id="{cid}"><path d="{d_of(pts)}"/></clipPath>')
        return cid

    def dots(self, x0, y0, x1, y1, step, r, color, falloff=None):
        """Halftone dot grid rotated 45deg like printed comics; falloff(x,y)->0..1 scales dot radius."""
        out = []
        ca, sa = math.cos(math.radians(45)), math.sin(math.radians(45))
        n = int(max(x1 - x0, y1 - y0) / step) + 2
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        for i in range(-n, n):
            for j in range(-n, n):
                u, v = i * step, j * step
                x, y = mx + u * ca - v * sa, my + u * sa + v * ca
                if not (x0 <= x <= x1 and y0 <= y <= y1):
                    continue
                k = falloff(x, y) if falloff else 1
                if k <= 0.08:
                    continue
                out.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r * k:.2f}"/>')
        return f'<g fill="{color}">' + "".join(out) + "</g>"

    def background(self):
        corner = lambda x, y: max(0, min(1, (math.hypot(x - 54, y - 54) - 22) / 50))
        return (f'<rect width="108" height="108" fill="{BLUE}"/>'
                + self.dots(-4, -4, 112, 112, 5.2, 2.05, "#3b78c9", falloff=corner)
                + self.dots(-4, -4, 112, 112, 5.2, 1.3, NIGHT, falloff=lambda x, y: max(0, corner(x, y) - 0.62) * 2.6))

    def sticker(self):
        """Cream paper die-cut disc with hard offset shadow, outline, burst, rocket, Ringo, stars."""
        o = []
        disc = circle_pts(CX, CY, 30.5, 90)
        if self.mode == "color":
            o.append(self.shp(disc, INK, 0, dx=3.6, dy=3.8, stroke="none"))
            o.append(self.shp(disc, CREAM, SW + 0.4))
        else:
            o.append(self.shp(disc, None, 2.6))

        burst = rounded_poly(star_pts(54, 52.5, 25, 18.6, 11, rot=-math.pi / 2 + 0.12))
        if self.mode == "color":
            o.append(self.shp(burst, GOLD, 2.4))
            o.append(f'<g clip-path="url(#{self.clip(burst)})">'
                     + self.dots(24, 24, 84, 84, 3.6, 1.35, ORANGE,
                                 falloff=lambda x, y: max(0, min(1, ((x - 40) * 0.6 + (y - 34) * 0.8) / 22)))
                     + "</g>")
            o.append(self.shp(burst, None, 2.4))

        o.append(f'<g transform="rotate({TILT} 54 62)">{self.rocket()}{self.ringo()}</g>')

        for (x, y, r, col, rot) in ((27.5, 47, 4.6, CREAM, -0.3), (79, 31, 4.2, ORANGE, 0.2), (79.5, 56, 4.0, CREAM, 0.1)):
            o.append(self.shp(rounded_poly(star_pts(x, y, r, r * 0.46, 5, rot - math.pi / 2)), col, 2))
        return "".join(o)

    def rocket(self):
        o = []
        flame = shape(("M", (47.5, 78)), ("C", (45, 82), (50, 83), (54, 87)), ("C", (58, 83), (63, 82), (60.5, 78)))
        o.append(self.shp(flame, ORANGE, 2.6))
        o.append(self.shp(shape(("M", (51.5, 79)), ("C", (50.5, 81), (53, 82), (54, 84)), ("C", (55, 82), (57.5, 81), (56.5, 79))), GOLD, 1.6))
        fl = shape(("M", (42.5, 66)), ("C", (37, 68), (33, 73), (32, 80)), ("C", (37, 80), (41, 78.5), (43.5, 77)))
        fr = [(108 - x, y) for x, y in fl]
        o.append(self.shp(fl, ORANGE, 3))
        o.append(self.shp(fr, ORANGE, 3))
        body = shape(("M", (42, 54)), ("C", (38, 62), (38, 72), (42.5, 80)), ("L", (65.5, 80)),
                     ("C", (70, 72), (70, 62), (66, 54)))
        o.append(self.shp(body, BLUE, SW))
        if self.mode == "color":
            o.append(f'<g clip-path="url(#{self.clip(body)})">'
                     + self.shp(rrect(34, 72.2, 40, 3.6, 1.2), CREAM, 2.2)
                     + self.dots(36, 54, 72, 82, 2.9, 1.0, "#2f5fa8", falloff=lambda x, y: max(0, min(1, (x - 54) / 12)))
                     + '<path d="M44.5 58 Q42.5 66 44.5 71" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".9"/>'
                     + "</g>")
        o.append(self.shp(circle_pts(54, 65.2, 4.7), GLASS, 2.6))
        if self.mode == "color":
            o.append('<path d="M51.5 63.6 Q52.5 62 54.4 61.9" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>')
        o.append(self.shp(rrect(38.8, 49.6, 30.4, 6.6, 3), ORANGE, 3))
        if self.mode == "color":
            o.append('<path d="M43 52.5 H48" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".85" fill="none"/>')
        return "".join(o)

    def ringo(self):
        o = []
        cx, cy, s = 54, 38.4, 0.47  # ringo() art is 64x64 with head centre (32,34)
        P = lambda x, y: (cx + (x - 32) * s, cy + (y - 34) * s)
        for sign in (-1, 1):
            arm = shape(("M", (54 + sign * 9.5, 52)), ("C", (54 + sign * 15, 51), (54 + sign * 18.5, 46), (54 + sign * 18.3, 40)))
            o.append(self.shp(arm, None, 6.6, closed=False))
            o.append(self.shp(arm, None, 3.0, closed=False, stroke=OTTER if self.mode == "color" else "#fff"))
            o.append(self.shp(circle_pts(54 + sign * 18.6, 37.6, 4.0), OTTER, 2.6))
        ink = INK if self.mode == "color" else "#000"
        for ex in (13.5, 50.5):  # small round otter ears, set wide and low
            ex_, ey_ = P(ex, 18)
            o.append(self.shp(circle_pts(ex_, ey_, 6.2 * s + 0.3), OTTER, 2.6))
        o.append(self.shp(circle_pts(*P(32, 34), 25 * s + 0.1, 60), OTTER, SW))
        o.append(self.shp(ell_pts(*P(32, 43), 15 * s, 11 * s), BELLY, 2.6))
        if self.mode == "color":
            for ex in (15.5, 48.5):
                o.append(f'<ellipse cx="{P(ex, 38)[0]:.2f}" cy="{P(ex, 38)[1]:.2f}" rx="1.9" ry="1.2" fill="{ORANGE}" opacity=".55"/>')
        for ex in (23, 41):
            x, y = P(ex, 29)
            o.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="2.75" fill="{ink}"/>')
            o.append(f'<circle cx="{x + 0.9:.2f}" cy="{y - 0.9:.2f}" r="0.95" fill="#fff"/>')
        nx, ny = P(32, 37)
        o.append(f'<ellipse cx="{nx:.2f}" cy="{ny:.2f}" rx="2.6" ry="1.8" fill="{ink}"/>')
        # whiskers poke out past the face outline: the otter giveaway
        for sign in (-1, 1):
            for (y0, y1) in ((40.5, 36.5), (43, 43), (45.5, 49.5)):
                a, b = P(32 + sign * 11.5, y0), P(32 + sign * 31, y1)
                o.append(f'<path d="M{a[0]:.2f} {a[1]:.2f} L{b[0]:.2f} {b[1]:.2f}" stroke="{ink}" stroke-width="1.15" stroke-linecap="round" fill="none"/>')
        mouth = shape(("M", P(24, 41)), ("C", P(26, 52), P(38, 52), P(40, 41)), ("C", P(36, 42.4), P(28, 42.4), P(24, 41)))
        o.append(self.shp(mouth, "#fff" if self.mode == "color" else "#000", 2.0, stroke=ink))
        if self.mode == "color":
            tx, ty = P(32, 48)
            o.append(f'<ellipse cx="{tx:.2f}" cy="{ty:.2f}" rx="2.3" ry="1.1" fill="#ff8f8a"/>')
        return "".join(o)

    def defs_xml(self):
        return "<defs>" + "".join(self.defs) + "</defs>"


def svg_foreground():
    a = Art("color")
    inner = a.sticker()
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">\n'
            '  <!-- Concept A foreground, 108dp. Sticker + Ringo + rocket live inside the central 66dp circle. -->\n'
            f'  {a.defs_xml()}\n  {inner}\n</svg>\n')


def svg_background():
    a = Art("color")
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">\n'
            '  <!-- Concept A background, 108dp: comic blue with halftone dots and darker corners. -->\n'
            f'  {a.background()}\n</svg>\n')


def svg_monochrome():
    a = Art("mono")
    inner = a.sticker()
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">\n'
            '  <!-- Concept A themed layer: single-colour silhouette; only alpha is used. -->\n'
            f'  <defs>{"".join(a.defs)}<mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="108" height="108">{inner}</mask></defs>\n'
            '  <rect width="108" height="108" fill="#000" mask="url(#m)"/>\n</svg>\n')


def svg_master():
    a = Art("color")
    bg = a.background()
    fg = a.sticker()
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="14 14 80 80">\n'
            '  <!-- Concept A master 512x512: the adaptive layers composed and cropped to the central 76dp. -->\n'
            f'  {a.defs_xml()}\n  {bg}\n  {fg}\n</svg>\n')


# ---------------------------------------------------------------- raster + previews


def render(browser, svg_name, width, height, transparent=False):
    page = browser.new_page(viewport={"width": width, "height": height})
    page.goto((HERE / svg_name).as_uri())
    intrinsic = page.evaluate("[document.documentElement.width.baseVal.value, document.documentElement.height.baseVal.value]")
    page.close()
    scale = width / intrinsic[0]
    page = browser.new_page(viewport={"width": round(intrinsic[0]), "height": round(intrinsic[1])}, device_scale_factor=scale)
    page.goto((HERE / svg_name).as_uri())
    png = page.screenshot(omit_background=transparent, type="png")
    page.close()
    img = Image.open(io.BytesIO(png)).convert("RGBA")
    if img.size != (width, height):
        img = img.resize((width, height), Image.LANCZOS)
    return img


def rounded_mask(size, radius_frac):
    big = Image.new("L", (size * SS, size * SS), 0)
    ImageDraw.Draw(big).rounded_rectangle([0, 0, size * SS - 1, size * SS - 1], radius=radius_frac * size * SS, fill=255)
    return big.resize((size, size), Image.LANCZOS)


def circle_mask(size):
    big = Image.new("L", (size * SS, size * SS), 0)
    ImageDraw.Draw(big).ellipse([0, 0, size * SS - 1, size * SS - 1], fill=255)
    return big.resize((size, size), Image.LANCZOS)


def squircle_mask(size, n=4.0):
    big_n = size * SS
    pts = []
    for i in range(720):
        t = 2 * math.pi * i / 720
        c, s = math.cos(t), math.sin(t)
        pts.append(((math.copysign(abs(c) ** (2 / n), c) + 1) / 2 * (big_n - 1),
                    (math.copysign(abs(s) ** (2 / n), s) + 1) / 2 * (big_n - 1)))
    big = Image.new("L", (big_n, big_n), 0)
    ImageDraw.Draw(big).polygon(pts, fill=255)
    return big.resize((size, size), Image.LANCZOS)


def masked(img, mask):
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def font(size):
    for name in ("arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def adaptive_mask_view(bg, fg, shape_fn):
    size = bg.width
    comp = Image.alpha_composite(bg, fg)
    vis = round(size * 72 / 108)
    off = (size - vis) // 2
    return masked(comp.crop((off, off, off + vis, off + vis)), shape_fn(vis))


def build_previews(assets):
    bg, fg, mono = assets["bg"], assets["fg"], assets["mono"]
    cell, pad = 216, 24
    sheet = Image.new("RGBA", (pad + 4 * (cell + pad), 2 * (cell + 60) + 30), (236, 238, 242, 255))
    d = ImageDraw.Draw(sheet)

    def put(img, col, row, label):
        x, y = pad + col * (cell + pad), 24 + row * (cell + 60)
        sheet.alpha_composite(img.resize((cell, cell), Image.LANCZOS), (x, y))
        d.text((x, y + cell + 8), label, fill=(30, 30, 30, 255), font=font(14))

    for col, (name, fn) in enumerate([("Circle", circle_mask), ("Squircle", squircle_mask),
                                      ("Rounded sq.", lambda s: rounded_mask(s, 0.28))]):
        put(adaptive_mask_view(bg, fg, fn), col, 0, name + " mask, 72dp window")

    size = bg.width
    comp = Image.alpha_composite(bg, fg)
    od, k = ImageDraw.Draw(comp), size / 108
    od.rectangle([18 * k, 18 * k, 90 * k, 90 * k], outline=(255, 60, 60, 255), width=max(2, round(size / 100)))
    od.ellipse([21 * k, 21 * k, 87 * k, 87 * k], outline=(255, 230, 0, 255), width=max(2, round(size / 100)))
    put(comp, 3, 0, "108dp: red 72dp, yellow 66dp safe")

    vis = round(size * 72 / 108)
    off = (size - vis) // 2
    alpha = mono.split()[3]
    themes = [((178, 235, 222, 255), (30, 60, 55, 255), "Themed light, circle", circle_mask),
              ((52, 78, 74, 255), (200, 245, 235, 255), "Themed dark, circle", circle_mask),
              ((232, 222, 248, 255), (51, 37, 74, 255), "Themed lilac, squircle", squircle_mask)]
    for col, (bgcol, inkc, name, fn) in enumerate(themes):
        base = Image.new("RGBA", mono.size, bgcol)
        t = Image.new("RGBA", mono.size, (0, 0, 0, 0))
        t.paste(Image.new("RGBA", mono.size, inkc), (0, 0), alpha)
        put(masked(Image.alpha_composite(base, t).crop((off, off, off + vis, off + vis)), fn(vis)), col, 1, name)

    # small-size legibility: actual 48px / 32px on light + dark, plus a 2x nearest-neighbour zoom of the 48px render
    x0, y0 = pad + 3 * (cell + pad), 24 + (cell + 60)
    d.rectangle([x0, y0, x0 + cell, y0 + cell], fill=(255, 255, 255, 255))
    d.rectangle([x0 + cell // 2, y0, x0 + cell, y0 + cell], fill=(24, 26, 32, 255))
    for i, px in enumerate((48, 32)):
        tile = adaptive_mask_view(bg, fg, squircle_mask).resize((px, px), Image.LANCZOS)
        for ox in (6, cell // 2 + 6):
            sheet.alpha_composite(tile, (x0 + ox, y0 + 8 + i * 58))
    zoom = adaptive_mask_view(bg, fg, circle_mask).resize((48, 48), Image.LANCZOS).resize((96, 96), Image.NEAREST)
    sheet.alpha_composite(zoom, (x0 + 6, y0 + 118))
    d.text((x0, y0 + cell + 8), "48px / 32px actual, 48px x2 zoom", fill=(30, 30, 30, 255), font=font(14))
    sheet.save(HERE / "preview-masks.png", optimize=True)


def main():
    (HERE / "ic_launcher_foreground.svg").write_text(svg_foreground(), encoding="utf-8")
    (HERE / "ic_launcher_background.svg").write_text(svg_background(), encoding="utf-8")
    (HERE / "ic_launcher_monochrome.svg").write_text(svg_monochrome(), encoding="utf-8")
    (HERE / "icon-master.svg").write_text(svg_master(), encoding="utf-8")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        icon512 = render(browser, "icon-master.svg", 512, 512)
        icon512.save(HERE / "icon-512.png", optimize=True)
        assets = {
            "bg": render(browser, "ic_launcher_background.svg", 432, 432),
            "fg": render(browser, "ic_launcher_foreground.svg", 432, 432, transparent=True),
            "mono": render(browser, "ic_launcher_monochrome.svg", 432, 432, transparent=True),
        }
        browser.close()
    build_previews(assets)
    with Image.open(HERE / "icon-512.png") as im:
        assert im.size == (512, 512) and im.getchannel("A").getextrema() == (255, 255), "icon-512 must be opaque 512x512"
    print("ok")


if __name__ == "__main__":
    sys.exit(main())
