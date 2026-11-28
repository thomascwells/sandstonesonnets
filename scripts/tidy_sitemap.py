"""Runs after every render (post-render in _quarto.yml) and tidies sitemap.xml.

- Quarto lists the homepage as /index.html, but each page's canonical
  address (canonical-url: true) is / . List the homepage (and any folder
  index page) by the same address so search engines see one URL.
- Leave out pages that ask search engines not to list them
  (<meta name="robots" content="noindex">), such as the flyer page.
"""
import os
import re
from pathlib import Path

site = Path(os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", "_site"))
sitemap = site / "sitemap.xml"


def hidden(url):
    """True if the page at this sitemap URL is marked noindex."""
    path = re.sub(r"^https?://[^/]+/", "", url)
    page = site / (path or "index.html")
    if not page.is_file():
        return False
    head = page.read_text(encoding="utf-8", errors="ignore").split("</head>")[0]
    return re.search(r'<meta name="robots" content="[^"]*noindex', head) is not None


if sitemap.exists():
    text = sitemap.read_text(encoding="utf-8")
    text = re.sub(
        r"\s*<url>\s*<loc>([^<]*)</loc>.*?</url>",
        lambda m: "" if hidden(m.group(1)) else m.group(0),
        text,
        flags=re.S,
    )
    text = text.replace("/index.html</loc>", "/</loc>")
    sitemap.write_text(text, encoding="utf-8")
