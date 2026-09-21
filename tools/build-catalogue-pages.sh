#!/bin/bash
# What we do — the Service Catalogue flip-book's page images.
#
# The booklet ships whole as a PDF to download, but the preview on the page
# turns through it a page at a time, so every page also ships as a JPEG.
# Rendered from the same _source PDF the download is copied from, so the two
# can never drift.
#
# These pages are A4 PORTRAIT, so `sips -Z` (used by build-heroes.sh) is wrong
# here: it fits the LONGEST side and would leave a 636px-wide page.
# --resampleWidth sets the side that matters.
#
# 850px wide: a page is drawn at most ~500 CSS px (half of the spread in a
# 92svh dialog on a 1440x900 laptop), so this stays sharp on a 2x screen and
# keeps the price tables legible. A visitor only downloads the pages they
# actually turn to - services.html loads them two at a time.
set -euo pipefail
cd "$(dirname "$0")/.."

PDF=_source/encik-beku-catalogue-2026.pdf
OUT=website/img/catalogue
RAW=_source/page-renders          # gitignored; keeping the renders makes a
                                  # re-encode at another width skip PDFKit

BIN="$(mktemp -d)/pdfrender"
swiftc -O -o "$BIN" tools/render-pdf.swift
mkdir -p "$OUT" "$RAW"
"$BIN" "$PDF" "$RAW" 2.0 >/dev/null

# Renumbered from the glob, and the old set cleared first: a reissue with
# fewer pages must not leave a stale last page behind for the book to show.
rm -f "$OUT"/p*.jpg
i=0
for f in "$RAW"/encik-beku-catalogue-2026-p*.png; do
  i=$((i + 1))
  sips --resampleWidth 850 -s format jpeg -s formatOptions 70 \
       "$f" --out "$OUT/$(printf 'p%02d.jpg' "$i")" >/dev/null
done

printf 'catalogue pages:\n'
printf '  %-14s %s pages, %s total\n' "$OUT" "$i" "$(du -ch "$OUT"/p*.jpg | tail -1 | cut -f1)"
printf '  %-14s %s\n' "heaviest" "$(du -h "$OUT"/p*.jpg | sort -h | tail -1 | awk '{print $2, $1}')"
