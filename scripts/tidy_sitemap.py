"""Runs after every render (post-render in _quarto.yml).

Quarto lists the homepage in sitemap.xml as /index.html, but each page's
canonical address (canonical-url: true) is / . List the homepage (and any
folder index page) by the same address so search engines see one URL.
"""
import os
from pathlib import Path

sitemap = Path(os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", "_site")) / "sitemap.xml"
if sitemap.exists():
    text = sitemap.read_text(encoding="utf-8")
    sitemap.write_text(text.replace("/index.html</loc>", "/</loc>"), encoding="utf-8")
