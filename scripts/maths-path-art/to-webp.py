"""Crops, resizes and converts the Blender renders to small WebP files."""
import os
import sys

from PIL import Image

source, target = sys.argv[1], sys.argv[2]
os.makedirs(target, exist_ok=True)
for name in sorted(os.listdir(source)):
    if not name.endswith('.png'):
        continue
    image = Image.open(os.path.join(source, name)).convert('RGBA')
    box = image.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if box:
        pad = 12
        box = (max(0, box[0] - pad), max(0, box[1] - pad), min(image.width, box[2] + pad), min(image.height, box[3] + pad))
        image = image.crop(box)
    longest = 320 if name.startswith('note') else 240
    image.thumbnail((longest, longest), Image.LANCZOS)
    out = os.path.join(target, name[:-4] + '.webp')
    image.save(out, 'WEBP', quality=88, method=6)
    print(out, image.size, os.path.getsize(out))
