#!/usr/bin/env python3
"""Concept B 'Comic panel': write SVG masters from art.py, then render icon-512.png and preview-masks.png.

Usage: python build.py     (needs `pip install playwright pillow` and `playwright install chromium`)
Outputs (all in this folder): icon-master.svg, ic_launcher_{foreground,background,monochrome}.svg,
icon-512.png, preview-masks.png.  Nothing outside this folder is touched.
"""
import io
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

import art

HERE = Path(__file__).resolve().parent
SS = 4


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


def font(size):
    for name in ("arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def adaptive_mask_view(bg, fg, shape):
    size = bg.width
    comp = Image.alpha_composite(bg, fg)
    vis = round(size * 72 / 108)
    off = (size - vis) // 2
    return masked(comp.crop((off, off, off + vis, off + vis)), shape(vis))


def build_previews(assets, icon512):
    bg, fg, mono = assets["bg"], assets["fg"], assets["mono"]
    cell, pad = 216, 24
    sheet = Image.new("RGBA", (pad + 4 * (cell + pad), 2 * (cell + 60) + 30), (236, 238, 242, 255))
    d = ImageDraw.Draw(sheet)

    def put(img, col, row, label):
        x = pad + col * (cell + pad)
        y = 24 + row * (cell + 60)
        sheet.alpha_composite(img.resize((cell, cell), Image.LANCZOS), (x, y))
        d.text((x, y + cell + 8), label, fill=(30, 30, 30, 255), font=font(14))

    shapes = [("Circle", circle_mask), ("Squircle", squircle_mask), ("Rounded sq.", lambda s: rounded_mask(s, 0.28))]
    for col, (name, fn) in enumerate(shapes):
        put(adaptive_mask_view(bg, fg, fn), col, 0, name + " mask, 72dp window")

    size = bg.width
    comp = Image.alpha_composite(bg, fg)
    od = ImageDraw.Draw(comp)
    k = size / 108
    od.rectangle([18 * k, 18 * k, 90 * k, 90 * k], outline=(255, 60, 60, 255), width=max(2, round(size / 100)))
    od.ellipse([21 * k, 21 * k, 87 * k, 87 * k], outline=(0, 160, 255, 255), width=max(2, round(size / 100)))
    put(comp, 3, 0, "108dp: red 72dp, blue 66dp safe")

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
        put(masked(Image.alpha_composite(base, t).crop((off, off, off + vis, off + vis)), fn(vis)), col, 1, name)

    # small-size view: real 48px, 96px, plus a 4x nearest-neighbour zoom of the 48px render, on light and dark
    x0 = pad + 3 * (cell + pad)
    y0 = 24 + (cell + 60)
    panel = Image.new("RGBA", (cell, cell), (255, 255, 255, 255))
    pd = ImageDraw.Draw(panel)
    pd.rectangle([cell // 2, 0, cell, cell], fill=(24, 26, 32, 255))
    ic48 = masked(adaptive_mask_view(bg, fg, circle_mask).resize((48, 48), Image.LANCZOS), circle_mask(48))
    sq48 = masked(adaptive_mask_view(bg, fg, squircle_mask).resize((48, 48), Image.LANCZOS), squircle_mask(48))
    for ox in (6, cell // 2 + 6):
        panel.alpha_composite(ic48, (ox, 8))
        panel.alpha_composite(sq48, (ox + 54, 8))
    zoom = ic48.resize((96, 96), Image.NEAREST)
    panel.alpha_composite(zoom, (6, 68))
    panel.alpha_composite(sq48.resize((96, 96), Image.NEAREST), (cell // 2 + 6, 68))
    sheet.alpha_composite(panel, (x0, y0))
    d.text((x0, y0 + cell + 8), "48px real + 2x zoom, light/dark", fill=(30, 30, 30, 255), font=font(14))
    sheet.save(HERE / "preview-masks.png", format="PNG", optimize=True)


def main():
    (HERE / "icon-master.svg").write_text(art.master_svg(), encoding="utf-8")
    (HERE / "ic_launcher_foreground.svg").write_text(art.layer_svg("fg"), encoding="utf-8")
    (HERE / "ic_launcher_background.svg").write_text(art.layer_svg("bg"), encoding="utf-8")
    (HERE / "ic_launcher_monochrome.svg").write_text(art.layer_svg("mono"), encoding="utf-8")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        icon512 = render(browser, "icon-master.svg", 512, 512)
        icon512.save(HERE / "icon-512.png", format="PNG", optimize=True)
        assets = {
            "bg": render(browser, "ic_launcher_background.svg", 432, 432),
            "fg": render(browser, "ic_launcher_foreground.svg", 432, 432, transparent=True),
            "mono": render(browser, "ic_launcher_monochrome.svg", 432, 432, transparent=True),
        }
        browser.close()
    build_previews(assets, icon512)
    with Image.open(HERE / "icon-512.png") as im:
        if im.size != (512, 512) or im.getchannel("A").getextrema() != (255, 255):
            sys.exit("icon-512.png must be 512x512 and fully opaque")
    print("ok")


if __name__ == "__main__":
    main()
