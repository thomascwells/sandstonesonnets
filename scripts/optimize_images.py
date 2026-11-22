"""Shrink poem images so pages load quickly on a phone at the trailhead.

Run from the repo root before committing new photos:

    pip install pillow
    python scripts/optimize_images.py

What it does (safe to run repeatedly; already-processed files are skipped):

* Photos (.jpg) larger than MAX_PHOTO px on the long edge are resized and
  re-saved as compressed JPEGs.
* Photos marked with {.img-blur1}, {.img-blur2} or {.img-blur3} in a poem
  are blurred in the file itself (so the sharp original can't be opened
  from the browser), and the blur class is removed from the poem.
* Map screenshots (.png) are reduced to a 256-colour palette.
"""

import re
import sys
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
POEMS = ROOT / "poems"
IMAGES = POEMS / "images"

MAX_PHOTO = 1600        # long edge for answer photos
MAX_HINT = 1200         # long edge for blurred hint photos
JPEG_QUALITY = 80
BLUR_PER_LEVEL = 2.5    # Gaussian radius (px at MAX_HINT) per img-blurN level

IMG_REF = re.compile(r"(!\[[^\]]*\]\(images/([^)\s]+)\))(\{[^}]*\})?")
BLUR_CLASS = re.compile(r"\.img-blur(\d)")


def read(path):
    return path.read_bytes().decode("utf-8")  # keeps original line endings


def save_jpeg(im, path):
    im.convert("RGB").save(path, "JPEG", quality=JPEG_QUALITY,
                           optimize=True, progressive=True)


def shrink(im, max_edge):
    im = ImageOps.exif_transpose(im)
    if max(im.size) > max_edge:
        im.thumbnail((max_edge, max_edge), Image.LANCZOS)
    return im


def bake_blurs():
    """Blur photos tagged with .img-blurN and drop the tag from the poem."""
    blurred = set()
    refs = {}  # image name -> set of blur levels it is used with (0 = none)
    for qmd in POEMS.glob("*.qmd"):
        for _, name, attrs in IMG_REF.findall(read(qmd)):
            m = BLUR_CLASS.search(attrs or "")
            refs.setdefault(name, set()).add(int(m.group(1)) if m else 0)

    for qmd in sorted(POEMS.glob("*.qmd")):
        text = read(qmd)

        def repl(m):
            img, name, attrs = m.group(1), m.group(2), m.group(3) or ""
            b = BLUR_CLASS.search(attrs)
            if not b:
                return m.group(0)
            if 0 in refs[name] or len(refs[name]) > 1:
                print(f"  ! {name} is also used unblurred or at another "
                      f"blur level; leaving it alone")
                return m.group(0)
            path = IMAGES / name
            im = shrink(Image.open(path), MAX_HINT)
            radius = int(b.group(1)) * BLUR_PER_LEVEL
            save_jpeg(im.filter(ImageFilter.GaussianBlur(radius)), path)
            blurred.add(name)
            print(f"  blurred {name} (level {b.group(1)})")
            attrs = BLUR_CLASS.sub("", attrs)
            return img + ("" if re.fullmatch(r"\{\s*\}", attrs) else attrs)

        new = IMG_REF.sub(repl, text)
        if new != text:
            qmd.write_bytes(new.encode("utf-8"))
    return blurred


def main():
    before = sum(p.stat().st_size for p in IMAGES.iterdir() if p.is_file())
    skip = bake_blurs()

    for path in sorted(IMAGES.glob("*.jpg")):
        if path.name in skip:
            continue
        im = Image.open(path)
        if max(im.size) <= MAX_PHOTO:
            continue
        save_jpeg(shrink(im, MAX_PHOTO), path)
        print(f"  resized {path.name}")

    for path in sorted(IMAGES.glob("*.png")):
        im = Image.open(path)
        if im.mode == "P":
            continue
        im = im.convert("RGBA").quantize(256, method=Image.Quantize.FASTOCTREE)
        im.save(path, optimize=True)
        print(f"  compressed {path.name}")

    after = sum(p.stat().st_size for p in IMAGES.iterdir() if p.is_file())
    print(f"images: {before / 1e6:.1f} MB -> {after / 1e6:.1f} MB")


if __name__ == "__main__":
    sys.exit(main())
