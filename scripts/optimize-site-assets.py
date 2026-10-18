"""Regenerate website-sized copies of original Otterly artwork."""

from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "images"
OUTPUT = IMAGES / "brand"
VARIANTS = (
    ("Otter-mascot.png", "otter-mark-80.webp", 80),
    ("Otter-mascot.png", "otter-buddy-320.webp", 320),
    ("Otter-mascot.png", "otter-buddy-480.webp", 480),
    ("Otter-tank.png", "otter-tank-640.webp", 640),
    ("About.png", "about-800.webp", 800),
    ("Blog.png", "blog-800.webp", 800),
    ("tool.png", "tools-800.webp", 800),
    ("clockmaster-icon.png", "clock-master-320.webp", 320),
)


def main():
    OUTPUT.mkdir(exist_ok=True)
    for source, name, width in VARIANTS:
        with Image.open(IMAGES / source) as original:
            image = ImageOps.exif_transpose(original).convert("RGBA" if "A" in original.getbands() else "RGB")
            height = round(image.height * width / image.width)
            image = image.resize((width, height), Image.Resampling.LANCZOS)
            target = OUTPUT / name
            image.save(target, "WEBP", quality=82, method=6)
            print(f"{target.relative_to(ROOT)}: {target.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
