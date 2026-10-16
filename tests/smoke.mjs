// Terminal v1 smoke tests — zero dependencies. Run: node tests/smoke.mjs
// Checks, for every tool page:
//   1. script parses and RUNS without throwing (mini DOM stub)
//   2. every $('id') reference has a matching element in the HTML
//   3. every placeholder output ("—") gets populated with a real value
//   4. no NaN / undefined / null leaked into any output
// Plus: all internal links resolve, rents.json parses, meta basics present.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0, checks = 0;
const ok = (cond, msg) => {
  checks++;
  if (cond) console.log('  ok  ' + msg);
  else { failures++; console.log('  FAIL  ' + msg); }
};

const toolPages = ['tools/toll.html','tools/split.html','tools/closing.html','tools/coop-off.html','tools/rent.html','tools/rent-increase.html','tools/rto.html','tools/leverage.html'];
const allPages = ['index.html','404.html', ...toolPages,
  'pages/receipts.html','pages/open-book.html','pages/rto-charter.html','pages/fee-card.html','pages/how-we-make-money.html',
  'pages/privacy.html','pages/terms.html','pages/accessibility.html','pages/coop-playbook.html'];

function buildDom(html) {
  const ids = {};
  for (const m of html.matchAll(/<input\b[^>]*>/g)) {
    const tag = m[0];
    const id = (tag.match(/id="([^"]+)"/) || [])[1]; if (!id) continue;
    const value = (tag.match(/value="([^"]*)"/) || [])[1] ?? '';
    ids[id] = { value, checked: /\bchecked\b/.test(tag), textContent: '', addEventListener(){} };
  }
  for (const m of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const id = m[1], inner = m[2];
    let val = '';
    for (const o of inner.matchAll(/<option\b([^>]*)>([^<]*)</g)) {
      const attrs = o[1];
      const v = (attrs.match(/value="([^"]*)"/) || [])[1] ?? o[2].trim();
      if (val === '') val = v;
      if (/\bselected\b/.test(attrs)) { val = v; break; }
    }
    ids[id] = { value: val, checked: false, textContent: '', addEventListener(){} };
  }
  for (const m of html.matchAll(/id="([^"]+)"/g)) {
    if (!ids[m[1]]) ids[m[1]] = { value: '', checked: false, textContent: '', addEventListener(){} };
  }
  return ids;
}

console.log('# Terminal v1 smoke tests\n');
console.log('## Tool page script runs + outputs populate');
for (const page of toolPages) {
  const html = readFileSync(join(root, page), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const code = scripts.join('\n;\n');
  const ids = buildDom(html);

  // 2. $('id') references all exist
  const refs = [...new Set([...code.matchAll(/\$\('([^']+)'\)/g)].map(m => m[1]))];
  const missing = refs.filter(r => !ids[r]);
  ok(missing.length === 0, page + ': all $() refs exist' + (missing.length ? ' — MISSING: ' + missing.join(', ') : ''));

  // 1. runs
  let err = null;
  try {
    const fn = new Function('document', 'location', code);
    fn({ getElementById: id => ids[id] ?? null }, { search: '', origin: 'https://example.test', pathname: '/' + page });
  } catch (e) { err = e; }
  ok(!err, page + ': script executes' + (err ? ' — THREW: ' + err.message : ''));

  // 3+4. placeholders populated, no junk values
  const placeholders = [...html.matchAll(/<div class="(?:out|result-line)" id="([^"]+)"[^>]*>—<\/div>/g)].map(m => m[1]);
  ok(placeholders.length > 0, page + ': has placeholder outputs to check (' + placeholders.length + ')');
  for (const id of placeholders) {
    const v = ids[id] ? String(ids[id].textContent) : '';
    ok(v.length > 0 && v !== '—' && !/NaN|undefined|\[object/.test(v),
       page + ' #' + id + ' => ' + JSON.stringify(v.slice(0, 60)));
  }
}

console.log('\n## Internal links resolve');
for (const page of allPages) {
  const html = readFileSync(join(root, page), 'utf8');
  const bad = [];
  for (const m of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    const target = m[1];
    if (/^(https?:|mailto:|data:)/.test(target)) continue;
    const clean = target.split('?')[0];
    const p = clean.startsWith('/') ? join(root, clean) : resolve(join(root, dirname(page)), clean);
    if (!existsSync(p)) bad.push(target);
  }
  ok(bad.length === 0, page + ': links' + (bad.length ? ' — BROKEN: ' + bad.join(', ') : ''));
}

console.log('\n## Data + meta basics');
try {
  const rents = JSON.parse(readFileSync(join(root, 'data/rents.json'), 'utf8'));
  ok(Object.keys(rents.cmas).length === 18, 'rents.json parses, 18 CMAs');
} catch (e) { ok(false, 'rents.json parses — ' + e.message); }
for (const page of allPages) {
  const html = readFileSync(join(root, page), 'utf8');
  const checks2 = [
    [/<html lang="en">/.test(html), 'lang'],
    [/<meta name="viewport"/.test(html), 'viewport'],
    [/<meta name="description"/.test(html), 'description'],
    [/<title>[^<]+<\/title>/.test(html), 'title'],
  ];
  const failed = checks2.filter(c => !c[0]).map(c => c[1]);
  ok(failed.length === 0, page + ': meta' + (failed.length ? ' — missing: ' + failed.join(', ') : ''));
}

console.log('\n## Closing-cost calculator: golden values (research dossier worked examples)');
{
  const html = readFileSync(join(root, 'tools/closing.html'), 'utf8');
  const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n;\n');
  const fmt0 = n => new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n);
  const run = over => {
    const ids = buildDom(html);
    for (const k in over) if (ids[k]) ids[k][over[k][0]] = over[k][1];
    new Function('document', 'location', code)(
      { getElementById: id => ids[id] ?? null },
      { search: '', origin: 'https://example.test', pathname: '/tools/closing.html' });
    return id => String(ids[id].textContent);
  };
  const t = run({}); // defaults: $700k, Toronto, no FTHB
  ok(t('ltt') === fmt0(10475), 'closing: Ontario LTT @$700k = ' + fmt0(10475) + ' — got ' + t('ltt'));
  ok(t('mltt') === fmt0(10475), 'closing: Toronto MLTT @$700k = ' + fmt0(10475) + ' — got ' + t('mltt'));
  ok(t('total').includes(fmt0(23930.39)), 'closing: default total ' + fmt0(23930.39) + ' — got ' + JSON.stringify(t('total')));
  const f = run({ fthb: ['checked', true] });
  ok(f('total').includes(fmt0(15455.39)), 'closing: FTHB total ' + fmt0(15455.39) + ' (dossier example) — got ' + JSON.stringify(f('total')));
  ok(f('fthbon') === '-' + fmt0(4000) && f('fthbto') === '-' + fmt0(4475), 'closing: rebates applied — ' + f('fthbon') + ' / ' + f('fthbto'));
  const o = run({ city: ['value', 'ON'] });
  ok(o('mltt') === fmt0(0) && o('total').includes(fmt0(13339.5)), 'closing: non-Toronto total ' + fmt0(13339.5) + ' — got ' + JSON.stringify(o('total')));
  const x = run({ price: ['value', '3500000'] });
  ok(x('mltt') === fmt0(83475), 'closing: MLTT @$3.5M graduated tiers = ' + fmt0(83475) + ' — got ' + x('mltt'));
  ok(x('total').includes(fmt0(160430.39)), 'closing: $3.5M total ' + fmt0(160430.39) + ' — got ' + JSON.stringify(x('total')));
}

console.log('\n## Rent-increase checker: golden values (ontario.ca / LTB rules, verified Oct 2026)');
{
  const html = readFileSync(join(root, 'tools/rent-increase.html'), 'utf8');
  const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n;\n');
  const run = over => {
    const ids = buildDom(html);
    for (const k in over) if (ids[k]) ids[k][over[k][0]] = over[k][1];
    new Function('document', 'location', code)(
      { getElementById: id => ids[id] ?? null },
      { search: '', origin: 'https://example.test', pathname: '/tools/rent-increase.html' });
    return id => String(ids[id].textContent);
  };
  const t = run({}); // defaults: $2,500 rent, 2.5% asked, effective 2026 (2.1%), 90 days, 12 months
  ok(t('cap') === '$52.50 (2.1%)', 'rent-rise: cap @2.1% on $2,500 = $52.50 — got ' + t('cap'));
  ok(t('asked') === '$62.50 (2.5%)', 'rent-rise: asked = $62.50 — got ' + t('asked'));
  ok(t('over') === '$10.00' && t('yearly') === '$120.00', 'rent-rise: over = $10.00/mo ($120/yr) — got ' + t('over') + ' / ' + t('yearly'));
  ok(t('newrent') === '$2,562.50' && t('caprent') === '$2,552.50', 'rent-rise: new rents — got ' + t('newrent') + ' / ' + t('caprent'));
  ok(t('timing') === '90 days — OK' && t('spacing') === '12 months — OK', 'rent-rise: timing/spacing defaults OK');
  ok(t('verdict').includes('Over the guideline'), 'rent-rise: over-guideline verdict — got ' + JSON.stringify(t('verdict').slice(0, 60)));
  const y27 = run({ year: ['value', '2027'] });
  ok(y27('cap') === '$47.50 (1.9%)' && y27('over') === '$15.00', 'rent-rise: 2027 cap = $47.50, over $15 — got ' + y27('cap') + ' / ' + y27('over'));
  const x = run({ exempt: ['checked', true] });
  ok(x('cap') === 'No cap — exempt unit' && x('verdict').includes('exempt'), 'rent-rise: exempt unit — got ' + x('cap'));
  const n = run({ notice: ['value', '60'] });
  ok(n('timing') === '60 days — 30 days short', 'rent-rise: 60-day notice flag — got ' + n('timing'));
  const m = run({ months: ['value', '10'] });
  ok(m('spacing') === '10 months — too soon (need 12)', 'rent-rise: 10-month flag — got ' + m('spacing'));
  const w = run({ increase: ['value', '2.0'] });
  ok(w('over') === '$0.00' && w('verdict').includes('Within the guideline'), 'rent-rise: within-guideline verdict — got ' + JSON.stringify(w('verdict').slice(0, 60)));
}

console.log('\n## Split explorer: golden values (dossier 04 comp models)');
{
  const html = readFileSync(join(root, 'tools/split.html'), 'utf8');
  const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n;\n');
  const run = over => {
    const ids = buildDom(html);
    for (const k in over) if (ids[k]) ids[k][over[k][0]] = over[k][1];
    new Function('document', 'location', code)(
      { getElementById: id => ids[id] ?? null },
      { search: '', origin: 'https://example.test', pathname: '/tools/split.html' });
    return id => String(ids[id].textContent);
  };
  const t = run({}); // $1M, 2.5% + 2.5%, franchise (70/30 + 6% royalty), HST on
  ok(t('agent') === '$16,450' && t('brokerage') === '$8,550', 'split: franchise $1M — agent $16,450 / brokerage $8,550 — got ' + t('agent') + ' / ' + t('brokerage'));
  ok(t('royalty') === '$1,500 (6% of GCI)', 'split: franchise royalty = $1,500 — got ' + t('royalty'));
  ok(t('coop') === '$25,000' && t('allin').includes('$56,500') && t('allin').includes('5.65%'), 'split: co-op $25k, all-in $56,500 @ 5.65% — got ' + t('allin'));
  ok(t('flow').startsWith('Where the $56,500 lands'), 'split: flow line — got ' + JSON.stringify(t('flow').slice(0, 50)));
  const c = run({ model: ['value', 'cloud'] });
  ok(c('agent') === '$20,000' && c('brokerage') === '$5,000' && c('royalty') === '$0 — none', 'split: cloud 80/20 — got ' + c('agent') + ' / ' + c('brokerage'));
  const f100 = run({ model: ['value', 'flat100'] });
  ok(f100('agent') === '$24,401' && f100('brokerage') === '$599 (+ $109/mo fees)', 'split: 100% shop — got ' + f100('agent') + ' / ' + f100('brokerage'));
  const p7 = run({ price: ['value', '700000'] });
  ok(p7('agent') === '$11,515', 'split: $700k franchise agent net = $11,515 — got ' + p7('agent'));
  const no = run({ hst: ['checked', false] });
  ok(no('allin').includes('$50,000') && no('allin').includes('5.00%'), 'split: HST off — got ' + no('allin'));
}

console.log('\n' + (failures === 0 ? 'ALL ' + checks + ' CHECKS PASSED' : failures + ' of ' + checks + ' checks FAILED'));
process.exitCode = failures === 0 ? 0 : 1;
