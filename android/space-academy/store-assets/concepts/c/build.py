#!/usr/bin/env python3
"""Concept C - 'Mascot close-up'. Generates the SVGs (hand-wobbled comic art) and renders every PNG.

Usage:  python build.py        (needs: pip install playwright pillow ; playwright install chromium)
Writes (all inside this folder):
  icon-master.svg (512 full-bleed), ic_launcher_{foreground,background,monochrome}.svg (108dp),
  icon-512.png, preview-masks.png
"""
import io
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
SS = 4

INK, CREAM, ORANGE, GOLD, BLUE, NIGHT = "#2b2b2b", "#fffdf8", "#ff6a28", "#f5b82e", "#4a8fe0", "#2f3650"
FUR, FUR_D, MUZ = "#b9855a", "#8e6040", "#efe6d2"
SHADOW = "#161a2a"  # hard offset shadow: a darker night so it still reads on the night-blue ground
SW = 7.5            # thick ink outline, art-space units

# ---------------------------------------------------------------- hand-drawn wobble
_rng = random.Random(11)
WOB = 2.2   # hand-drawn wobble strength multiplier


def _smooth_closed(pts):
    """Closed Catmull-Rom spline -> cubic bezier path string."""
    n = len(pts)
    d = f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"
    for i in range(n):
        p0, p1, p2, p3 = pts[(i - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return d + "Z"


def wob_ellipse(cx, cy, rx, ry, amp=1.3, n=26, rot=0.0):
    amp *= WOB
    a1, a2, a3 = (_rng.uniform(0, 6.28) for _ in range(3))
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        k = 1 + amp / max(rx, ry) * (0.55 * math.sin(2 * t + a1) + 0.3 * math.sin(3 * t + a2) + 0.25 * math.sin(5 * t + a3))
        x, y = math.cos(t) * rx * k, math.sin(t) * ry * k
        c, s = math.cos(rot), math.sin(rot)
        pts.append((cx + x * c - y * s, cy + x * s + y * c))
    return _smooth_closed(pts)


def wob_poly(points, amp=0.9, sub=4):
    """Wobbly closed polygon with softly rounded corners (points: list of (x,y))."""
    amp *= WOB
    out = []
    n = len(points)
    for i in range(n):
        a, b = points[i], points[(i + 1) % n]
        for j in range(sub):
            t = j / sub
            out.append((a[0] + (b[0] - a[0]) * t + _rng.uniform(-amp, amp), a[1] + (b[1] - a[1]) * t + _rng.uniform(-amp, amp)))
    return _smooth_closed(out)


def wob_arc(cx, cy, r, a0, a1, amp=0.8, n=10):
    pts = []
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        rr = r + _rng.uniform(-amp, amp)
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d = f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"
    for i in range(len(pts) - 1):
        p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, len(pts) - 1)]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return d


def star_pts(cx, cy, ro, ri, rot=-90):
    pts = []
    for i in range(10):
        a = math.radians(rot + i * 36)
        r = ro if i % 2 == 0 else ri
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


# ---------------------------------------------------------------- shapes (art space, 200x200, centre 100,100, safe radius 100)
HC = (100, 92)           # helmet centre
SUIT = wob_poly([(50, 186), (48, 174), (58, 164), (76, 158), (124, 158), (142, 164), (152, 174), (150, 186)], amp=0.9, sub=3)
NECK = wob_poly([(66, 156), (66, 172), (134, 172), (134, 156)], amp=0.8, sub=3)
RIM = wob_ellipse(HC[0], HC[1], 76, 76, amp=1.4)
GLASS = wob_ellipse(HC[0], HC[1], 57, 57, amp=1.2)
HEAD_C = (100, 100)
EAR_L = wob_ellipse(71, 59, 12.5, 12.5, amp=0.8, n=16)
EAR_R = wob_ellipse(129, 59, 12.5, 12.5, amp=0.8, n=16)
HEAD = wob_ellipse(HEAD_C[0], HEAD_C[1], 40, 40, amp=1.1)
WOB = 0.9   # small props get a gentler wobble so they stay readable

ROCKET_BODY = wob_poly([(0, -27), (10, -14), (12, 8), (9, 17), (-9, 17), (-12, 8), (-10, -14)], amp=0.7, sub=3)
ROCKET_FIN_L = wob_poly([(-10, 2), (-22, 16), (-21, 24), (-8, 15)], amp=0.5, sub=2)
ROCKET_FIN_R = wob_poly([(10, 2), (22, 16), (21, 24), (8, 15)], amp=0.5, sub=2)
ROCKET_FLAME = wob_poly([(-6, 19), (0, 31), (6, 19)], amp=0.6, sub=3)
ROCKET_WIN = wob_ellipse(0, -4, 5.6, 5.6, amp=0.5, n=14)
ROCKET_XF = "translate(166 40) rotate(42) scale(0.85)"
STAR = wob_poly(star_pts(0, 0, 21, 9.5), amp=0.7, sub=2)
WOB = 2.2
STAR_XF = "translate(38 158) rotate(-14)"
FACE_XF = "translate(100 100) scale(1.65) translate(-32 -34)"   # Ringo's own 64x64 face coordinates
MUZZLE = wob_ellipse(32, 43, 15, 11, amp=0.25, n=18)
MOUTH = "M23.5 41.5Q32 53 40.5 41.5Z"
GLARE = wob_arc(HC[0], HC[1], 45, 188, 228, amp=0.5)
GLARE2 = wob_arc(HC[0], HC[1], 45, 238, 252, amp=0.3, n=3)


def halftone(x0, y0, x1, y1, step, rmax, falloff, color, ref):
    """Grid of dots whose radius shrinks with distance from `ref` (comic halftone)."""
    out = []
    y = y0
    row = 0
    while y <= y1:
        x = x0 + (step / 2 if row % 2 else 0)
        while x <= x1:
            dist = math.hypot(x - ref[0], y - ref[1])
            r = rmax * max(0.0, 1 - dist / falloff)
            if r > 0.35:
                out.append(f'<circle cx="{x + _rng.uniform(-.25, .25):.1f}" cy="{y + _rng.uniform(-.25, .25):.1f}" r="{r:.2f}"/>')
            x += step
        y += step * 0.866
        row += 1
    return f'<g fill="{color}">' + "".join(out) + "</g>"


def shape(d, fill, sw=SW, shadow=(6, 7)):
    s = ""
    if shadow:
        s += f'<path d="{d}" transform="translate({shadow[0]} {shadow[1]})" fill="{SHADOW}" stroke="{SHADOW}" stroke-width="{sw}" stroke-linejoin="round"/>'
    return s + f'<path d="{d}" fill="{fill}" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round"/>'


def art_group():
    glass_dots = halftone(60, 60, 150, 150, 6.5, 2.6, 62, "#7db3ee", (150, 150))
    rim_dots = halftone(30, 30, 175, 175, 6.5, 2.4, 80, "#e3d7bb", (170, 160))
    o = [
        f'<path d="{wob_arc(HC[0], HC[1], 90, -78, -22, amp=0.6, n=6)}" fill="none" stroke="{CREAM}" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="9 9"/>',
        f'<path d="{wob_arc(HC[0], HC[1], 90, 118, 172, amp=0.6, n=6)}" fill="none" stroke="{CREAM}" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="9 9"/>',
        shape(RIM, CREAM, shadow=(8, 9)),
        f'<clipPath id="rimc"><path d="{RIM}"/></clipPath><g clip-path="url(#rimc)">{rim_dots}</g>',
        f'<path d="{RIM}" fill="none" stroke="{INK}" stroke-width="{SW}"/>',
        f'<path d="{GLASS}" fill="{BLUE}"/>',
        f'<clipPath id="glc"><path d="{GLASS}"/></clipPath>',
        f'<g clip-path="url(#glc)">{glass_dots}',
        f'<path d="{EAR_L}" fill="{FUR}" stroke="{INK}" stroke-width="6"/><path d="{EAR_R}" fill="{FUR}" stroke="{INK}" stroke-width="6"/>',
        f'<circle cx="71" cy="60" r="4.5" fill="{FUR_D}"/><circle cx="129" cy="60" r="4.5" fill="{FUR_D}"/>',
        f'<path d="{HEAD}" fill="{FUR}" stroke="{INK}" stroke-width="{SW}"/>',
        f'<g transform="{FACE_XF}">',
        f'<path d="{MUZZLE}" fill="{MUZ}" stroke="{INK}" stroke-width="2.4"/>',
        f'<circle cx="14.5" cy="38.5" r="3" fill="#e88a5e"/><circle cx="49.5" cy="38.5" r="3" fill="#e88a5e"/>',
        f'<circle cx="23" cy="29" r="4.7" fill="{INK}"/><circle cx="41" cy="29" r="4.7" fill="{INK}"/>',
        f'<circle cx="24.6" cy="27.3" r="1.8" fill="#fff"/><circle cx="42.6" cy="27.3" r="1.8" fill="#fff"/>',
        f'<circle cx="22.2" cy="31" r=".8" fill="#fff"/><circle cx="40.2" cy="31" r=".8" fill="#fff"/>',
        f'<path d="M17 21.5q6-4.2 11-1.2M47 21.5q-6-4.2-11-1.2" fill="none" stroke="{INK}" stroke-width="2.8" stroke-linecap="round"/>',
        f'<ellipse cx="32" cy="37" rx="4.6" ry="3.2" fill="{INK}"/>',
        f'<clipPath id="mc"><path d="{MOUTH}"/></clipPath>',
        f'<path d="{MOUTH}" fill="{INK}"/><ellipse cx="32" cy="50.5" rx="5.5" ry="4" fill="{ORANGE}" clip-path="url(#mc)"/>',
        f'<path d="{MOUTH}" fill="none" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>',
        '</g></g>',
        f'<path d="{GLASS}" fill="none" stroke="{INK}" stroke-width="{SW}"/>',
        f'<path d="{GLARE}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>',
        f'<path d="{GLARE2}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>',
        f'<g transform="{ROCKET_XF}">',
        shape(ROCKET_FLAME, GOLD, sw=5.5, shadow=None),
        shape(ROCKET_FIN_L, GOLD, sw=5.5, shadow=None), shape(ROCKET_FIN_R, GOLD, sw=5.5, shadow=None),
        shape(ROCKET_BODY, CREAM, sw=6, shadow=(5, 6)),
        f'<path d="M0 -27L10 -14 -10 -14Z" fill="{ORANGE}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>',
        f'<path d="{ROCKET_BODY}" fill="none" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>',
        f'<path d="{ROCKET_WIN}" fill="{BLUE}" stroke="{INK}" stroke-width="4.5"/>',
        '</g>',
        f'<g transform="{STAR_XF}">', shape(STAR, GOLD, sw=6.5, shadow=(5, 6)),
        f'<path d="M-7 -4Q-4 -9 0 -11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>',
        f'<path d="M168 112v14M161 119h14" stroke="{CREAM}" stroke-width="4.5" stroke-linecap="round"/>',
        f'<circle cx="30" cy="62" r="3.6" fill="{CREAM}"/>',
    ]
    return "".join(o)


def mono_mask():
    """White = opaque in the themed icon; black strokes keep layers visually separate."""
    gap = 'stroke="#000" stroke-width="5" stroke-linejoin="round"'
    return f'''<mask id="m" maskUnits="userSpaceOnUse" x="-100" y="-100" width="400" height="400">
<path d="{RIM}" fill="#fff" {gap}/>
<path d="{GLASS}" fill="#000"/>
<clipPath id="glc"><path d="{GLASS}"/></clipPath>
<g clip-path="url(#glc)">
<path d="{EAR_L}" fill="#fff" {gap}/><path d="{EAR_R}" fill="#fff" {gap}/>
<path d="{HEAD}" fill="#fff" {gap}/>
<g transform="{FACE_XF}">
<path d="{MUZZLE}" fill="none" stroke="#000" stroke-width="2.6"/>
<circle cx="23" cy="29" r="4.7" fill="#000"/><circle cx="41" cy="29" r="4.7" fill="#000"/>
<path d="M17 21.5q6-4.2 11-1.2M47 21.5q-6-4.2-11-1.2" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="32" cy="37" rx="4.6" ry="3.2" fill="#000"/><path d="{MOUTH}" fill="#000"/>
</g></g>
<path d="{GLARE}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
<g transform="{ROCKET_XF}">
<path d="{ROCKET_FLAME}" fill="#fff" {gap}/><path d="{ROCKET_FIN_L}" fill="#fff" {gap}/><path d="{ROCKET_FIN_R}" fill="#fff" {gap}/>
<path d="{ROCKET_BODY}" fill="#fff" {gap}/><path d="{ROCKET_WIN}" fill="#000"/>
</g>
<g transform="{STAR_XF}"><path d="{STAR}" fill="#fff" {gap}/></g>
</mask>'''


def bg_group():
    """108x108 flat night-blue ground, comic sunburst + halftone dots. No outlines (it is cropped by the mask)."""
    rays = []
    for i in range(0, 20, 2):
        a0, a1 = math.radians(i * 18 + 4), math.radians(i * 18 + 22)
        rays.append(f"M54 54L{54 + 90 * math.cos(a0):.1f} {54 + 90 * math.sin(a0):.1f}L{54 + 90 * math.cos(a1):.1f} {54 + 90 * math.sin(a1):.1f}Z")
    dots_br = halftone(40, 46, 112, 112, 5.2, 2.0, 62, "#4b5784", (108, 108))
    dots_tl = halftone(-4, -4, 60, 60, 5.2, 1.7, 46, "#445077", (-4, -4))
    return (f'<rect width="108" height="108" fill="{NIGHT}"/>'
            f'<path d="{" ".join(rays)}" fill="#363e5e"/>'
            f'{dots_br}{dots_tl}'
            f'<path d="M96 14l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3Z" fill="{CREAM}"/>'
            f'<path d="M11 86l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1Z" fill="{CREAM}"/>'
            f'<circle cx="14" cy="30" r="1.3" fill="{CREAM}"/><circle cx="88" cy="94" r="1.2" fill="{CREAM}"/><circle cx="72" cy="8" r="1.1" fill="{CREAM}"/>')


ART_T = "translate(54 54) scale(0.33) translate(-100 -100)"          # 66dp safe circle
MASTER_T = "translate(256 256) scale(2.3) translate(-100 -100)"      # bigger crop for the full-bleed store icon


def write_svgs():
    fg = f'<g transform="{ART_T}">{art_group()}</g>'
    mono = f'<defs>{mono_mask()}</defs><g transform="{ART_T}"><rect x="-100" y="-100" width="400" height="400" fill="#fff" mask="url(#m)"/></g>'
    head = '<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">'
    (HERE / "ic_launcher_background.svg").write_text(
        f'{head}<!-- Concept C background: flat night blue, comic sunburst, halftone dots. -->{bg_group()}</svg>\n', encoding="utf-8")
    (HERE / "ic_launcher_foreground.svg").write_text(
        f'{head}<!-- Concept C foreground: Ringo in a space helmet; all key art inside the central 66dp circle. -->{fg}</svg>\n', encoding="utf-8")
    (HERE / "ic_launcher_monochrome.svg").write_text(
        f'{head}<!-- Themed-icon silhouette: alpha only, the system tints it. -->{mono}</svg>\n', encoding="utf-8")
    (HERE / "icon-master.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">'
        f'<!-- Concept C: Mascot close-up. Full-bleed, no text, no baked-in rounding. -->'
        f'<g transform="scale(4.740741)">{bg_group()}</g><g transform="{MASTER_T}">{art_group()}</g></svg>\n', encoding="utf-8")


# ---------------------------------------------------------------- rendering
def render(browser, svg_name, width, height, transparent=False):
    page = browser.new_page(viewport={"width": width, "height": height})
    page.goto((HERE / svg_name).as_uri())
    intrinsic = page.evaluate("document.documentElement.width.baseVal.value")
    page.close()
    page = browser.new_page(viewport={"width": round(intrinsic), "height": round(intrinsic)}, device_scale_factor=width / intrinsic)
    page.goto((HERE / svg_name).as_uri())
    png = page.screenshot(omit_background=transparent, type="png")
    page.close()
    img = Image.open(io.BytesIO(png)).convert("RGBA")
    return img if img.size == (width, height) else img.resize((width, height), Image.LANCZOS)


def rounded_mask(size, frac):
    big = Image.new("L", (size * SS, size * SS), 0)
    ImageDraw.Draw(big).rounded_rectangle([0, 0, size * SS - 1, size * SS - 1], radius=frac * size * SS, fill=255)
    return big.resize((size, size), Image.LANCZOS)


def circle_mask(size):
    big = Image.new("L", (size * SS, size * SS), 0)
    ImageDraw.Draw(big).ellipse([0, 0, size * SS - 1, size * SS - 1], fill=255)
    return big.resize((size, size), Image.LANCZOS)


def squircle_mask(size, n=4.0):
    bn = size * SS
    pts = []
    for i in range(720):
        t = 2 * math.pi * i / 720
        c, s = math.cos(t), math.sin(t)
        pts.append(((math.copysign(abs(c) ** (2 / n), c) + 1) / 2 * (bn - 1), (math.copysign(abs(s) ** (2 / n), s) + 1) / 2 * (bn - 1)))
    big = Image.new("L", (bn, bn), 0)
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
            pass
    return ImageFont.load_default()


def adaptive_view(bg, fg, shape_fn):
    size = bg.width
    comp = Image.alpha_composite(bg, fg)
    vis = round(size * 72 / 108)
    off = (size - vis) // 2
    return masked(comp.crop((off, off, off + vis, off + vis)), shape_fn(vis))


def build_previews(bg, fg, mono):
    cell, pad, lab = 216, 24, 60
    sheet = Image.new("RGBA", (pad + 4 * (cell + pad), 2 * (cell + lab) + 30), (236, 238, 242, 255))
    d = ImageDraw.Draw(sheet)

    def put(img, col, row, label):
        x, y = pad + col * (cell + pad), 24 + row * (cell + lab)
        sheet.alpha_composite(img.resize((cell, cell), Image.LANCZOS), (x, y))
        d.text((x, y + cell + 8), label, fill=(30, 30, 30, 255), font=font(14))

    for col, (name, fn) in enumerate([("Circle", circle_mask), ("Squircle", squircle_mask), ("Rounded sq.", lambda s: rounded_mask(s, 0.28))]):
        put(adaptive_view(bg, fg, fn), col, 0, name + " mask, 72dp window")

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
    for col, (bgc, ink, name, fn) in enumerate(themes):
        base = Image.new("RGBA", mono.size, bgc)
        t = Image.new("RGBA", mono.size, (0, 0, 0, 0))
        t.paste(Image.new("RGBA", mono.size, ink), (0, 0), alpha)
        put(masked(Image.alpha_composite(base, t).crop((off, off, off + vis, off + vis)), fn(vis)), col, 1, name)

    # small-size panel: real 48px / 72px circle, 48px squircle, and 48px zoomed 3x with nearest-neighbour
    x0, y0 = pad + 3 * (cell + pad), 24 + (cell + lab)
    panel = Image.new("RGBA", (cell, cell), (255, 255, 255, 255))
    circ = adaptive_view(bg, fg, circle_mask)
    panel.alpha_composite(circ.resize((48, 48), Image.LANCZOS), (8, 10))
    panel.alpha_composite(circ.resize((72, 72), Image.LANCZOS), (64, 10))
    panel.alpha_composite(adaptive_view(bg, fg, squircle_mask).resize((48, 48), Image.LANCZOS), (150, 10))
    panel.alpha_composite(circ.resize((48, 48), Image.LANCZOS).resize((144, 144), Image.NEAREST), (8, 80))
    pd = ImageDraw.Draw(panel)
    pd.text((160, 100), "48px", fill=(30, 30, 30, 255), font=font(13))
    pd.text((160, 118), "zoom 3x", fill=(30, 30, 30, 255), font=font(13))
    sheet.alpha_composite(panel, (x0, y0))
    d.text((x0, y0 + cell + 8), "Small: 48 / 72 / 48 + zoom", fill=(30, 30, 30, 255), font=font(14))
    sheet.save(HERE / "preview-masks.png", optimize=True)


def main():
    write_svgs()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        icon = render(browser, "icon-master.svg", 512, 512)
        icon.save(HERE / "icon-512.png", optimize=True)
        bg = render(browser, "ic_launcher_background.svg", 432, 432)
        fg = render(browser, "ic_launcher_foreground.svg", 432, 432, transparent=True)
        mono = render(browser, "ic_launcher_monochrome.svg", 432, 432, transparent=True)
        browser.close()
    build_previews(bg, fg, mono)
    print("icon-512 alpha extrema:", icon.getchannel("A").getextrema(), "| preview ->", HERE / "preview-masks.png")


if __name__ == "__main__":
    main()
