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

const toolPages = ['tools/toll.html','tools/closing.html','tools/coop-off.html','tools/rent.html','tools/rto.html','tools/leverage.html'];
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

console.log('\n' + (failures === 0 ? 'ALL ' + checks + ' CHECKS PASSED' : failures + ' of ' + checks + ' checks FAILED'));
process.exitCode = failures === 0 ? 0 : 1;
