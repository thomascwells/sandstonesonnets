"""Make the site work offline and installable (a progressive web app).

Quarto runs this automatically after every render (see `post-render` in
_quarto.yml), locally and on GitHub. Nothing here needs editing when poems
change: everything is read from the freshly rendered site.

It writes two files into the output folder:

* manifest.webmanifest - the app's name, description, colour and icons,
  taken from the rendered homepage and theme.
* sw.js - the offline helper (service worker), built from pwa/sw.js with the
  list of every file in the site and a fingerprint of each one, so phones
  re-download only what changed.

Uses only the Python standard library, so GitHub Actions needs no extra installs.
"""

import hashlib
import html
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import quote, unquote

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(os.environ.get("QUARTO_PROJECT_OUTPUT_DIR") or ROOT / "_site")
if not OUT.is_absolute():
    OUT = ROOT / OUT

# Files that are not part of what a visitor reads
SKIP = {"sw.js", "CNAME", "robots.txt", "sitemap.xml", "index.xml"}
ICONS = ["poems/images/icon-192.png", "poems/images/icon-512.png"]


def meta(page, attr, name):
    m = re.search(rf'<meta {attr}="{re.escape(name)}" content="([^"]*)"', page)
    return html.unescape(m.group(1)) if m else None


def theme_colour():
    for css in (OUT / "site_libs" / "bootstrap").glob("bootstrap*.css"):
        m = re.search(r"--bs-primary:\s*(#[0-9a-fA-F]{3,8})", css.read_text("utf-8"))
        if m:
            return m.group(1)
    return "#ffffff"


def write_manifest():
    home = (OUT / "index.html").read_text("utf-8")
    name = meta(home, "property", "og:site_name") or "Sandstone Sonnets"
    manifest = {
        "name": name,
        "short_name": name,
        "description": meta(home, "name", "description") or "",
        "start_url": "/",
        "scope": "/",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": theme_colour(),
        "icons": [
            {"src": "/" + p, "type": "image/png",
             "sizes": "{0}x{0}".format(re.search(r"(\d+)", p).group(1)),
             "purpose": "any"}
            for p in ICONS if (OUT / p).exists()
        ],
    }
    (OUT / "manifest.webmanifest").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8")


def file_list():
    files = {}
    for path in sorted(OUT.rglob("*")):
        rel = path.relative_to(OUT).as_posix()
        if not path.is_file() or rel in SKIP or rel.endswith(".map"):
            continue
        rev = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
        files["/" + quote(rel)] = rev
    return files


def write_service_worker(files):
    version = hashlib.sha256(
        json.dumps(files, sort_keys=True).encode()).hexdigest()[:12]
    template = (ROOT / "pwa" / "sw.js").read_text("utf-8")
    data = json.dumps({"version": version, "files": files}, separators=(",", ":"))
    sw = template.replace("self.__PRECACHE__", data, 1)
    (OUT / "sw.js").write_text(sw, encoding="utf-8")
    size = sum((OUT / unquote(f[1:])).stat().st_size for f in files)
    print(f"offline: {len(files)} files, {size / 1e6:.1f} MB, version {version}")


def main():
    if not (OUT / "index.html").exists():
        print("offline: no rendered site found, skipping", file=sys.stderr)
        return
    write_manifest()          # first, so the manifest is in the file list
    write_service_worker(file_list())


if __name__ == "__main__":
    main()
