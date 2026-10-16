# Terminal — repo README

Phase 0 build of the free prosumer real-estate toolkit for **Key & Deed** — **live at https://keyanddeed.ca** (GitHub Pages).

**Status: v2 LIVE (Oct 16, 2026).** Brand locked (Key & Deed), domains registered, email + waitlist active, deployed to GitHub Pages with HTTPS. 7 tools, 5 doctrine pages, 3 legal pages, FormSubmit waitlist, SEO files, smoke-test suite.

## Layout
- `index.html` — landing + working waitlist form
- `tools/` — `toll.html` · `closing.html` · `coop-off.html` · `rent.html` · `rent-increase.html` · `rto.html` · `leverage.html`
- `pages/` — `open-book` · `rto-charter` · `fee-card` · `how-we-make-money` · `privacy` · `terms` · `accessibility`
- `data/rents.json` — CMHC Fall 2025 rents, 18 CMAs (the rent tool embeds a mirror of this table)
- `assets/` — `css/site.css`, `favicon.svg`, `og.png` (+ `og-card.html`, its source)
- `scripts/` — `inject_meta.py` (idempotent head/footer injection), `add_tool_to_nav.py` (idempotent nav injection), `finalize.py` (brand lock)
- `tests/smoke.mjs` — zero-dependency smoke suite
- Root: `404.html`, `robots.txt`, `sitemap.xml`

## Run / test / maintain
    python3 -m http.server 8787        # serve locally (open http://localhost:8787)
    node tests/smoke.mjs               # 119 checks: scripts run, ids exist, outputs populate, golden values, links resolve
    python3 scripts/inject_meta.py     # idempotent: favicon/OG/aria-live/legal footer links (safe re-run)

QA note (Windows): headless Edge clamps `--window-size` to a ~500px minimum and then crops —
so a 390px `--screenshot` is a CROP of a ~500px render, not true mobile. Measure real layouts
via an iframe harness (390px iframe) or real device emulation instead. Desktop shots are fine.

## Brand lock (do this when the domain is bought)
    python3 scripts/finalize.py "Key & Deed" "keyanddeed.ca"
Replaces `Key & Deed` `keyanddeed.ca` `hello@keyanddeed.ca` `2026` everywhere (site + docs + robots/sitemap).
Then regenerate the social card (see the comment inside `assets/og-card.html`):
    msedge --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=1500 \
      --window-size=1200,630 --screenshot=assets/og.png assets/og-card.html

## Deploy — LIVE (Oct 16, 2026)
- **https://keyanddeed.ca** — GitHub Pages from `main` (repo root), custom domain via the `CNAME` file, HTTPS enforced (cert approved).
- **DNS (Porkbun):** apex `A` → 185.199.108–111.153 + `AAAA` → 2606:50c0:800x::153 (GitHub Pages); `www` CNAME → `mahudkarshwetang-coder.github.io`; email records untouched (`MX` fwd1/fwd2.porkbun.com, `TXT` SPF).
- **Waitlist:** FormSubmit active (`formsubmit.co/ajax/hello@keyanddeed.ca` → forwards to the owner inbox). NOTE: FormSubmit activation is per-origin — after any domain change, ONE new test submission + one confirmation click.
- Redeploy = push to `main` (Pages auto-builds). Re-run `node tests/smoke.mjs` after any edit — keep it green before pushing.

## Rules of this repo
- No percentages-for-us anywhere; no dark patterns; no gated data; no analytics/trackers.
- Every number cites a source; every estimate says "estimate"; legal pages stay honest.
- Open Book doctrine applies to this site itself: nothing hidden, ever.
