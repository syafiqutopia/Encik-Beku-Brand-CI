# `@encikbeku/ui` + tokens — quickstart

Drop-in code for any React / Next.js / Tailwind project that needs to adopt the
Encik Beku brand. No runtime dependencies beyond React 18+.

> **Locked v1.0.0 · 2026-08-19**
> Primary Tech Blue `#035CC2` · Satoshi (Black 900 / Bold 700 / Medium 500)
> Source of truth: [`../CI.md`](../CI.md)

---

## What's in here

```
code/
├── tokens/
│   ├── tokens.css            CSS custom properties (light + dark + reduced-motion)
│   ├── tokens.ts             typed exports for JS / charts / canvas
│   └── tailwind.preset.ts    Tailwind 3.4 / 4 preset
├── ui/
│   ├── Button.tsx            primary / accent / ghost / whatsapp · sm / md / lg
│   ├── Card.tsx              default / elevated / outline / tint / brand
│   ├── Chip.tsx              default / brand / accent / tint / status
│   └── Logo.tsx              primary / secondary / single, with minimum-size guard
├── templates/
│   ├── letterhead.html       A4
│   ├── invoice.html          A4
│   └── quotation.html        A4
├── email/
│   └── signature.html        table-based, Outlook-safe
└── index.ts                  barrel export
```

All generated token files come from [`../tokens/tokens.source.mjs`](../tokens/tokens.source.mjs).
**Do not hand-edit them** — run `node tools/build-tokens.mjs`.

---

## Three ways to adopt

### 1. CSS only — zero build

```html
<link rel="stylesheet" href="/fonts/fonts.css">
<link rel="stylesheet" href="/code/tokens/tokens.css">
```

```css
.card {
  background: var(--eb-bg-1);
  border: 1px solid var(--eb-border-1);
  border-radius: var(--eb-radius-md);
  box-shadow: var(--eb-shadow-md);
  font-family: var(--eb-font-sans);
}
```

Type classes ship too: `.eb-display`, `.eb-h1`–`.eb-h4`, `.eb-body`,
`.eb-body-sm`, `.eb-caption`, `.eb-eyebrow`, `.eb-price`.

### 2. Tailwind preset

```ts
// tailwind.config.ts
import encikBeku from './code/tokens/tailwind.preset';
export default { presets: [encikBeku], content: ['./src/**/*.{ts,tsx}'] };
```

`bg-tech-blue`, `text-french-blue`, `bg-pumpkin`, `text-fg-2`, `font-display`,
`rounded-md`, `shadow-brand`, `ease-eb` all resolve.

### 3. React components

```tsx
import { Button, Card, Chip, Logo } from './code';

<Logo variant="secondary" theme="light" width={240} basePath="/svg/logo" />

<Card variant="elevated" hoverable>
  <Chip variant="success" dot>Completed</Chip>
  <h3 className="eb-h3">Aircond service — 1.0HP</h3>
  <Button variant="primary">Book now</Button>
  <Button variant="whatsapp" href="https://wa.me/60189294628">Chat on WhatsApp</Button>
</Card>
```

---

## Loading Satoshi

Satoshi is not on Google Fonts. Serve the bundled files:

```css
@import url('/fonts/fonts.css');
```

Or, in Next.js, with `next/font/local`:

```ts
import localFont from 'next/font/local';

const satoshi = localFont({
  variable: '--eb-font-sans',
  src: [
    { path: '../fonts/Satoshi-Medium.otf', weight: '500', style: 'normal' },
    { path: '../fonts/Satoshi-Bold.otf',   weight: '700', style: 'normal' },
    { path: '../fonts/Satoshi-Black.otf',  weight: '900', style: 'normal' },
  ],
});
```

Without Satoshi the components fall back to `system-ui` and the identity drifts.
Read [`../fonts/LICENSE-SATOSHI.md`](../fonts/LICENSE-SATOSHI.md) before
redistributing the font files.

---

## Two API decisions that look wrong and are not

**1. `accent` and `whatsapp` buttons use near-black text, not white.**
White on Pumpkin Spice is 2.65:1 and fails WCAG AA at every size; near-black is
7.30:1. Same for WhatsApp green. Do not change it to white.

**2. `Logo` renders an `<img>` pointing at the SVG rather than inlining it.**
The artwork is ~40KB of paths, and inlining it would bloat every render and
tempt people to edit the geometry. Serving the locked file makes tampering
obvious and lets the browser cache it. Set `basePath` if your `svg/` directory
is not at the site root.

---

## Templates

The HTML templates are self-contained A4 pages. Open in a browser, replace the
`[BRACKETED]` fields, then print to PDF with margins set to **None** — each
page paints its own margins.

They carry the real registered entities and registration numbers from the
Company Profile. Keep the sending entity's number: it is a statutory
requirement on Malaysian company correspondence.

The email signature is deliberately table-based with inline styles and an Arial
fallback. Outlook on Windows renders with the Word engine and drops flexbox,
CSS variables and web fonts. Do not modernise it.

---

## Rebuilding tokens

```bash
node tools/build-tokens.mjs
```

Edit [`../tokens/tokens.source.mjs`](../tokens/tokens.source.mjs), rebuild, and
commit the source together with every generated file.
