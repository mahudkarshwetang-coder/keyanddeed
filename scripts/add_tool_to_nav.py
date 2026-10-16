#!/usr/bin/env python3
"""Insert a tool link into the nav of every Terminal page (idempotent).

Usage:
  python3 scripts/add_tool_to_nav.py                  # defaults: closing.html "Closing Costs" after "Toll Calculator"
  python3 scripts/add_tool_to_nav.py <file> <label> <after-label>

Inserts the new nav item immediately after the anchor whose visible label
matches <after-label> (default "Toll Calculator"), using the right relative
prefix for each page family (tools/, pages/, root, 404).
Skips any page that already contains the new label in its nav.
Safe to re-run.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
PAGES = [
    "index.html", "404.html",
    "tools/toll.html", "tools/closing.html", "tools/coop-off.html", "tools/rent.html",
    "tools/rto.html", "tools/leverage.html",
    "pages/receipts.html", "pages/open-book.html", "pages/rto-charter.html", "pages/fee-card.html",
    "pages/how-we-make-money.html", "pages/coop-playbook.html", "pages/privacy.html",
    "pages/terms.html", "pages/accessibility.html",
]


def prefix_for(page: str) -> str:
    """Relative prefix from a page to the tools directory."""
    if page == "404.html":
        return "/tools/"
    if page.startswith("tools/"):
        return ""
    if page.startswith("pages/"):
        return "../tools/"
    return "tools/"


def main() -> None:
    new_file = sys.argv[1] if len(sys.argv) > 1 else "closing.html"
    label = sys.argv[2] if len(sys.argv) > 2 else "Closing Costs"
    after_label = sys.argv[3] if len(sys.argv) > 3 else "Toll Calculator"

    anchor = re.compile(
        r'(<a href="[^"]*' + re.escape(after_label.split()[0].lower()) + r'[^"]*"[^>]*>'
        + re.escape(after_label) + r'</a>)'
    )
    for page in PAGES:
        path = ROOT / page
        if not path.exists():
            print("skip (missing):", page)
            continue
        html = path.read_text(encoding="utf-8")
        if f">{label}</a>" in html:
            print("skip (already present):", page)
            continue
        m = anchor.search(html)
        if not m:
            print("NO ANCHOR FOUND:", page)
            continue
        ins = (m.group(1) + "\n      <a href=\"" + prefix_for(page) + new_file
               + "\">" + label + "</a>")
        html = html[:m.start(1)] + ins + html[m.end(1):]
        path.write_text(html, encoding="utf-8")
        print("updated:", page)


if __name__ == "__main__":
    main()
