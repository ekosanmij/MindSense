# MindSense AI Showcase Website

Investor/client/user-facing marketing site for MindSense AI.

## Current State

This version keeps the established multi-page structure (`index`, `investor-brief`, `privacy`, `terms`) while updating product copy to the latest MindSense loop:

- one best next action in under 30 seconds
- closed-loop flow (sense -> infer -> explain -> act -> measure -> learn)
- core production scope (`Today`, `Regulate`, `Data`, `Settings`) with demo-only modules behind feature flags

Detailed review:
- `OPTIMIZATION_REVIEW.md`

## Key Files

- `index.html`: high-conversion page structure and copy
- `styles.css`: premium visual system and responsive layout
- `main.js`: nav, reveal animation, interactive product gallery, contact form logic
- `assets/screenshots/`: real app captures (raw, hd, web variants)

## Screenshot Capture Pipeline

Run:

```bash
bash Scripts/capture_marketing_screens.sh
```

Generated outputs for each tab (`today`, `regulate`, `data`, `community`, `settings`):
- `*-raw.png` (full source)
- `*-hd.jpg` (high-fidelity presentation)
- `*-web.jpg` (lightweight responsive)

Website production highlights five surfaces (`today`, `regulate`, `data`, `community`, `settings`) while noting demo-only scope where applicable.

## Local Preview

Open directly:
- `index.html`

Or run:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Launch Checklist

1. Confirm final production App Store URL in `index.html` (currently slug-based link).
2. Wire contact form API endpoints (`/api/contact`, `/api/contact/partner`, `/api/contact/investor`).
3. Confirm legal inboxes (`privacy@`, `legal@`, `hello@`) route to monitored teams.
4. Deploy with domain `https://mindsense.ai` (canonical/OG/sitemap already reference this).

## Next Enhancements

1. Connect analytics destination (GA4 or equivalent) to `dataLayer`/`gtag` events in `main.js`.
2. Add press kit page with downloadable logos/screenshots.
3. Add AVIF/WebP screenshot variants when image tooling is available in CI.
