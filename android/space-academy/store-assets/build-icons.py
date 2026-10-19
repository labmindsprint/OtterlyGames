#!/usr/bin/env python3
"""Render every Otterly Space Academy store/launcher asset from the SVG masters in this folder.

Usage (from anywhere):  python build-icons.py
Requires: python 3.10+, `pip install playwright pillow`, and `playwright install chromium`.

Outputs (all inside store-assets/):
  icon-512.png, feature-graphic-1024x500.png, preview-masks.png, preview-small.png
  res/mipmap-{m,h,xh,xxh,xxxh}dpi/ic_launcher{,_round,_foreground,_background,_monochrome}.png
The res/mipmap-anydpi-v26/*.xml files are hand-written and are not touched here.
"""
import io
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
RES = HERE / "res"
DENSITIES = {"mdpi": 1.0, "hdpi": 1.5, "xhdpi": 2.0, "xxhdpi": 3.0, "xxxhdpi": 4.0}
SS = 4  # supersampling factor for PIL masks


def render(browser, svg_name, width, height, transparent=False):
    """Rasterise an SVG at an exact pixel size and return an RGBA PIL image."""
    page = browser.new_page(viewport={"width": width, "height": height})
    page.goto((HERE / svg_name).as_uri())
    intrinsic = page.evaluate("[document.documentElement.width.baseVal.value, document.documentElement.height.baseVal.value]")
    page.close()
    scale = width / intrinsic[0]
    page = browser.new_page(viewport={"width": round(intrinsic[0]), "height": round(intrinsic[1])}, device_scale_factor=scale)
    page.goto((HERE / svg_name).as_uri())
    page.evaluate("document.fonts.ready")
    if svg_name.startswith("feature"):
        if not page.evaluate("document.fonts.check(\"40px 'Patrick Hand'\")"):
            sys.exit("Patrick Hand failed to load for the feature graphic")
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
        x = math.copysign(abs(c) ** (2 / n), c)
        y = math.copysign(abs(s) ** (2 / n), s)
        pts.append(((x + 1) / 2 * (big_n - 1), (y + 1) / 2 * (big_n - 1)))
    big = Image.new("L", (big_n, big_n), 0)
    ImageDraw.Draw(big).polygon(pts, fill=255)
    return big.resize((size, size), Image.LANCZOS)


def masked(img, mask):
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def save_png(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True)


def font(size):
    for name in ("arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def adaptive_mask_view(bg, fg, shape):
    """The launcher shows the central 72dp of the 108dp canvas through the mask."""
    size = bg.width
    comp = Image.alpha_composite(bg, fg)
    vis = round(size * 72 / 108)
    off = (size - vis) // 2
    crop = comp.crop((off, off, off + vis, off + vis))
    return masked(crop, shape(vis))


def build_previews(assets):
    bg, fg, mono = assets["bg"], assets["fg"], assets["mono"]
    cell, pad = 216, 24
    sheet_w = pad + 4 * (cell + pad)
    sheet = Image.new("RGBA", (sheet_w, 2 * (cell + 60) + 30), (236, 238, 242, 255))
    d = ImageDraw.Draw(sheet)

    def put(img, col, row, label):
        x = pad + col * (cell + pad)
        y = 24 + row * (cell + 60)
        sheet.alpha_composite(img.resize((cell, cell), Image.LANCZOS), (x, y))
        d.text((x, y + cell + 8), label, fill=(30, 30, 30, 255), font=font(14))

    shapes = [("Circle", circle_mask), ("Squircle", squircle_mask), ("Rounded sq.", lambda s: rounded_mask(s, 0.28))]
    for col, (name, fn) in enumerate(shapes):
        put(adaptive_mask_view(bg, fg, fn), col, 0, name + " mask, 72dp window")

    # unmasked layers with the 72dp window (red) and 66dp safe zone (yellow)
    size = bg.width
    comp = Image.alpha_composite(bg, fg)
    od = ImageDraw.Draw(comp)
    k = size / 108
    od.rectangle([18 * k, 18 * k, 90 * k, 90 * k], outline=(255, 60, 60, 255), width=max(2, round(size / 100)))
    od.ellipse([21 * k, 21 * k, 87 * k, 87 * k], outline=(255, 230, 0, 255), width=max(2, round(size / 100)))
    put(comp, 3, 0, "108dp: red 72dp, yellow 66dp safe")

    # themed icon: only the monochrome alpha is used; the system tints it
    vis = round(size * 72 / 108)
    off = (size - vis) // 2
    alpha = mono.split()[3]
    themes = [((178, 235, 222, 255), (30, 60, 55, 255), "Themed light, circle", circle_mask),
              ((52, 78, 74, 255), (200, 245, 235, 255), "Themed dark, circle", circle_mask),
              ((232, 222, 248, 255), (51, 37, 74, 255), "Themed lilac, squircle", squircle_mask)]
    for col, (bgcol, ink, name, fn) in enumerate(themes):
        base = Image.new("RGBA", mono.size, bgcol)
        t = Image.new("RGBA", mono.size, (0, 0, 0, 0))
        t.paste(Image.new("RGBA", mono.size, ink), (0, 0), alpha)
        v = Image.alpha_composite(base, t)
        put(masked(v.crop((off, off, off + vis, off + vis)), fn(vis)), col, 1, name)

    # legacy (pre-API 26) icons straight from the staged mipmaps
    legacy = Image.open(RES / "mipmap-xxxhdpi" / "ic_launcher.png").convert("RGBA")
    legacy_round = Image.open(RES / "mipmap-xxxhdpi" / "ic_launcher_round.png").convert("RGBA")
    pair = Image.new("RGBA", (192 * 2 + 12, 192), (0, 0, 0, 0))
    pair.alpha_composite(legacy, (0, 0))
    pair.alpha_composite(legacy_round, (204, 0))
    x = pad + 3 * (cell + pad)
    y = 24 + (cell + 60)
    sheet.alpha_composite(pair.resize((cell, round(cell * 192 / 396))), (x, y + 40))
    d.text((x, y + cell + 8), "Legacy ic_launcher + _round", fill=(30, 30, 30, 255), font=font(14))

    save_png(sheet, HERE / "preview-masks.png")


def build_small_preview(icon512):
    sheet = Image.new("RGBA", (860, 480), (255, 255, 255, 255))
    d = ImageDraw.Draw(sheet)
    d.rectangle([430, 0, 860, 480], fill=(24, 26, 32, 255))
    x = 20
    for px in (48, 96, 192):
        rounded = masked(icon512.resize((px, px), Image.LANCZOS), rounded_mask(px, 0.22))
        for ox, col in ((0, (30, 30, 30, 255)), (430, (230, 230, 230, 255))):
            sheet.alpha_composite(rounded, (ox + x, 20))
            d.text((ox + x, 20 + px + 6), f"{px}px", fill=col, font=font(14))
        x += px + 24
    # 48px shown 4x with nearest-neighbour to inspect legibility
    zoom = icon512.resize((48, 48), Image.LANCZOS).resize((192, 192), Image.NEAREST)
    for ox, col in ((0, (30, 30, 30, 255)), (430, (230, 230, 230, 255))):
        sheet.alpha_composite(zoom, (ox + 20, 270))
        d.text((ox + 230, 360), "48px zoomed 4x", fill=col, font=font(14))
    save_png(sheet, HERE / "preview-small.png")


def verify():
    expected = {HERE / "icon-512.png": (512, 512), HERE / "feature-graphic-1024x500.png": (1024, 500)}
    for name, k in DENSITIES.items():
        legacy, layer = round(48 * k), round(108 * k)
        d = RES / f"mipmap-{name}"
        for f in ("ic_launcher.png", "ic_launcher_round.png"):
            expected[d / f] = (legacy, legacy)
        for f in ("ic_launcher_foreground.png", "ic_launcher_background.png", "ic_launcher_monochrome.png"):
            expected[d / f] = (layer, layer)
    ok = True
    for path, size in expected.items():
        with Image.open(path) as im:
            good = im.size == size and im.mode == "RGBA"
            kb = path.stat().st_size / 1024
            print(f"{'OK ' if good else 'BAD'} {path.relative_to(HERE)}  {im.size[0]}x{im.size[1]} {im.mode} {kb:.1f} KB")
            ok &= good
    if (HERE / "icon-512.png").stat().st_size >= 1024 * 1024:
        print("BAD icon-512.png >= 1 MB")
        ok = False
    with Image.open(HERE / "icon-512.png") as im:
        if im.getchannel("A").getextrema() != (255, 255):
            print("BAD icon-512.png has transparent pixels")
            ok = False
    if not ok:
        sys.exit(1)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        icon512 = render(browser, "icon-master.svg", 512, 512)
        save_png(icon512, HERE / "icon-512.png")
        save_png(render(browser, "feature-graphic.svg", 1024, 500), HERE / "feature-graphic-1024x500.png")

        for name, k in DENSITIES.items():
            legacy, layer = round(48 * k), round(108 * k)
            d = RES / f"mipmap-{name}"
            master = render(browser, "icon-master.svg", legacy, legacy)
            save_png(masked(master, rounded_mask(legacy, 0.20)), d / "ic_launcher.png")
            save_png(masked(master, circle_mask(legacy)), d / "ic_launcher_round.png")
            save_png(render(browser, "ic_launcher_foreground.svg", layer, layer, transparent=True), d / "ic_launcher_foreground.png")
            save_png(render(browser, "ic_launcher_background.svg", layer, layer), d / "ic_launcher_background.png")
            save_png(render(browser, "ic_launcher_monochrome.svg", layer, layer, transparent=True), d / "ic_launcher_monochrome.png")

        assets = {
            "bg": render(browser, "ic_launcher_background.svg", 432, 432),
            "fg": render(browser, "ic_launcher_foreground.svg", 432, 432, transparent=True),
            "mono": render(browser, "ic_launcher_monochrome.svg", 432, 432, transparent=True),
        }
        browser.close()

    build_previews(assets)
    build_small_preview(Image.open(HERE / "icon-512.png").convert("RGBA"))
    verify()


if __name__ == "__main__":
    main()
