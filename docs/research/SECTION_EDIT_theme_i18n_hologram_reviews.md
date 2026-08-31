# Çiçek Oto — Theme, i18n, hologram and reviews edit spec

## Scope

- Preserve the existing neon diagnostic visual system and appointment flow.
- Replace baked/screenshot-like hero imagery with a transparent, generated hologram vehicle asset and CSS motion.
- Replace placeholder testimonials with short, attributed excerpts from the supplied Google Business profile.
- Add persistent light/dark theme and Turkish/English controls in the header.
- Increase undersized typography and repair clipped CTA/button rendering across breakpoints.
- Replace the legacy gold wheel favicon with a compact Çiçek Oto cyan/red automotive mark.

## Verified business source

- Profile: Çiçek Otomotiv | Volkswagen Audi Skoda Seat Özel Servis
- Google rating displayed on 2026-08-31: 4.9 / 5, 168 reviews
- Source URL: https://share.google/Ku7rt8w8gclaphIJl
- Review excerpts are intentionally short and link back to the Google profile.

## Motion and accessibility

- Hologram float, scan and glitch motion remain subtle.
- `prefers-reduced-motion` disables all nonessential motion.
- Theme and language choices persist in `localStorage`.
- Header controls expose accessible labels and pressed states.

## Responsive acceptance

- No horizontal overflow at 390px, 768px or 1440px.
- Header controls remain reachable on mobile.
- Hero copy, CTA buttons and generated vehicle do not overlap.
- Review cards remain readable at one/two/three cards per viewport.
