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
* Each poem's hint map (*_map_hint.png) gets a small homepage thumbnail
  (*_thumb.jpg) cropped around the purple trail section, and the poem's
  front matter gets an `image:` line pointing to it.
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

THUMB_SIZE = (450, 300)  # 3:2, matches the homepage card thumbnail


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


def route_box(im):
    """Bounding box of the largest patch of purple route in a map screenshot."""
    w, h = im.size
    px = im.load()
    mask = Image.new("L", (w, h), 0)
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if b - g > 45 and abs(r - g) < 45 and b > 150:
                mp[x, y] = 255
    mp = mask.filter(ImageFilter.MaxFilter(5)).load()

    seen = bytearray(w * h)
    best = None
    for y0 in range(h):
        for x0 in range(w):
            if not mp[x0, y0] or seen[y0 * w + x0]:
                continue
            stack, size = [(x0, y0)], 0
            seen[y0 * w + x0] = 1
            box = [x0, y0, x0, y0]
            while stack:
                x, y = stack.pop()
                size += 1
                box = [min(box[0], x), min(box[1], y),
                       max(box[2], x), max(box[3], y)]
                for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    inside = 0 <= a < w and 0 <= b < h
                    if inside and mp[a, b] and not seen[b * w + a]:
                        seen[b * w + a] = 1
                        stack.append((a, b))
            if best is None or size > best[0]:
                best = (size, box)
    return best[1] if best else None


def make_thumb(map_path, thumb_path):
    im = Image.open(map_path).convert("RGB")
    W, H = im.size
    box = route_box(im) or [0, 0, W - 1, H - 1]
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    # Pad around the route (room for the start/end pins and some landmarks),
    # never zoom in further than half the map, then widen to 3:2.
    bw = max((box[2] - box[0]) * 1.5 + 80, W * 0.5)
    bh = max((box[3] - box[1]) * 1.5 + 80, H * 0.4)
    ratio = THUMB_SIZE[0] / THUMB_SIZE[1]
    bw, bh = max(bw, bh * ratio), max(bh, bw / ratio)
    # Keep the crop inside the map where possible; if it is bigger than the
    # map, the extra is filled with the map's background colour.
    left = min(max(cx - bw / 2, 0), max(W - bw, 0)) if bw <= W else cx - bw / 2
    top = min(max(cy - bh / 2, 0), max(H - bh, 0)) if bh <= H else cy - bh / 2
    bg = max(im.getcolors(W * H))[1]  # most common colour = map background
    canvas = Image.new("RGB", (round(bw), round(bh)), bg)
    canvas.paste(im, (round(-left), round(-top)))
    canvas.resize(THUMB_SIZE, Image.LANCZOS).save(
        thumb_path, "JPEG", quality=82, optimize=True)


def make_thumbs():
    for qmd in sorted(POEMS.glob("*.qmd")):
        text = read(qmd)
        m = re.search(r"\(images/([\w-]+)_map_hint\.png\)", text)
        if not m:
            continue
        map_path = IMAGES / f"{m.group(1)}_map_hint.png"
        thumb_path = IMAGES / f"{m.group(1)}_thumb.jpg"
        stale = (not thumb_path.exists() or
                 thumb_path.stat().st_mtime < map_path.stat().st_mtime)
        if stale:
            make_thumb(map_path, thumb_path)
            print(f"  thumbnail {thumb_path.name}")
        if not re.search(r"^image:", text, re.M):
            nl = "\r\n" if "\r\n" in text else "\n"
            text = re.sub(r"^(subtitle:[^\r\n]*)",
                          lambda s: s.group(1) + nl
                          + f'image: "images/{thumb_path.name}"',
                          text, count=1, flags=re.M)
            qmd.write_bytes(text.encode("utf-8"))
            print(f"  linked {thumb_path.name} in {qmd.name}")


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

    make_thumbs()

    after = sum(p.stat().st_size for p in IMAGES.iterdir() if p.is_file())
    print(f"images: {before / 1e6:.1f} MB -> {after / 1e6:.1f} MB")


if __name__ == "__main__":
    sys.exit(main())
