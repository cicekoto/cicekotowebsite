# Remaining production edits

- Fix mobile navigation so the overlay fills the viewport even after the sticky header gains backdrop filtering.
- Remove the stale 18:00 booking choice and align visible copy with the 09:00–17:00 API rules.
- Keep VAG positioning while clearly accepting other makes through the “Diğer / Genel” choice.
- Add Turkish/English/Arabic control to the services page and supply page-specific translations for its primary content.
- Remove public admin links from customer-facing footers.
- Add admin customer grouping and a system/integration health view without exposing environment secrets.
- Record WhatsApp/CallMeBot attempts in appointment events where the existing database permits it.
- Reduce service-worker install weight by avoiding eager precache of large decorative media.
- Verify syntax, integration tests, desktop/mobile visuals and booking interaction before production push.

