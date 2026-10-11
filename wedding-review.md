# Wedding landing review

Draft branch: wedding-leads-landing-2026; PR #1. Do not merge or start ads without owner approval.

## Changes
- RTL cream/gold landing page with four optimized photographs extracted from the existing index.html. No stock images, new testimonials, or prices.
- Existing wedding galleries and reviews linked separately; sample photographs are not claimed to belong to those specific galleries.
- Hero, footer and mobile fixed WhatsApp CTAs retain the existing business short link.
- Keyboard focus, skip link, reduced-motion preference, mobile safe-area spacing, native FAQ controls.

## Verification
Edge browser checks at 320, 390, 768 and 1440 CSS pixels: no horizontal overflow; all four images decoded. No JavaScript errors. WhatsApp placements all use the existing URL. Custom click event, campaign attribution, consent gate and failing analytics integration checked. Screenshots and an embedded-image HTML preview supplied to the owner.

## Tracking setup before advertising
`wedding_whatsapp_click` means a click, not a received message, qualified lead or booking. The page emits a browser CustomEvent with placement, page and allowlisted campaign labels. No storage, advertising pixel, analytics vendor, personal contact data or automatic analytics requests are added.

For a reporting integration, explicitly obtain the appropriate consent, load/configure the chosen analytics service and set `window.weddingAnalyticsConsent = true` only after consent. If an existing `gtag` integration is available the event will then be forwarded. Until this is configured, no central click reports are collected. No GA identifier exists in the current site and none was invented.

Use campaign labels such as `?utm_source=meta&utm_medium=paid_social&utm_campaign=weddings_2026&utm_content=natural_moments`. Only ASCII letters, digits, underscores and hyphens, up to 80 characters, are forwarded. Attribution comes from the current URL; it does not survive separate visits and is not sent to WhatsApp. Actual leads must be recorded in the lead sheet, including source, date, venue, status and outcome. Do not optimize campaigns against click count as though it were qualified leads.

## Owner review
Open the supplied standalone preview and inspect desktop/mobile screenshots. Confirm image choices and copy. Open the WhatsApp button on your phone to confirm it routes to the correct business account; an actual conversation was not sent during testing. Confirm external Pixieset galleries and package details. Connect/validate reporting before any ad spend. Keep PR as draft until approved.
