# Services, booking and reviews edit

## Targets

- `index.html`: services presentation and verified manual Google review fallback.
- `css/style.css`: continuous workshop visual, equal service cards, mobile form clearance.
- `js/main.js`: robust single-service selection and review fallback/API replacement.

## Requested changes

- Replace the repeated, overly dark image treatment in the services cards with one continuous workshop visual and readable equal-width cards.
- Allow the booking flow to proceed reliably with exactly one selected service.
- Prevent the fixed mobile dock from covering the booking action area.
- Show only reviews visibly verified on the linked Google business result until the Google API is configured.
- Keep the Google API path authoritative: live API reviews replace the manual fallback when available.

## Responsive expectations

- Desktop: four equal service cards with stable dimensions and legible descriptions.
- Mobile: horizontal snap cards remain discoverable; booking actions have sufficient bottom clearance above the fixed dock.
- Review cards display one per row on mobile and retain slider controls.

## Verification

- Select one service and advance to vehicle step on desktop and mobile.
- Select multiple services and confirm count/advance still work.
- Confirm manual review names, ratings, dates and excerpts match the visible Google business result.
- Confirm API-backed reviews still replace the fallback when configured.
- Run local link, vehicle-brand, appointment-capacity, integration and security tests.
