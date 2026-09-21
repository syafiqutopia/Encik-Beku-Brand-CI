#!/usr/bin/env node
/**
 * Verifies the kit's internal consistency.
 *
 *   node tools/verify.mjs
 *
 * Checks:
 *   1. Contrast — every pair CI.md §9 claims, recomputed from the tokens
 *   2. Token parity — tokens.css / tokens.ts / tailwind.preset.ts agree
 *   3. SVG integrity — masters parse, carry a viewBox, and use only locked inks
 *   4. Asset references — every path the templates and docs point at exists
 *   5. Manifest — present, and every sha256 still matches the file on disk
 *
 * Exits non-zero if anything fails, so it can gate a commit or a release.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as T from '../tokens/tokens.source.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

let failures = 0;
let checks = 0;
const ok = (msg) => { checks++; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); };
const bad = (msg) => { checks++; failures++; console.log(`  \x1b[31m✗\x1b[0m ${msg}`); };
const section = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

/* ── contrast maths (WCAG 2.1) ─────────────────────────────── */
const chan = (c) => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const lum = (hex) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/* ── 1. contrast ───────────────────────────────────────────── */
section('1 · Contrast (WCAG AA — 4.5:1 body, 3:1 large/UI)');

const WHITE = '#FFFFFF';
const MUST_PASS_BODY = [
  ['Tech Blue on white', T.brand['tech-blue'].hex, WHITE],
  ['French Blue on white', T.brand['french-blue'].hex, WHITE],
  ['Grey on white', T.neutral[500], WHITE],
  ['Near-black on white', T.neutral[900], WHITE],
  ['White on Tech Blue', WHITE, T.brand['tech-blue'].hex],
  ['White on French Blue', WHITE, T.brand['french-blue'].hex],
  ['on-accent ink on Pumpkin Spice', T.a11y['on-accent'].hex, T.brand.pumpkin.hex],
  ['on-accent ink on Fresh Sky', T.a11y['on-accent'].hex, T.brand['fresh-sky'].hex],
  ['on-accent ink on Frozen Lake', T.a11y['on-accent'].hex, T.brand['frozen-lake'].hex],
  ['pumpkin-ink on white', T.a11y['pumpkin-ink'].hex, WHITE],
  ['on-accent ink on WhatsApp green', T.a11y['on-accent'].hex, T.status.whatsapp.hex],
];
for (const [name, fg, bg] of MUST_PASS_BODY) {
  const r = ratio(fg, bg);
  r >= 4.5 ? ok(`${name} — ${r.toFixed(2)}:1`)
           : bad(`${name} — ${r.toFixed(2)}:1 (needs 4.5:1)`);
}

// Status colours must all clear body contrast on white.
for (const [name, v] of Object.entries(T.status)) {
  if (name === 'whatsapp') continue;
  const r = ratio(v.hex, WHITE);
  r >= 4.5 ? ok(`status "${name}" on white — ${r.toFixed(2)}:1`)
           : bad(`status "${name}" on white — ${r.toFixed(2)}:1 (needs 4.5:1)`);
  if (v.ratio && Math.abs(v.ratio - r) > 0.05) {
    bad(`status "${name}" documented ratio ${v.ratio} ≠ measured ${r.toFixed(2)}`);
  }
}

// Colours CI.md §4.4 declares unsafe must genuinely be unsafe — if one of these
// ever passes, the documentation is wrong and needs updating.
section('1b · Documented-unsafe colours are still unsafe');
for (const key of ['fresh-sky', 'frozen-lake', 'pumpkin']) {
  const r = ratio(T.brand[key].hex, WHITE);
  r < 4.5 ? ok(`${key} on white is ${r.toFixed(2)}:1 — correctly documented as fills-only`)
          : bad(`${key} on white is now ${r.toFixed(2)}:1 — CI.md §4.4 is out of date`);
}
{
  const r = ratio(WHITE, T.brand.pumpkin.hex);
  r < 4.5 ? ok(`white on Pumpkin Spice is ${r.toFixed(2)}:1 — near-black rule justified`)
          : bad(`white on Pumpkin Spice is now ${r.toFixed(2)}:1 — revisit CI.md §6.3`);
}

/* ── 2. token parity ───────────────────────────────────────── */
section('2 · Token parity across CSS / TS / Tailwind');

const css = read('code/tokens/tokens.css');
const ts = read('code/tokens/tokens.ts');
const tw = read('code/tokens/tailwind.preset.ts');

if (read('tokens/tokens.css') === css) ok('tokens/tokens.css matches code/tokens/tokens.css');
else bad('tokens/tokens.css has drifted from code/tokens/tokens.css');

for (const [name, v] of Object.entries(T.brand)) {
  const inCss = css.includes(`--eb-${name}: ${v.hex};`);
  const inTs = ts.includes(v.hex);
  const inTw = tw.includes(v.hex);
  inCss && inTs && inTw
    ? ok(`${name} ${v.hex} present in all three formats`)
    : bad(`${name} ${v.hex} missing — css:${inCss} ts:${inTs} tailwind:${inTw}`);
}
for (const [name, v] of Object.entries(T.ink)) {
  css.includes(`--eb-ink-${name}: ${v.hex};`)
    ? ok(`logo ink ${name} ${v.hex} in CSS`)
    : bad(`logo ink ${name} ${v.hex} missing from CSS`);
}

// Generated files must not have been hand-edited.
for (const f of ['tokens/tokens.css', 'code/tokens/tokens.css', 'code/tokens/tokens.ts', 'code/tokens/tailwind.preset.ts']) {
  read(f).includes('GENERATED FILE')
    ? ok(`${f} carries the generated-file banner`)
    : bad(`${f} is missing its generated-file banner`);
}

/* ── 3. SVG integrity ──────────────────────────────────────── */
section('3 · SVG masters');

const LOCKED_INKS = new Set(
  [...Object.values(T.ink).map((v) => v.hex.toUpperCase()), '#FFFFFF', '#000000'],
);

for (const dir of ['svg/logo', 'svg/mark']) {
  for (const file of readdirSync(join(ROOT, dir)).filter((f) => f.endsWith('.svg'))) {
    const p = `${dir}/${file}`;
    const s = read(p);
    const problems = [];

    if (!/viewBox="[-\d. ]+"/.test(s)) problems.push('no viewBox');
    if (!/width="[\d.]+"/.test(s)) problems.push('no explicit width');
    if (!s.includes('aria-label')) problems.push('no aria-label');
    if (s.includes('<metadata')) problems.push('Adobe metadata not stripped');

    const fills = [...s.matchAll(/fill="(#[0-9A-Fa-f]{3,6})"/g)].map((m) => m[1].toUpperCase());
    const stray = [...new Set(fills)].filter((f) => !LOCKED_INKS.has(f));
    if (stray.length) problems.push(`off-palette ink: ${stray.join(', ')}`);

    problems.length ? bad(`${p} — ${problems.join('; ')}`)
                    : ok(`${p} — ${(s.length / 1024).toFixed(0)}KB, inks locked`);
  }
}

/* ── 4. referenced assets exist ────────────────────────────── */
section('4 · Referenced assets resolve');

const refs = [
  ['code/templates/letterhead.html', ['../../fonts/fonts.css', '../tokens/tokens.css', '../../svg/logo/encik-beku-secondary-light.svg']],
  ['code/templates/invoice.html', ['../../fonts/fonts.css', '../tokens/tokens.css', '../../svg/logo/encik-beku-secondary-light.svg']],
  ['code/templates/quotation.html', ['../../fonts/fonts.css', '../tokens/tokens.css', '../../svg/logo/encik-beku-secondary-dark.svg']],
];
for (const [file, paths] of refs) {
  const html = read(file);
  for (const rel of paths) {
    const resolved = resolve(ROOT, dirname(file), rel);
    if (!html.includes(rel)) bad(`${file} no longer references ${rel}`);
    else if (!existsSync(resolved)) bad(`${file} → ${rel} does not exist`);
    else ok(`${file} → ${rel}`);
  }
}

// Every font weight declared in fonts.css must be on disk.
const fontsCss = read('fonts/fonts.css');
for (const m of fontsCss.matchAll(/src:\s*url\('\.\/([^']+)'\)/g)) {
  existsSync(join(ROOT, 'fonts', m[1]))
    ? ok(`fonts/${m[1]}`)
    : bad(`fonts/${m[1]} declared in fonts.css but missing`);
}

/* ── 5. manifest ───────────────────────────────────────────── */
section('5 · Manifest integrity');

if (!existsSync(join(ROOT, 'brand-kit-manifest.json'))) {
  bad('brand-kit-manifest.json missing — run: node tools/build-manifest.mjs');
} else {
  const man = JSON.parse(read('brand-kit-manifest.json'));
  let mismatched = 0, missing = 0;
  for (const e of man.entries) {
    const abs = join(ROOT, e.path);
    if (!existsSync(abs)) { missing++; continue; }
    const sha = createHash('sha256').update(readFileSync(abs)).digest('hex');
    if (sha !== e.sha256) mismatched++;
  }
  missing === 0 ? ok(`all ${man.entries.length} manifest entries exist`)
                : bad(`${missing} manifest entries missing from disk`);
  mismatched === 0 ? ok('every sha256 matches')
                   : bad(`${mismatched} files changed since the manifest was built — rerun build-manifest.mjs`);
}


/* ── 6. barrel exports resolve ─────────────────────────────── */
section('6 · code/index.ts re-exports resolve');

// No TypeScript compiler is available in this environment, so the components
// are not type-checked here. This catches the failure that actually bites:
// index.ts naming something a module does not export.
{
  const barrel = read('code/index.ts');
  const declared = (src) => {
    const names = new Set();
    for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z0-9_$]+)/g)) names.add(m[1]);
    for (const m of src.matchAll(/export\s+type\s+([A-Za-z0-9_$]+)/g)) names.add(m[1]);
    for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
      for (const part of m[1].split(',')) {
        const n = part.trim().split(/\s+as\s+/)[0].replace(/^type\s+/, '').trim();
        if (n) names.add(n);
      }
    }
    return names;
  };

  for (const m of barrel.matchAll(/export\s+(type\s+)?\{([^}]+)\}\s+from\s+'([^']+)'/g)) {
    const spec = m[3];
    const file = spec.replace(/^\.\//, 'code/') + (spec.endsWith('.ts') ? '' : '');
    const candidates = [`${file}.ts`, `${file}.tsx`];
    const found = candidates.find((c) => existsSync(join(ROOT, c)));
    if (!found) { bad(`code/index.ts imports from '${spec}' — no such module`); continue; }
    const have = declared(read(found));
    for (const raw of m[2].split(',')) {
      const name = raw.trim().split(/\s+as\s+/)[0].replace(/^type\s+/, '').trim();
      if (!name) continue;
      have.has(name)
        ? ok(`${name} ← ${found}`)
        : bad(`code/index.ts exports "${name}" but ${found} does not declare it`);
    }
  }
}

/* ── The locations map, and about.html's inline copy of it ─────
   about.html inlines the map so the states can be styled and zoomed. Editing
   website/img/malaysia.svg without re-inlining it, or hand-editing the copy
   inside about.html, would silently desync the two. The five service states
   must also keep their ids: locations.js looks each one up by id to highlight
   and zoom it, and a rename would fail silently at runtime. */
{
  const gen = read('website/img/malaysia.svg');
  const page = read('website/about.html');

  const SERVICE_STATES = ['selangor', 'negeri-sembilan', 'johor', 'pulau-pinang', 'melaka'];
  const ids = [...gen.matchAll(/<path\s+id="([^"]+)"/g)].map((m) => m[1]);
  const absent = SERVICE_STATES.filter((id) => !ids.includes(id));
  absent.length === 0
    ? ok(`malaysia.svg carries all ${SERVICE_STATES.length} service-state ids (${ids.length} states total)`)
    : bad(`malaysia.svg is missing state id(s): ${absent.join(', ')} — locations.js cannot zoom to them`);

  const paths = [...gen.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
  const missing = paths.filter((d) => !page.includes(d));
  missing.length === 0
    ? ok('about.html inlines the map verbatim')
    : bad(`about.html map is out of date — ${missing.length} path(s) differ from ` +
          'website/img/malaysia.svg. Re-inline the file.');

  const orphan = SERVICE_STATES.filter((id) => !page.includes(`data-state="${id}"`));
  orphan.length === 0
    ? ok('every service state is wired to a branch row')
    : bad(`no branch row targets state(s): ${orphan.join(', ')}`);
}

/* ── Every service photograph a page asks for exists ───────────
   The photos are regenerated from the source PDFs by
   tools/build-service-photos.sh; a renamed pick would otherwise show up as
   a silent broken image rather than a failed build. */
{
  const wanted = new Set();
  for (const page of ['index.html', 'about.html', 'brand.html', 'services.html']) {
    for (const m of read(`website/${page}`).matchAll(/img\/services\/([a-z0-9-]+\.jpg)/g)) {
      wanted.add(m[1]);
    }
  }
  const missing = [...wanted].filter((f) => !existsSync(join(ROOT, 'website/img/services', f)));
  missing.length === 0
    ? ok(`all ${wanted.size} service photographs present`)
    : bad(`missing service photographs: ${missing.join(', ')} — rerun tools/build-service-photos.sh`);
}

/* ── Every What we do section has its banner photo ─────────────
   services.html builds the path from the tab's key when a section is picked,
   so no src attribute names these files and the publish link check cannot see
   a missing one. Rebuild them with tools/build-heroes.sh. */
{
  const keys = [...read('website/services.html').matchAll(/<button type="button" data-tab="([a-z]+)"/g)].map((m) => m[1]);
  const missing = keys.filter((k) => !existsSync(join(ROOT, `website/img/services-hero-${k}.jpg`)));
  keys.length && missing.length === 0
    ? ok(`all ${keys.length} What we do section banners present`)
    : bad(`What we do section(s) with no banner photo: ${missing.join(', ') || 'no tabs found'} — rerun tools/build-heroes.sh`);
}

/* ── The catalogue flip-book has every page it claims ──────────
   services.html builds `img/catalogue/pNN.jpg` from a counter, so no src
   attribute names these files either. A page short is a visitor turning onto
   blank paper; a page over is a leftover from a longer earlier edition still
   sitting in the folder. Rebuild them with tools/build-catalogue-pages.sh. */
{
  const dir = join(ROOT, 'website/img/catalogue');
  const n = Number((read('website/services.html').match(/PAGES\s*=\s*(\d+)/) || [])[1]);
  const want = Array.from({ length: n }, (_, i) => `p${String(i + 1).padStart(2, '0')}.jpg`);
  const have = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.jpg')) : [];
  const missing = want.filter((f) => !have.includes(f));
  const stray = have.filter((f) => !want.includes(f));
  n && !missing.length && !stray.length
    ? ok(`all ${n} catalogue pages present`)
    : bad(`catalogue pages do not match services.html (PAGES = ${n || '?'}): ` +
          `${missing.length} missing, ${stray.length} stray — rerun tools/build-catalogue-pages.sh`);
}

/* ── result ────────────────────────────────────────────────── */
console.log(
  failures === 0
    ? `\n\x1b[32m✓ ${checks} checks passed.\x1b[0m\n`
    : `\n\x1b[31m✗ ${failures} of ${checks} checks failed.\x1b[0m\n`,
);
process.exit(failures === 0 ? 0 : 1);
