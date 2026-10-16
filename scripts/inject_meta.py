#!/usr/bin/env python3
"""Idempotent head/footer injections for Terminal pages.

Adds to every page (skips anything already present):
  - favicon link + theme-color
  - Open Graph / Twitter card metas (og:image -> assets/og.png)
  - aria-live="polite" on result lines
  - footer legal links (Privacy / Terms / Accessibility)

Run from the repo root:  python3 scripts/inject_meta.py
Safe to re-run: it only writes files that actually change.
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
PAGES = [
    "index.html", "404.html",
    "tools/toll.html", "tools/split.html", "tools/closing.html", "tools/coop-off.html", "tools/rent.html", "tools/rent-increase.html",
    "tools/rto.html", "tools/leverage.html",
    "pages/receipts.html", "pages/open-book.html", "pages/rto-charter.html", "pages/fee-card.html",
    "pages/how-we-make-money.html", "pages/coop-playbook.html", "pages/privacy.html",
    "pages/terms.html", "pages/accessibility.html",
]

TITLE_RE = re.compile(r"<title>([^<]+)</title>")
DESC_RE = re.compile(r'<meta name="description" content="([^"]*)"')


def asset_prefix(page: str) -> str:
    """Relative prefix from a page to the repo root."""
    return "../" * page.count("/")


def legal_prefix(page: str) -> str:
    """Relative prefix from a page to the legal pages."""
    if page.startswith("pages/"):
        return ""
    if page.startswith("tools/"):
        return "../pages/"
    return "pages/"


def main() -> None:
    for page in PAGES:
        path = ROOT / page
        if not path.exists():
            print("skip (missing):", page)
            continue
        html = original = path.read_text(encoding="utf-8")

        pre = asset_prefix(page)
        title = (TITLE_RE.search(html) or [None, "Key & Deed"])[1]
        desc = (DESC_RE.search(html) or [None, ""])[1]

        if 'rel="icon"' not in html:
            block = (
                f'<link rel="icon" type="image/svg+xml" href="{pre}assets/favicon.svg">\n'
                f'<meta name="theme-color" content="#0e1116">\n'
                f'<meta property="og:type" content="website">\n'
                f'<meta property="og:title" content="{title}">\n'
                f'<meta property="og:url" content="https://keyanddeed.ca/{"" if page == "index.html" else page}">\n'
                f'<meta property="og:description" content="{desc}">\n'
                f'<meta property="og:image" content="https://keyanddeed.ca/assets/og.png">\n'
                f'<meta name="twitter:card" content="summary_large_image">\n'
            )
            html = re.sub(
                r'(<meta name="description"[^>]*>)\n', r"\1\n" + block, html, count=1
            )

        # upgrade pass (idempotent): absolute og:image + og:url on already-injected pages
        html = re.sub(r'content="(?:\.\./|)assets/og\.png"', 'content="https://keyanddeed.ca/assets/og.png"', html)
        if 'og:url' not in html:
            url_path = '' if page == 'index.html' else page
            html = re.sub(
                r'(<meta property="og:title"[^>]*>)',
                r'\1' + '\n' + f'<meta property="og:url" content="https://keyanddeed.ca/{url_path}">',
                html, count=1,
            )

        html = re.sub(
            r'<div class="result-line" id="([^"]+)">',
            r'<div class="result-line" id="\1" aria-live="polite">',
            html,
        )

        if "legal-links" not in html:
            lp = legal_prefix(page)
            legal = (
                f'<p class="legal legal-links"><a href="{lp}privacy.html">Privacy</a> · '
                f'<a href="{lp}terms.html">Terms</a> · '
                f'<a href="{lp}accessibility.html">Accessibility</a></p>'
            )
            html = html.replace("</footer>", legal + "\n</footer>", 1)

        if html != original:
            path.write_text(html, encoding="utf-8")
            print("updated:", page)
        else:
            print("no change:", page)


if __name__ == "__main__":
    main()
