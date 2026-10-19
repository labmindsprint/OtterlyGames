"""Concept B 'Comic panel' artwork generator. Emits the SVG masters; build.py rasterises them."""
import math
import random

INK, CREAM, ORANGE, GOLD, BLUE, NIGHT = "#2b2b2b", "#fffdf8", "#ff6a28", "#f5b82e", "#4a8fe0", "#2f3650"
RED = "#e8342a"
FLAME_PALE, SILVER, GREY = "#fde9a8", "#d9d6cf", "#8a8780"
PANEL = dict(x=50, y=108, w=380, h=334, rx=40)
SHIP = dict(cx=268, cy=158, s=0.94, rot=33)
CENTRE_Y = 250  # art spans y 36..458, so the adaptive layers centre on y=250
K = 0.14  # 512-space -> 108dp scale for the adaptive layers

WOBBLE = ('<filter id="wob" x="-6%" y="-6%" width="112%" height="112%">'
          '<feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="7" result="n"/>'
          '<feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/></filter>')


class Pen:
    """Colour mapper: full colour, or white-on-black mask art for the Android 13 themed layer."""

    def __init__(self, mono=False):
        self.mono = mono

    def f(self, color, cut=False):
        if not self.mono:
            return color
        return "#000" if cut else "#fff"

    def st(self):
        return "#000" if self.mono else INK


def ln(p, w):
    return f'stroke="{p.st()}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"'


def path(p, d, fill, w=3, cut=False):
    return f'<path d="{d}" fill="{p.f(fill, cut)}" {ln(p, w)}/>'


def circ(p, cx, cy, r, fill, w=3, cut=False):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{p.f(fill, cut)}" {ln(p, w)}/>'


def ell(p, cx, cy, rx, ry, fill, w=3, cut=False):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{p.f(fill, cut)}" {ln(p, w)}/>'


def line(p, d, w=2, color=None, op=1):
    if p.mono and color is not None:
        return ""
    return f'<path d="{d}" fill="none" stroke="{color or p.st()}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" opacity="{op}"/>'


def mirror(s):
    return f'<g transform="translate(300 0) scale(-1 1)">{s}</g>'


def star_pts(cx, cy, n, r_out, r_in, rot=0, jitter=0.0, seed=1):
    rnd = random.Random(seed)
    pts = []
    for i in range(n * 2):
        r = (r_out if i % 2 == 0 else r_in) * (1 + rnd.uniform(-jitter, jitter))
        a = math.radians(rot) + math.pi * i / n
        pts.append((cx + r * math.sin(a), cy - r * math.cos(a)))
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z"


def sparkle(cx, cy, r, color):
    k = r * 0.22
    return (f'<path d="M{cx} {cy - r} Q{cx + k} {cy - k} {cx + r} {cy} Q{cx + k} {cy + k} {cx} {cy + r} '
            f'Q{cx - k} {cy + k} {cx - r} {cy} Q{cx - k} {cy - k} {cx} {cy - r}Z" fill="{color}"/>')


def ringo(p):
    if p.mono:
        return (
            '<g transform="translate(150 199) scale(0.72) translate(-32 -34)">'
            '<circle cx="14" cy="16" r="8" fill="#fff"/><circle cx="50" cy="16" r="8" fill="#fff"/>'
            '<circle cx="32" cy="34" r="25" fill="#fff"/>'
            '<circle cx="23" cy="29" r="4.4" fill="#000"/><circle cx="41" cy="29" r="4.4" fill="#000"/>'
            '<path d="M24 41q8 10 16 0Z" fill="#000" stroke="#000" stroke-width="3" stroke-linejoin="round"/></g>'
        )
    return (
        '<g transform="translate(150 199) scale(0.72) translate(-32 -34)">'
        '<circle cx="14" cy="16" r="8" fill="#b9855a" stroke="#2b2b2b" stroke-width="3.6"/><circle cx="50" cy="16" r="8" fill="#b9855a" stroke="#2b2b2b" stroke-width="3.6"/>'
        '<circle cx="32" cy="34" r="25" fill="#b9855a" stroke="#2b2b2b" stroke-width="3.6"/>'
        '<ellipse cx="32" cy="43" rx="15" ry="11" fill="#efe6d2" stroke="#2b2b2b" stroke-width="2.8"/>'
        '<circle cx="23" cy="29" r="4.2" fill="#2b2b2b"/><circle cx="41" cy="29" r="4.2" fill="#2b2b2b"/>'
        '<circle cx="24.4" cy="27.6" r="1.4" fill="#fff"/><circle cx="42.4" cy="27.6" r="1.4" fill="#fff"/>'
        '<ellipse cx="32" cy="37" rx="4.2" ry="3" fill="#2b2b2b"/>'
        '<path d="M24 41q8 10 16 0Z" fill="#fff" stroke="#2b2b2b" stroke-width="3.2" stroke-linejoin="round"/></g>'
    )


# ---------- ship (PP1 Bubble Pod drawing language from js/space-academy/pitstop/ships/pp1.mjs) ----------
def ship_parts(p):
    body = (
        circ(p, 150, 215, 88, CREAM, 4)
        + ("" if p.mono else f'<path d="M233.7 207.7 A84 84 0 0 1 142.7 298.7 A110 110 0 0 0 233.7 207.7 Z" fill="{INK}" opacity=".16"/>')
        + line(p, "M76.7 188.3 A78 78 0 0 1 123.3 141.7", 6, "#ffffff", 0.95)
        + line(p, "M71 250 Q150 276 229 250", 3, GREY)
        + "".join(circ(p, x, y, 2.8, CREAM, 1.8) for x, y in [(90, 255.5), (115, 260.4), (150, 263), (185, 260.4), (210, 255.5)])
        + ell(p, 150, 131, 21, 6, SILVER, 3)
        + ell(p, 150, 301, 25, 7, SILVER, 3)
    )
    window = (
        circ(p, 150, 195, 42, SILVER, 4)
        + circ(p, 150, 195, 31, "#d3e6fb", 3.4, cut=True)
        + ("" if p.mono else f'<path d="M150 164 A31 31 0 0 1 150 226 A44 44 0 0 0 150 164 Z" fill="{BLUE}" opacity=".3"/>')
        + ringo(p)
        + line(p, "M122 178 Q127 168 142 165", 5, "#ffffff", 0.95)
    )
    fin = (
        path(p, "M66 194 C46 184 30 166 26 142 C12 186 14 244 52 270 C62 270 70 264 73.8 259 A88 88 0 0 1 65 192.2 Z", ORANGE, 4)
        + line(p, "M35 170 C30 204 36 236 56 258", 2.4, "#ffffff", 0.7)
        + circ(p, 62, 200, 3.4, GOLD, 2)
    )
    nozzle = (
        path(p, "M126 306 H174 L186 334 H114 Z", SILVER, 3.6)
        + ell(p, 150, 334, 36, 7.5, NIGHT, 3.4, cut=True)
        + path(p, "M122 300 H178 V310 H122 Z", GREY, 3.4)
    )
    antenna = (
        ell(p, 150, 128, 15, 5.5, SILVER, 3)
        + f'<path d="M150 126 L150 72" fill="none" stroke="{p.st()}" stroke-width="11" stroke-linecap="round"/>'
        + f'<path d="M150 126 L150 72" fill="none" stroke="{p.f(SILVER)}" stroke-width="5" stroke-linecap="round"/>'
        + circ(p, 150, 57, 13.5, GOLD, 3.6)
        + line(p, "M144 52 Q147 48 152 48", 3, "#ffffff", 0.95)
    )
    flame = (
        path(p, "M116 336 C108 368 134 392 150 424 C166 392 192 368 184 336 Z", GOLD, 3.6)
        + path(p, "M130 336 C128 360 142 376 150 396 C158 376 172 360 170 336 Z", FLAME_PALE, 3)
    )
    return flame, nozzle, fin, body, window, antenna


def ship(p):
    flame, nozzle, fin, body, window, antenna = ship_parts(p)
    return (f'<g transform="translate({SHIP["cx"]} {SHIP["cy"]}) rotate({SHIP["rot"]}) scale({SHIP["s"]}) translate(-150 -215)">'
            + flame + nozzle + fin + mirror(fin) + body + window + antenna + "</g>")


def ship_shadow(dx=13, dy=13):
    return (f'<g transform="translate({SHIP["cx"] + dx} {SHIP["cy"] + dy}) rotate({SHIP["rot"]}) scale({SHIP["s"]}) translate(-150 -215)" fill="{INK}">'
            '<circle cx="150" cy="215" r="90"/>'
            '<path d="M66 194 C46 184 30 166 26 142 C12 186 14 244 52 270 L74 259Z"/>'
            '<path d="M234 194 C254 184 270 166 274 142 C288 186 286 244 248 270 L226 259Z"/>'
            '<path d="M126 306 H174 L186 334 H114Z"/><circle cx="150" cy="57" r="15"/></g>')


# ---------- panel contents ----------
def halftone(p):
    if p.mono:
        return ""
    out = []
    step = 17
    for j in range(-4, 40):
        for i in range(-4, 40):
            x = PANEL["x"] + i * step + (step / 2 if j % 2 else 0)
            y = PANEL["y"] + j * step * 0.866
            d = math.hypot(x - (PANEL["x"] + 10), y - (PANEL["y"] + PANEL["h"] - 10))
            d2 = math.hypot(x - (PANEL["x"] + 10), y - (PANEL["y"] + 10))
            r = 7.2 * max(0, 1 - d / 330) + 4.0 * max(0, 1 - d2 / 190)
            if r > 0.9:
                out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}"/>')
    return '<g clip-path="url(#pclip)" fill="#4d5b8f">' + "".join(out) + "</g>"


def burst(p):
    cx, cy = 160, 332
    outer = star_pts(cx, cy, 11, 108, 70, rot=214, jitter=0.12, seed=4)
    mid = star_pts(cx, cy, 11, 82, 52, rot=216, jitter=0.1, seed=9)
    core = star_pts(cx, cy, 9, 54, 36, rot=210, jitter=0.1, seed=2)
    shadow = "" if p.mono else f'<g transform="translate(10 10)"><path d="{outer}" fill="{INK}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/></g>'
    return (shadow + path(p, outer, ORANGE, 6) + path(p, mid, GOLD, 5) + path(p, core, FLAME_PALE, 4)
            + circ(p, 76, 408, 13, CREAM, 4.5) + circ(p, 100, 424, 7, CREAM, 4))


def pow_spark(p):
    cx, cy = 350, 352
    big = star_pts(cx, cy, 9, 64, 34, rot=8, jitter=0.1, seed=11)
    inner = star_pts(cx, cy, 9, 38, 22, rot=28, jitter=0.1, seed=5)
    shadow = "" if p.mono else f'<g transform="translate(9 9)"><path d="{big}" fill="{INK}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/></g>'
    hl = "#000" if p.mono else CREAM
    return (shadow + path(p, big, GOLD, 6) + path(p, inner, FLAME_PALE, 4.5)
            + f'<path d="M{cx - 14} {cy - 4} Q{cx - 8} {cy - 18} {cx + 4} {cy - 20}" fill="none" stroke="{hl}" stroke-width="6" stroke-linecap="round"/>')


def speed_lines(p):
    c = "#fff" if p.mono else CREAM
    return "".join(f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" opacity="0.9"/>'
                   for d, w in [("M330 262 L300 306", 8), ("M366 236 L344 268", 6)])


def stars_layer(p):
    c = "#fff" if p.mono else CREAM
    g = "#fff" if p.mono else GOLD
    out = "".join(sparkle(x, y, r, col) for x, y, r, col in [(106, 170, 18, c), (150, 232, 9, g), (412, 232, 16, c), (376, 190, 8, c), (200, 150, 8, g)])
    out += "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{col}"/>' for x, y, r, col in
                   [(96, 258, 4.5, c), (420, 140, 4.5, g), (250, 410, 4.5, c), (330, 404, 4, c), (124, 132, 4, c)])
    return out


def panel(p):
    P = PANEL
    rect = f'x="{P["x"]}" y="{P["y"]}" width="{P["w"]}" height="{P["h"]}" rx="{P["rx"]}"'
    shadow = "" if p.mono else f'<rect {rect} transform="translate(22 22)" fill="{INK}"/>'
    night = "" if p.mono else f'<rect {rect} fill="{NIGHT}"/>'
    frame = f'<rect {rect} fill="none" stroke="{"#fff" if p.mono else INK}" stroke-width="18"/>'
    return (shadow + night + halftone(p)
            + f'<g clip-path="url(#pclip)">{stars_layer(p)}{speed_lines(p)}{burst(p)}{pow_spark(p)}</g>' + frame)


def osa(p):
    """NASA 'worm' style OSA: monoline geometric letters, crossbar-less A, drawn as strokes (no font dependency)."""
    o = '<ellipse cx="160" cy="412" rx="31" ry="30"/>'
    s = '<path d="M277 392 C269 379 233 377 231 396 C229 413 275 410 275 430 C275 449 236 449 224 434"/>'
    a = '<path d="M306 444 L346 383 L386 444" stroke-linejoin="miter"/>'
    glyphs = o + s + a
    base = 'fill="none" stroke-linecap="round" stroke-linejoin="round"'
    fill = "#fff" if p.mono else RED
    xf = 'transform="translate(256 404) scale(1.04) translate(-254 -412)"'
    shadow = "" if p.mono else f'<g {base} stroke="{INK}" stroke-width="38" transform="translate(9 9)"><g {xf}>{glyphs}</g></g>'
    outline = f'<g {base} stroke="{p.st()}" stroke-width="38"><g {xf}>{glyphs}</g></g>'
    main = f'<g {base} stroke="{fill}" stroke-width="24"><g {xf}>{glyphs}</g></g>'
    swoosh = "" if p.mono else (f'<path d="M92 463 Q256 436 420 463 Q256 455 92 463 Z" fill="{CREAM}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>')
    return shadow + outline + main + swoosh


def art(mono=False):
    p = Pen(mono)
    defs = (f'<clipPath id="pclip"><rect x="{PANEL["x"]}" y="{PANEL["y"]}" width="{PANEL["w"]}" height="{PANEL["h"]}" rx="{PANEL["rx"]}"/></clipPath>'
            + WOBBLE)
    body = panel(p) + ("" if mono else ship_shadow()) + ship(p) + osa(p)
    return defs, f'<g filter="url(#wob)">{body}</g>'


def background_dots():
    out = []
    step = 26
    for j in range(-1, 24):
        for i in range(-1, 24):
            x = i * step + (step / 2 if j % 2 else 0)
            y = j * step * 0.866
            r = 5.8 * max(0, 1 - math.hypot(x - 512, y) / 250) + 5.8 * max(0, 1 - math.hypot(x, y - 512) / 250)
            if r > 0.8:
                out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}"/>')
    return f'<g fill="#ffc9a8">{"".join(out)}</g>'


def master_svg():
    defs, a = art()
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">\n'
            '  <!-- Concept B "Comic panel": cream paper, ink outlines, flat colours, hard offset shadows, halftone. No text. -->\n'
            f'  <defs>{defs}</defs>\n  <rect width="512" height="512" fill="{CREAM}"/>\n  {background_dots()}\n  {a}\n</svg>\n')


def layer_svg(kind):
    t = f'translate(54 54) scale({K}) translate(-256 -{CENTRE_Y})'
    head = '<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">\n'
    if kind == "bg":
        return (head + '  <!-- Adaptive background: cream paper with orange halftone corners. -->\n'
                f'  <rect width="108" height="108" fill="{CREAM}"/>\n  <g transform="scale({108 / 512:.5f})">{background_dots()}</g>\n</svg>\n')
    if kind == "fg":
        defs, a = art()
        return (head + '  <!-- Adaptive foreground: panel + rocket; key art sits inside the central 66dp circle. -->\n'
                f'  <defs>{defs}</defs>\n  <g transform="{t}">{a}</g>\n</svg>\n')
    defs, a = art(mono=True)
    return (head + '  <!-- Themed layer: alpha only. -->\n'
            f'  <defs>{defs}<mask id="m" maskUnits="userSpaceOnUse" x="-100" y="-100" width="712" height="712">{a}</mask></defs>\n'
            f'  <g transform="{t}"><rect x="-100" y="-100" width="712" height="712" fill="#fff" mask="url(#m)"/></g>\n</svg>\n')
