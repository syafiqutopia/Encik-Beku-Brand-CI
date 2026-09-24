#!/usr/bin/env bash
# Assemble the publishable site tree into _site/.
#
# The repo is not the site. Pages live in website/ but link out to ../svg,
# ../fonts, ../code, ../distribution and ../tokens for logos, webfonts,
# templates and downloads - so the served root has to hold all six folders
# side by side, with website/ as the entry point. Publishing website/ alone
# ships a site with broken assets on every page.
#
# Run from anywhere; output is always <repo>/_site.
set -euo pipefail

cd "$(dirname "$0")/.."
out=_site

rm -rf "$out"
mkdir -p "$out"

# Only what the site actually serves. The rest of the repo - sources, tools,
# docs, the screen recordings, the loose brand PNGs at the root - is several
# hundred MB and none of it is reachable from a page.
for dir in website code distribution fonts svg tokens; do
  if [ ! -d "$dir" ]; then
    echo "error: $dir/ is missing - the site links into it and would publish broken" >&2
    exit 1
  fi
  cp -R "$dir" "$out/"
done

# Underscore-prefixed paths are invisible to Jekyll, which Pages still runs
# over a branch source. Harmless on hosts that do not.
touch "$out/.nojekyll"

# This is a client preview, not a launch. It stays out of search results until
# someone decides otherwise.
cat > "$out/robots.txt" <<'EOF'
User-agent: *
Disallow: /
EOF

# The site lives under /website/, so the root would otherwise be a 404 for
# anyone who trims the URL.
cat > "$out/index.html" <<'EOF'
<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<title>Encik Beku</title>
<meta http-equiv="refresh" content="0; url=website/">
<link rel="canonical" href="website/">
</head><body><p><a href="website/">Continue to the Encik Beku site</a></p></body></html>
EOF

# A page that 404s on its own stylesheet still returns 200, so serving is not
# proof of anything. Resolve every local href/src against the tree that is
# about to be published and fail if one dangles.
if ! command -v python3 >/dev/null 2>&1; then
  echo "warning: python3 not found - skipping the dangling-link check" >&2
  exit 0
fi

python3 - <<'PY'
import pathlib, re, sys, urllib.parse
site = pathlib.Path('_site')
ref = re.compile(r'(?:src|href)="([^"#?][^"]*)"')
missing = []
for page in sorted(site.rglob('*.html')):
    for raw in ref.findall(page.read_text(encoding='utf-8', errors='ignore')):
        url = urllib.parse.urlsplit(raw)
        if url.scheme or url.netloc:      # external
            continue
        target = urllib.parse.unquote(url.path)
        if not target:
            continue
        # Templates carry fill-in tokens - code/email/signature.html ships
        # [LOGO_URL] and tells the reader to replace it. Those are not links
        # and there is nothing to resolve.
        if target.startswith(('[', '{')):
            continue
        base = site if target.startswith('/') else page.parent
        resolved = (base / target.lstrip('/')).resolve()
        if resolved.is_dir():
            resolved = resolved / 'index.html'
        if not resolved.exists():
            missing.append(f'{page.relative_to(site)} -> {raw}')
if missing:
    print('error: these links would 404 on the published site:', file=sys.stderr)
    for m in missing:
        print(f'  {m}', file=sys.stderr)
    sys.exit(1)
print(f'all local links resolve across {len(list(site.rglob("*.html")))} pages')
PY
