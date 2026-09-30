#!/usr/bin/env node
/**
 * Stamps ?v=<n> onto local CSS/JS links in the website pages.
 *
 *   node tools/stamp-assets.mjs
 *
 * WHY: python's http.server sends no Cache-Control, so Chrome caches CSS
 * heuristically and keeps serving a stale copy — edits appear to do
 * nothing. A version query forces a fresh fetch, and works the same way on
 * any real host. Bump it by re-running this after changing CSS or JS.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const v = Date.now().toString(36);
const targets = ['site.css', 'anim.js', 'hero.js', 'flipbook.js', 'i18n.js', 'fonts.css', 'tokens.css'];
let touched = 0;

for (const f of readdirSync(resolve(ROOT, 'website'))) {
  if (!f.endsWith('.html') || f === 'site-preview.html') continue;
  const p = resolve(ROOT, 'website', f);
  let s = readFileSync(p, 'utf8');
  for (const t of targets) {
    s = s.replace(new RegExp(`(${t.replace('.', '\\.')})(\\?v=[a-z0-9]+)?"`, 'g'), `$1?v=${v}"`);
  }
  writeFileSync(p, s);
  touched++;
}
console.log(`stamped ?v=${v} across ${touched} pages`);
