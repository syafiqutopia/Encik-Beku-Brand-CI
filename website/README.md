# Encik Beku website

Three things, three audiences, three downloadable booklets.

Navigation follows the Website Structure brief §2 — **WHO WE ARE · OUR BRAND ·
WHAT WE DO** — with the logo acting as the Home control. This is a corporate
and brand *resource* site, not a sales site: informational actions only, no
floating contact button, no urgency devices (§1, §24).

| Page | URL | For | Document |
|---|---|---|---|
| `index.html` | `/` | Everyone — one full-screen parallax hero | — |
| `about.html` | `/about` | Corporate partners, customers | Company Profile · 10pp |
| `brand.html` | `/brand` | Designers, freelancers, print vendors | Brand Guidelines · 22pp |
| `services.html` | `/services` | Customers and property managers | Service Catalogue · 34pp |

Documents use versioned filenames per §21, and every download card shows type,
pages, language, size, version and updated date per §20.

### The home page

One screen, and nothing below it — no marquee, no footer. Depth comes from two
photographic layers (`img/hero-sky.jpg` and `img/hero-crew.avif`) that settle in
as the loader clears and then drift against the pointer.

Rebuild them from the supplied plates with
[`tools/build-heroes.sh`](../tools/build-heroes.sh). The travel budget
lives in `site.css` as px multipliers on `--px`/`--py`; `hero.js` only writes
those two numbers and never touches `transform`.

The gradient stops in `.hero-fade` are tuned to a measured contrast floor —
white runs 4.57-5.57:1 across 390 to 2560 wide. Weaken them and the headline
drops below 4.5:1. Re-measure if you change them.

### The Who we are banner

The title band is photographic, under a flat 30% `#035CC2` tint.

### The locations map

`img/malaysia.svg` is a supplied vector, not a generated one: one `<path>` per
Peninsular state, each carrying its own `id`. `locations.js` looks a state up by
that id to highlight it and compute the zoom, so **renaming an id silently
breaks the zoom** — `tools/verify.mjs` guards the five service states
(`selangor`, `negeri-sembilan`, `johor`, `pulau-pinang`, `melaka`).

`about.html` inlines the file so the states can be styled and transformed.
After editing the SVG, re-inline it; verify fails if the two drift apart.

**Before launch, work through [`CLAIMS-TO-VERIFY.md`](CLAIMS-TO-VERIFY.md)** —
brief §30 requires verifying anything that may change, and it lists every
factual claim on the site with its source.

## Running it

Open `index.html` in a browser — no build step. Chrome blocks web fonts over
`file://`, so either use Safari or serve the repo root:

```bash
python3 -m http.server 8080
# http://localhost:8080/website/
```

Pages link out to `../fonts/`, `../tokens/`, `../svg/`, `../distribution/` and
`../code/tokens/`, so **serve the repository root**, not `website/` alone.

## Deploying

Any static host. Point the document root at the repo root and the site lives at
`/website/`. To serve it at `/`, move these four pages plus `site.css` and
`downloads/` to the root and change `../` to `./` in the asset links.

Downloads are ordinary `<a download>` links and work on any real host.

## Files

```
website/
├── index.html      one screen: the two-layer parallax hero, nothing else
├── about.html      introduction, glance, vision/mission, values, ecosystem,
│                   who we serve, locations, registered entities
├── brand.html      overview + tagline, logo story, logo system, misuse,
│                   colour, type, tone of voice, visual direction, assets
├── services.html   12 service sections, the service table, and the catalogue
│                   preview and download links
├── site.css        shared styles — every value a token
├── downloads/      the three PDFs, versioned filenames
├── img/            hero parallax layers, service photos, PDF covers
├── CLAIMS-TO-VERIFY.md   every factual claim and its source (brief §30)
└── site-preview.html GENERATED — do not edit
```

### `site-preview.html` is a build output

The four pages folded into one self-contained file with tabs, for sharing as a
single link. Everything is inlined (fonts base64, logos as data URIs), so it has
zero external requests.

```bash
node tools/build-site-preview.mjs
```

Edit the four pages and rebuild — never edit `site-preview.html` by hand.

**Downloads do not work in the preview.** The artifact viewer's sandbox blocks
any download a page starts, `data:`/`blob:` hrefs included. Embedding the
booklets and using the `downloads` capability was measured and rejected: all
assets base64-encoded comes to 16.25 MB against a 16 MB ceiling, and PDF/SVG sit
in the extended extension set which is not guaranteed enabled for a given
viewer. The preview says so in a banner; the deployed site downloads normally.

## Booklet PDFs

`tools/build-downloads.sh` produces `downloads/` from the originals in
`_source/`, keeping whichever of original-or-recompressed is smaller:

| Booklet | Source | Shipped | |
|---|---|---|---|
| Company Profile | 15 MB | 2.6 MB | recompressed |
| Brand Guideline | 6.1 MB | 3.6 MB | recompressed |
| Catalogue | 3.1 MB | 3.1 MB | original — already optimised |

Re-rendering only helps when a PDF carries oversized embedded images. The
catalogue is already photo-compressed and *grew* to 9.1 MB when re-rendered,
which is why the script compares and keeps the smaller file.

Send print vendors the originals in `_source/`, not these.

## Pricing accuracy

Prices come from the 2026 catalogue. The PDF's text layer interleaves table
columns and cannot be trusted, so **every published figure was read off the
rendered page image**, not the extracted text.

Six tables are transcribed in full and verified: aircond supply & install (p14),
cassette ceiling (p15), servicing (p16), repairs & troubleshooting (p17), CCTV
(p21), toilet waterproofing (p22). The remaining categories show their verified
headline "from" price only, with the full table left to the booklet — deliberate,
so no unverified number is published as fact.

The page states prices are a guide, not a quotation.

## What building this found

Fed back into the kit rather than patched here:

1. **Missing on-brand surface tokens.** Any full-bleed Tech Blue field needs
   muted ink and hairline borders on top; the kit had white and nothing else, so
   a single page grew ten hand-rolled `rgba(255,255,255,…)` values. Added
   `--eb-fg-on-brand-muted` / `-subtle`, `--eb-border-on-brand` / `-strong` and
   `--eb-bg-on-brand-hover`.
2. **Orange over blue goes muddy — twice.** Hit on the quotation cover and again
   on the hero. Now a written rule: CI.md §6.6.
3. **`<use>` icons crop without a `viewBox`** on the wrapper `<svg>`. Silent, no
   error; every icon under 24px was broken.
4. **`position: sticky` needs room to travel.** The catalogue's section nav sat
   in a wrapper exactly its own height and never stuck.
