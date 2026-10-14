# Terminal — repo README

Phase 0 build of the free prosumer real-estate toolkit for **[[NAME]]** (brand pending — `[[NAME]]` tokens until lock).

**Status: v1 complete + tested (Oct 14, 2026).** 5 tools, 4 doctrine pages, 3 legal pages, waitlist form, SEO files, smoke-test suite.

## Layout
- `index.html` — landing + working waitlist form
- `tools/` — `toll.html` · `coop-off.html` · `rent.html` · `rto.html` · `leverage.html`
- `pages/` — `open-book` · `rto-charter` · `fee-card` · `how-we-make-money` · `privacy` · `terms` · `accessibility`
- `data/rents.json` — CMHC Fall 2025 rents, 18 CMAs (the rent tool embeds a mirror of this table)
- `assets/` — `css/site.css`, `favicon.svg`, `og.png` (+ `og-card.html`, its source)
- `scripts/` — `inject_meta.py` (idempotent head/footer injection), `finalize.py` (brand lock)
- `tests/smoke.mjs` — zero-dependency smoke suite
- Root: `404.html`, `robots.txt`, `sitemap.xml`

## Run / test / maintain
    python3 -m http.server 8787        # serve locally (open http://localhost:8787)
    node tests/smoke.mjs               # 68 checks: scripts run, ids exist, outputs populate, links resolve
    python3 scripts/inject_meta.py     # idempotent: favicon/OG/aria-live/legal footer links (safe re-run)

QA note (Windows): headless Edge clamps `--window-size` to a ~500px minimum and then crops —
so a 390px `--screenshot` is a CROP of a ~500px render, not true mobile. Measure real layouts
via an iframe harness (390px iframe) or real device emulation instead. Desktop shots are fine.

## Brand lock (do this when the domain is bought)
    python3 scripts/finalize.py "Key & Deed" "keyanddeed.ca"
Replaces `[[NAME]]` `[[DOMAIN]]` `[[EMAIL]]` `[[YEAR]]` everywhere (site + docs + robots/sitemap).
Then regenerate the social card (see the comment inside `assets/og-card.html`):
    msedge --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=1500 \
      --window-size=1200,630 --screenshot=assets/og.png assets/og-card.html

## Deploy (static, no build step)
1. Push this repo to GitHub and enable Pages (or connect it to Cloudflare Pages, output dir = repo root). Add a `CNAME` file (`keyanddeed.ca`) if using GitHub Pages + custom domain.
2. **Waitlist activation:** the form posts to `formsubmit.co/ajax/[[EMAIL]]`. After the domain email exists, do ONE test submission and click the confirmation link FormSubmit emails you (one-time). Until then, the form fails gracefully with a mailto fallback. (Tally.so remains an alternative.)
3. Set the custom domain, enable HTTPS; on Cloudflare add security headers (HSTS, X-Content-Type-Options, Referrer-Policy).
4. Re-run `node tests/smoke.mjs` after any edit — keep it green before deploying.

## Rules of this repo
- No percentages-for-us anywhere; no dark patterns; no gated data; no analytics/trackers.
- Every number cites a source; every estimate says "estimate"; legal pages stay honest.
- Open Book doctrine applies to this site itself: nothing hidden, ever.
