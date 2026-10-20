# Verification record

October 20 customer design release: 25 automated tests, TypeScript and the full Next.js production build pass. `scripts/verify-design.mjs` verifies seven foreground/background or control-boundary contrasts and the design gallery's JavaScript syntax and image/stylesheet paths. White on saffron fails normal-text AA (3.17:1), so the theme uses forest primary buttons and dark text with saffron selection accents. These are token checks, not a full WCAG certification. Browser visual/device and screen-reader verification remain outstanding.

Latest neighbourhood release: 25 automated tests pass, including stock-capped basket merging and duplicate/invalid additions. TypeScript and the Next.js production build pass. Browser visual and physical-device verification remain outstanding.

The source package is validated with automated database and calculation tests, TypeScript and a standard Next.js production build.

Database tests run the marketplace migrations against an isolated PGlite PostgreSQL engine, with authenticated/anonymous/service roles and an auth-user stub. They cover owner access, restricted writes, private customer/cost data, mixed-batch sale allocation, atomic stock failure, real COD fulfilment, cash collection, idempotent checkout, reservation release, mismatched/late payment handling, subscription ownership/cadence, phone verification, distance checks, stale stock, multi-store checkout, COD cancellation, and owner-scoped starter catalogue add/remove behavior.

Calculation tests cover browser stock quotes, Hindi/transliterated aliases, phone parsing, HMAC signature rejection, historical cost coverage, empty-report behavior and spreadsheet formula escaping.

The local tests do not contact Supabase Auth, SMS providers, Supabase Storage, Razorpay or Netlify. Hosted database integration, confirmation email/SMS delivery, actual payment capture/refunds, browser visual testing and scheduled production execution remain to be verified with your own environment. Follow LAUNCH.md.

## Completed local results

- 19 automated tests passed (12 PostgreSQL ownership/transaction/workflow tests and 7 calculation/security tests).
- TypeScript checking passed.
- Next.js 16.3.4 production build passed for all application routes and the session proxy.
- Browser visual QA and live provider/network acceptance are not verified in this environment.

## ChotiDukan redesign validation

21 automated tests passed, including two shopping-filter tests for favourites, purchase history, local-catalogue intersections, availability and price sorting. TypeScript and Next.js production build passed. Responsive styles were implemented, but browser visual and screen-reader testing were not available. Live SMS/payment provider testing remains outstanding.

## Phone browser hardening

Production build (including TypeScript) rerun after viewport, keyboard-aware dialog, mobile touch target and safe-area changes. Physical iPhone Safari / Android Chrome and visual browser checks remain outstanding; no claim of device certification is made.

## Separate staff access

22 automated tests pass, including exact administrator-ID matching and fail-closed cases for anonymous users, empty configuration, substring matches and self-claimed role metadata. Production build regenerates the routes after moving the shopkeeper pages to /shop-admin and adding /admin. Browser and live-account acceptance checks remain outstanding and are listed in LAUNCH.md.

## Demo-to-live database preparation

The package includes a one-time archival SQL script for a confirmed earlier ChotiDukan demo. It preserves conflicting table data in `chotidukan_demo_backup`, revokes client access to that schema, preserves Auth users/public.profiles/Storage files, removes named demo routines and old product-image policies, and checks that live public table names are free. This script has not been executed against the user's hosted Supabase project; its final zero-row check and the preflight must pass there before the live migration is run.

## Premium catalogue update

23 automated tests pass, including an owner-isolation test that creates exactly 24 starter products, prevents duplicate active catalogues, blocks another owner, and removes active starter items without damaging order history. TypeScript and the Next.js production build pass. The bundled photo atlases were visually inspected; physical-device browser testing and live Supabase/provider acceptance still remain launch checks.

## Premium storefront refresh

The customer interface now includes responsive commerce discovery, voice-search fallback handling, quick product and store rails, savings/stock indicators, and mobile sticky controls. All 23 automated tests and the Next.js production build pass after the refresh. Physical iPhone Safari and Android Chrome visual/voice-search acceptance remains required before public launch.
