# Hizmetler page specification

## Route and purpose

- Route: `/hizmetler` backed by `hizmetler.html`
- Purpose: explain Çiçek Otomotiv's VAG-focused services in enough detail for customers and local search engines, without duplicating or replacing the booking flow on the homepage.
- Primary CTA: `/index.html#randevu`
- Secondary CTA: Google Maps directions and telephone.

## Page structure

1. Branded VAG specialist hero with service and location context.
2. Volkswagen, Audi, Škoda, SEAT and CUPRA expertise grid.
3. Detailed sections for periodic maintenance, DSG, engine/electronics, brakes/suspension/A-C.
4. Service-process assurance cards.
5. Service-specific FAQ.
6. Booking CTA and shared footer/contact shortcuts.

## Design system

- Reuse the Manrope/Space Grotesk typography, official turquoise/red palette, fixed header, logo, shell sizing, buttons, reveal motion, light/dark theme and mobile dock.
- New page-only styles live in `css/pages.css`.
- Copy uses only existing verified business details and avoids invented pricing or repair guarantees.

## SEO and discovery

- Unique title, description, canonical, Open Graph metadata and `AutoRepair`/`Service` JSON-LD.
- Add `/hizmetler` to `sitemap.xml` and create a static internal link from the homepage.
- Keep `/admin` excluded from crawling.

## Verification

- Validate HTML structure and JavaScript syntax.
- Verify `/hizmetler`, homepage links and booking CTA at desktop and mobile widths.
- Confirm no horizontal overflow or missing assets.
