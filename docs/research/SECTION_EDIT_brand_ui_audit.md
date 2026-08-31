# Brand and UI audit edit spec

## Targets

- Main route: `index.html`
- Shared styling and responsive rules: `css/style.css`
- Loader and interface behavior: `js/main.js`
- Error route: `404.html`
- Discovery metadata: `robots.txt`, `sitemap.xml`, `manifest.json`

## Requested changes

- Use the supplied transparent ÇİÇEK OTO logo in the loader, header, and footer.
- Preserve the black/cobalt neon visual system and existing motion language.
- Correct interface issues found in desktop and 390px mobile audits.

## Audit findings

- Buttons carrying the HTML `hidden` attribute are visible because the shared `.button` rule overrides their display; the appointment form shows Back and Submit on step one.
- The loader can remain visible too long when timers are throttled; add a bounded completion fallback.
- The generated hero image contains faint baked-in text on its right edge; mask this area without covering the scan ring.
- Keyboard focus indication is inconsistent.
- Header/footer brand treatment does not use the supplied logo.
- Canonical/schema URLs point at the previous Vercel project; sitemap/robots metadata is inconsistent.
- The 404 page still uses the retired gold interface.

## Responsive expectations

- Header logo must stay legible inside 82px desktop and 68px mobile navigation bars.
- Loader logo must remain within the viewport on narrow screens.
- Footer logo may be larger but must preserve the existing grid alignment.
- No horizontal overflow at 390px.

## Verification checklist

- Desktop and 390px mobile screenshots.
- Appointment step one shows only the Continue button.
- Loader always completes and releases page interaction.
- Header menu, mobile dock, and appointment interactions remain functional.
- No missing images or browser console errors.
- GitHub `main` deployment completes under `cicekoto` in `Cicek OTO / cicekotowebsite`.
