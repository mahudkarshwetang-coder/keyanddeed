#!/usr/bin/env python3
"""Rebuild the site header nav as dropdown buttons (idempotent).

Replaces the flat 9-link <nav> on every page with two CSS-only <details>
dropdowns: "Tools" (the nine free tools) and "Guides" (the doctrine pages).
No JavaScript is added — the "1 script on this whole site" claim stays true.

Usage: python3 scripts/nav_dropdowns.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]

# (label, file, active-label-used-on-its-own-page)
TOOLS = [
    ("Toll Calculator", "toll.html"),
    ("Split Explorer", "split.html"),
    ("Closing Costs", "closing.html"),
    ("Affordability", "affordability.html"),
    ("Co-op-Off", "coop-off.html"),
    ("Rent Estimator", "rent.html"),
    ("Rent Increase", "rent-increase.html"),
    ("RTO Calculator", "rto.html"),
    ("Leverage", "leverage.html"),
]
GUIDES = [
    ("The Open Book", "open-book.html"),
    ("The Receipts", "receipts.html"),
    ("The RTO Charter", "rto-charter.html"),
    ("Fee Card", "fee-card.html"),
    ("The Co-op-Off Playbook", "coop-playbook.html"),
    ("How We Make Money", "how-we-make-money.html"),
]
PAGES = [
    "index.html", "404.html",
    "tools/toll.html", "tools/split.html", "tools/closing.html", "tools/affordability.html",
    "tools/coop-off.html", "tools/rent.html", "tools/rent-increase.html",
    "tools/rto.html", "tools/leverage.html",
    "pages/receipts.html", "pages/open-book.html", "pages/rto-charter.html", "pages/fee-card.html",
    "pages/how-we-make-money.html", "pages/coop-playbook.html", "pages/privacy.html",
    "pages/terms.html", "pages/accessibility.html",
]


def prefixes(page: str) -> tuple[str, str]:
    """(tools prefix, pages prefix) relative to this page."""
    if page == "404.html":
        return "/tools/", "/pages/"
    if page.startswith("tools/"):
        return "", "../pages/"
    if page.startswith("pages/"):
        return "../tools/", ""
    return "tools/", "pages/"


def build_nav(page: str) -> str:
    tpre, ppre = prefixes(page)
    active_tool = None
    active_guide = None
    if page.startswith("tools/"):
        active_tool = page.split("/", 1)[1]
    elif page.startswith("pages/"):
        active_guide = page.split("/", 1)[1]

    def link(href: str, label: str, active: bool) -> str:
        attr = ' class="active" aria-current="page"' if active else ""
        return f'      <a href="{href}"{attr}>{label}</a>'

    tools = "\n".join(link(f"{tpre}{f}", lab, f == active_tool) for lab, f in TOOLS)
    guides = "\n".join(link(f"{ppre}{f}", lab, f == active_guide) for lab, f in GUIDES)
    tools_open = ' class="menu has-active"' if active_tool else ' class="menu"'
    guides_open = ' class="menu has-active"' if active_guide else ' class="menu"'

    return f'''<nav class="mainnav">
    <details name="nav"{tools_open}>
      <summary>Tools</summary>
      <div class="menu-panel">
        <p class="menu-label">Free tools</p>
{tools}
      </div>
    </details>
    <details name="nav"{guides_open}>
      <summary>Guides</summary>
      <div class="menu-panel">
        <p class="menu-label">The doctrine</p>
{guides}
      </div>
    </details>
  </nav>'''


def main() -> None:
    changed = 0
    for page in PAGES:
        path = ROOT / page
        if not path.exists():
            print("skip (missing):", page)
            continue
        html = path.read_text(encoding="utf-8")
        m = re.search(r"<nav[^>]*>.*?</nav>", html, re.S)
        if not m:
            print("skip (no nav):", page)
            continue
        new_nav = build_nav(page)
        if m.group(0) == new_nav:
            print("ok (unchanged):", page)
            continue
        html = html[: m.start()] + new_nav + html[m.end():]
        path.write_text(html, encoding="utf-8")
        changed += 1
        print("rebuilt:", page)
    print(f"\n{changed} page(s) rebuilt.")


if __name__ == "__main__":
    main()
