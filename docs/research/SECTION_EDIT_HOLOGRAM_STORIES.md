# Hologram story sections edit

## Targets

- `index.html` hero: remove the circular `VAG UZMANI` scan badge.
- `index.html` first story: replace the visually empty media side with a clearly visible holographic OBD diagnostic scene.
- `index.html` second story: replace the visually empty media side with a holographic live service-tracking interface.

## Files

- `index.html`: semantic scene layers and labels.
- `css/style.css`: hologram composition, motion, responsive rules, light-theme continuity and reduced-motion behavior.

## Responsive expectations

- Desktop: visual and copy remain balanced in the existing two-column story grid.
- Tablet/mobile: each visual becomes a compact, readable panel above/below its related copy without horizontal overflow.
- The visual panels intentionally remain dark in both themes so cyan/red hologram contrast is preserved.

## Interactions and motion

- Diagnostic rings rotate, scan beam travels vertically, target points pulse and telemetry cards float subtly.
- Service tracker uses a softly floating vehicle, animated route/progress line and live-state pulse.
- All continuous motion is disabled under `prefers-reduced-motion: reduce`.

## Verification

- Badge is absent from the hero DOM.
- Both story scenes remain visible before and after scroll reveal.
- Desktop and mobile screenshots show meaningful visual content.
- Static link, syntax and security tests still pass.
