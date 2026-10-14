#!/usr/bin/env python3
"""Lock the brand: replace all [[NAME]] / [[DOMAIN]] / [[EMAIL]] / [[YEAR]] tokens
across the whole site in one command. Run from the repo root:

    python3 scripts/finalize.py "Key & Deed" "keyanddeed.ca"

Then: regenerate assets/og.png (instructions inside assets/og-card.html) and commit.
"""
import sys
import pathlib
import datetime

TOKEN_SUFFIXES = {".html", ".css", ".js", ".mjs", ".py", ".txt", ".xml", ".md", ".json", ".svg"}


def main() -> int:
    if len(sys.argv) != 3:
        print('usage: python3 scripts/finalize.py "Brand Name" "domain.tld"')
        return 2
    brand = sys.argv[1]
    domain = sys.argv[2].replace("https://", "").replace("http://", "").strip("/")
    root = pathlib.Path(__file__).resolve().parents[1]
    repl = {
        "[[NAME]]": brand,
        "[[DOMAIN]]": domain,
        "[[EMAIL]]": f"hello@{domain}",
        "[[YEAR]]": str(datetime.date.today().year),
    }
    total = 0
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in TOKEN_SUFFIXES:
            continue
        if ".git" in path.parts or "cache" in path.parts:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        n = sum(text.count(token) for token in repl)
        if n == 0:
            continue
        for token, value in repl.items():
            text = text.replace(token, value)
        path.write_text(text, encoding="utf-8")
        total += n
        print(f"replaced {n:3d} token(s): {path.relative_to(root)}")
    print(f"\nDone - {total} token(s) replaced.")
    print(f"Brand: {brand} | Domain: {domain} | Email: hello@{domain}")
    print("Next: regenerate assets/og.png (see assets/og-card.html) and commit.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
