# Verification record

The source package is validated with automated database and calculation tests, TypeScript and a standard Next.js production build.

Database tests run the marketplace migration against an isolated PGlite PostgreSQL engine, with authenticated/anonymous/service roles and an auth-user stub. They cover owner access, restricted writes, private customer/cost data, mixed-batch sale allocation, atomic stock failure, real COD fulfilment, cash collection, idempotent checkout, reservation release, mismatched/late payment handling, subscription ownership/cadence, phone verification, distance checks, stale stock, multi-store checkout and COD cancellation.

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
