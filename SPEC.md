# Terminal v1 — Build Spec (Phase 0)
The free prosumer toolkit — landing + 4 calculators + charter pages + waitlist · Started Oct 14, 2026 · By Hermes

## Goal & guardrails
- **Free forever, no login, no paywalls.** National-ready (structured for all-canada), **GTA data depth first**.
- Compliance copy everywhere: "estimate, not appraisal"; "tools, not advice"; never brokerage language; Open Book doctrine applies (no hidden anything).
- Success-fee model means the site sells nothing — it earns trust. CTAs = waitlist + "talk to us when you're ready".

## Stack & repo
- **Static site** — plain HTML/CSS/vanilla JS, **no build step** (least friction, deploy anywhere).
- Repo: `direct-re/terminal/` · structure:
  - `index.html` — landing
  - `tools/toll.html` (true-cost), `tools/coop-off.html`, `tools/rent.html`, `tools/rto.html`, `tools/leverage.html`
  - `pages/open-book.html`, `pages/rto-charter.html`, `pages/fee-card.html`, `pages/how-we-make-money.html`
  - `assets/css/site.css`, `assets/js/*.js` (shared: formatting, disclaimers, share)
  - `data/rents.json`, `data/fees.json`, `data/cities.json`
- Hosting: GitHub Pages or Cloudflare Pages (deploy when brand+domain lock). **No analytics v1** (privacy); add privacy-friendly later.

## Waitlist (decided: FormSubmit — zero-account)
- Live on the landing page: posts to `formsubmit.co/ajax/[[EMAIL]]`, AJAX with graceful mailto fallback. **Activation:** one confirmation click (emailed after the domain email exists). Tally.so remains the fallback option.
- Fields: email, city, "what are you solving?" dropdown (buy/sell/rent/RTO/commercial). Honeypot + `_captcha=false` included.

## Tools — v1 scope & build order

### 1. The Toll Calculator (true cost of commissions) — FIRST
- Inputs: price, listing-% (default 2.5), co-op-% (default 2.5), HST on (default ON 13%).
- Outputs: total commission $, HST $, vs our flat success fee (configurable, default $1,999); savings $; "what that money could do" line (down payment % etc.).
- Shareable result line + URL params. The universal lead magnet.

### 2. Co-op-Off Calculator (unrepresented-buyer playbook)
- Inputs: price, co-op-% (2.5), "seller will play?" slider (0–100%), fallback rebate mode.
- Outputs: expected savings = price × co-op% × play%; vs rebate path (co-op − $500–999 flat) × play%; honest copy on TRESA nuance (can't collect commissions — it's a price/credit negotiation).
- Links to the Playbook page (write in v1 content pass).

### 3. Rent Estimator (GTA v1)
- Inputs: city (GTA list v1), beds (0–3+), dwelling type, parking, laundry, reno'd, furnished.
- Baseline: CMHC Fall 2025 averages (embedded in data pack) × neighbourhood multiplier (seeded table) × feature adjustments (±%). Output: fair-rent range ±5%, "over/under market" verdict.
- Sources footer + "not an appraisal" disclaimer.

### 4. RTO-vs-Save-and-Wait Calculator
- Inputs: price today, option escalation (default 5%/yr — Requity benchmark), term (3), deposit, monthly savings, market-growth slider, forfeiture severity (Charter-compliant = capped; default vs all-or-nothing toggle).
- Outputs: buyout price at term, cumulative credits, equity at exercise (both paths), **total cost of failure** (forfeited credits under each forfeiture mode), verdict meter.
- This is the honesty gate + the marketing artifact for the RTO program.

### 5. Leverage Scorer (negotiation simulator v1)
- Inputs: DOM, # price cuts, list-to-sold trend (manual), inventory feel, financing status, condition issues.
- Output: 0–100 leverage score + suggested opening-offer range (%, low–high) + one-paragraph script. Clearly v1-rough; iterate with real data later.

## Pages
- **Landing** — positioning ("keys to the road"), 4 tool cards, waitlist, Open Book + Charter links.
- **Open Book** — the transparency doctrine (public).
- **RTO Charter** — the 7 commitments (public).
- **Fee Card** — success-fee-only price list, one screen.
- **How We Make Money** — unit economics in the open.

## Data pack v1
- `rents.json`: CMHC Fall 2025 CMA/city averages (attribute CMHC); GTA neighbourhood multiplier seed (manual, v1).
- `fees.json`: commission norms (ON 3.5–5% + HST; sources noted).
- `cities.json`: top-15 metros + GTA neighborhoods list.

## Build order & acceptance criteria
1. Scaffold + shared CSS/JS + disclaimers component.
2. Toll Calculator + Landing + Waitlist (usable, shareable).
3. Co-op-Off + Rent Estimator.
4. RTO + Leverage Scorer + 4 static pages.
5. Local QA: mobile widths (360–430px), Lighthouse ≥ 90 perf/a11y; copy review (honesty pass).
- **Done = all 5 tools usable on a phone, zero signups, every number sourced, zero shady copy.**

## Not in v1 (explicit)
- Listing Autopsy (needs address/data plumbing → v1.1), accounts, saved searches, commercial module depth, French (pre-QC), analytics.

## Open items
- **Brand/name lock** (see `brand.md`) → domain → deploy.
- Playbook page copy (write alongside co-op tool).
- CIPO trademark clearance before public launch (legal step).

## Build status — Oct 14, 2026 (verified)
- ✅ All 5 tools + 4 doctrine pages + 3 legal pages + waitlist + 404/robots/sitemap/favicon/og.png built.
- ✅ `node tests/smoke.mjs` → 68/68 checks; live server → 20/20 URLs HTTP 200; true-390px/360px + desktop layout QA clean.
- ✅ Git repo initialized (`main`); `scripts/finalize.py` + `scripts/inject_meta.py` ready for brand lock.
- ⏳ Human steps: domains → `finalize.py` → og.png regen → FormSubmit activation (1 click) → deploy → socials (guided).
- Next: CIPO trademark, independent a11y audit, then **partner-brokerage outreach** (the licensed envelope).
- QA gotcha: headless Edge on Windows clamps window width (~500px min) then crops — never judge mobile from `--window-size` screenshots; use an iframe/emulation harness.
