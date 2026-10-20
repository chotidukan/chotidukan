# ChotiDukan Live — independent stores, connected neighbourhoods

## October 20 customer design release

The customer application now uses the requested ivory/forest/saffron design system across shopping, shop profiles, grouped cart/checkout, orders, subscriptions and account screens. Mobile navigation provides Home, Search, Orders and Account. Products appear ahead of the larger shop-discovery and shopping-assistance sections.

- Open `design/design-preview.html` after extracting the ZIP to review Home, Shop, Browse, Cart and Checkout at 390px and desktop widths.
- Read `design/DESIGN-SYSTEM.md` for colour roles, measured contrast, typography, components and the milk/atta/vegetables journey review.
- Run `node scripts/verify-design.mjs` to verify the specified colour contrasts and gallery syntax/assets.
- No new database migration is required. Deploy through the existing Netlify build workflow.
- The gallery contains explicitly labelled sample content and is not part of the live marketplace routing. Browser/device visual QA remains outstanding.

Latest release: see `NEIGHBOURHOOD-UPDATE.md` for trusted shops, repeat baskets, shopping-list matching, Easy mode, merchant Today view and shareable shop links. This update requires no additional migration after 003.

A deployable Next.js application for Netlify, with Supabase PostgreSQL, phone-number customer authentication, independent shop-owner accounts, shared store inventory, real orders, and a merchant reporting studio.

There are **no sample stores, seeded sales, simulated payments or automatic delivery completions** in the application. A new installation starts without stores or orders. After creating a store, its owner can optionally add an editable 24-product starter grocery catalogue from the Inventory dashboard.

## What changed from the earlier package

The private JSON demo workspace has been replaced with normalised shared marketplace tables. A customer sees published stores within 1 km of their location. An owner can manage only stores they own; ownership is enforced in database row-level-security policies and authenticated RPCs, not just in the interface. Private product costs and customer order information have separate access rules.

Customers sign up and sign in by SMS OTP. Shopkeepers have a separate email/password registration and sign-in page, with phone verification as an alternative. Merchant capabilities follow actual store ownership. A customer cannot gain access to another merchant's dashboard by changing a role or a URL.

## Features

- Premium saffron/ivory storefront and forest-green merchant studio, with responsive layouts.
- Browser location and manual delivery pins; great-circle distance filtering within a 1 km radius.
- Store and product search, Hindi/transliterated synonyms (atta/ata/flour/आटा), and merchant-defined aliases.
- Multi-store baskets and one checkout, split into independent store deliveries and fees.
- Actual COD orders, cash-collection confirmation, batch picking lists, estimated arrival countdowns, and shopkeeper-controlled delivery status/ETA changes. An overdue estimate never changes a delivery to completed automatically.
- Razorpay Standard Checkout for UPI/card payments when configured; server-created orders, signature checks, API validation, captured-payment webhooks and replay-safe confirmation.
- Batch receipts, best-before dates, earliest-date-first allocation, date-valid stock checks for the expected delivery date, batch-specific near-date prices, and audited stock removals/releases.
- Private unit purchase costs snapshotted when an order is placed, with explicit cost-coverage indicators in reports.
- Dairy/essential subscriptions: daily, alternate-day or selected-weekday schedules; one-hour IST slots; edit/pause/resume/cancel. These create actual **pay-on-delivery** orders up to 24 hours before a slot. No unapproved recurring online charges or payment mandates are assumed.
- Product photo uploads to an owner-scoped Supabase Storage folder.
- An optional 24-item starter grocery catalogue with bundled, unbranded product photography, realistic editable Indian prices, multilingual search aliases, stock, best-before dates and subscription-ready essentials.

## Starter grocery catalogue

After creating a store, open **Shop owner → Inventory → Add 24 starter products**. The products are normal live inventory: review every pack size, MRP, selling price, purchase cost, stock quantity and best-before date before opening the store. You can edit them individually or remove the starter catalogue. Removal deletes unused starter rows; products already referenced by orders are safely unlisted instead so historical invoices and reports remain intact.

## Merchant reporting studio

Owners can switch between their own stores and select 7-, 30- or 90-day periods. The dashboard contains:

- Gross delivered product sales and comparison with the preceding equal-length period.
- Orders placed, delivered orders, average delivered order value, unique customers and repeat customers within the selected period.
- Sales by day, category sales mix, product best sellers and a product sales ledger.
- Gross cash/online collections on delivered orders, recorded COGS and gross margin for the subset with historical purchase costs, with visible cost coverage.
- Order status, active fulfilment queue, picking lists, customer delivery/contact information and COD cancellation before dispatch.
- Current inventory at recorded cost, low-stock alerts, batches due within 7 days and past-date stock held from checkout.
- Orders by IST hour, weekday/hour heatmap, submitted nearby customer searches and recorded stockout signals.
- 14-day daily demand estimates, estimated stock cover, seven-day reorder suggestions, and active subscription schedules.
- CSV exports for product sales/costs, daily sales/orders, inventory planning and search demand. Formula-leading cells are escaped.

Reports use actual activity. A store with no history sees zero totals and explanatory empty states. Reorder suggestions are labelled estimates. Monetary sales reports are **gross before refunds, gateway fees, settlements and operating expenses**. Sales follow delivery date; order/customer demand follows placement date. Operational order data covers the latest 180 days; current inventory is a live snapshot.

## Stack

Next.js 16 / React 19 / TypeScript / Tailwind CSS 4 plus bespoke CSS / Recharts / Supabase Auth, PostgreSQL and Storage / Netlify Functions / Razorpay REST API. Versions are pinned in `package-lock.json`. Node.js 24 is required.

## Set up Supabase

1. Create a Supabase project. Use a fresh project for this live version if you want a clean separation from the earlier demo.
2. Run `supabase/migrations/000_preflight.sql` in the SQL Editor. If it reports READY, run `001_marketplace.sql` once, then `002_images.sql` and `003_sample_catalog.sql` in order. The installations are transactional. `001_marketplace.sql` is intentionally run once; do not rerun it after a successful installation. `003_sample_catalog.sql` is safe to apply to an existing live schema and only adds the owner-controlled starter-catalogue feature. Do not run `tests/database.test.mjs` against your Supabase project; it uses an isolated in-memory PostgreSQL engine.
3. In Authentication, enable Phone and configure a supported **live SMS provider**. Configure its sender/templates and country delivery settings. Disable test phone/OTP bypasses for launch. Set Supabase rate limits and enable CAPTCHA protection. If using Turnstile, set the same provider secret in Supabase and its public site key in this app.
4. Enable Email/Password for shopkeepers and keep email confirmation on. Configure SMTP for registration emails. Set the Site URL to your deployment origin and allow `/auth/callback` under that origin.
5. Copy the project URL, publishable key and server-only service-role key into your Netlify environment. The service-role key is used only by payment reconciliation and scheduled operations. Never put it in a `NEXT_PUBLIC_` variable.

The original demo table can remain in an existing project, but this application does not read it. Existing demo inventory/orders are not silently converted to real business records.

## Environment and local development

Copy `.env.example` to `.env.local`, fill in your own values, then:

```bash
npm ci
npm run dev
```

Open http://localhost:3000. For local development, set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` and allow that callback in Supabase.

Required for an operational installation:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Your HTTPS site origin; localhost is supported during development |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public application key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only operations/payment key |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Support contact shown in the footer |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public CAPTCHA key when enabled in Supabase Auth |

Optional online-payment configuration:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

SMS credentials live in Supabase Auth's SMS-provider configuration. They do not belong in the browser or this ZIP.

## Enable online payments

1. Complete your Razorpay account setup and configure automatic capture.
2. Start with test-mode keys in a staging deployment. Add a webhook at `https://YOUR_SITE/api/payments/webhook` for `payment.captured` and `refund.processed`. Use the same webhook secret as the environment variable.
3. Once configured, enable online checkout in SQL:

```sql
update public.marketplace_settings set allow_online = true where id = true;
```

4. Complete the payment acceptance checks in `LAUNCH.md`. For real-money launch, use live keys and the corresponding live webhook.

COD is enabled by default. You can disable it using `marketplace_settings.allow_cod`; doing so also prevents new recurring COD subscription occurrences. Online checkout remains hidden until both the database flag and server credentials are configured.

One Razorpay account collects the combined multi-store payment. **This package does not implement merchant split payouts or automatic settlements.** Arrange the marketplace's merchant settlement process and use an approved provider product such as Razorpay Route if automatic splits are required. Gross sales reports are not a settlement ledger.

## Publish on Netlify

1. Put the contents of this source folder at the root of a Git repository. Commit the lockfile, migrations, `netlify.toml`, functions and bundled `public/` artwork. Exclude `.env.local`, `node_modules/` and `.next/`.
2. Import the Git repository in Netlify. The included `netlify.toml` sets Node 24, `npm run build`, `.next` output and the functions folder. Netlify supplies the Next.js/OpenNext adapter.
3. Add environment variables to **Builds and Functions** scopes. `NEXT_PUBLIC_` values must exist during the build.
4. Configure the Supabase redirects, SMS/SMTP/CAPTCHA, Storage and payment settings as described above.
5. Deploy and confirm the native scheduled function **operations** has a five-minute schedule in Netlify. It runs only on published deploys; previews do not execute recurring orders automatically.
6. Run the launch acceptance steps. This source ZIP is not itself a deployed application, and static drag-and-drop hosting is insufficient for its server routes.

## Scheduled operations and reliability

`netlify/functions/operations.mjs` runs every five minutes. It releases stock for unpaid online orders after their 15-minute reservation and generates eligible subscription occurrences up to 24 hours ahead. Database locks and unique customer request keys prevent duplicate checkout orders; subscription run keys prevent duplicate occurrences. If stock is insufficient, a store is closed or a subscription window was missed, no partial order is created and the failure appears in the customer's subscription history.

Pausing/cancelling a subscription affects future occurrences. Orders already materialised remain visible and require normal fulfilment or cancellation. Stores can cancel an un-dispatched COD delivery with a reason; stock is restored once and the customer's total is recalculated. Already dispatched orders and paid-online refunds require operator handling.

Payment capture and inventory release are serialised by a database lock. If capture arrives after stock was released, the order is held as `refund_required` and is not sent for fulfilment. Operators must review and refund those payments through Razorpay. The `refund.processed` webhook records refunded amounts. Partial refunds do not infer a per-store allocation, and reports stay explicitly gross. The application does not automatically issue refunds or assume returned goods are resellable.

Run this operator query regularly, or connect it to your monitoring:

```sql
select id, created_at, total, razorpay_payment_id
from public.orders
where payment_status = 'refund_required';
```

Monitor scheduled-function errors, SMS failure/rate-limit events, webhook retries, overdue deliveries and the refund queue. There is no rider GPS integration or automated dispatch assignment; the selected store/platform operating team fulfils deliveries and the shopkeeper updates the status/ETA.

## Verification

```bash
npm test
npm run typecheck
npm run build
npm run check:config
```

Tests exercise actual PostgreSQL schema/RLS/RPC behavior using PGlite, alongside search, stock quotes, reporting calculations, CSV escaping and cryptographic signature checks. They do not make SMS or Razorpay network calls and are not substitutes for staging-provider tests. See `VALIDATION.md` for the performed checks and remaining integration verification.

## Structure

- `app/` — storefront, customer orders/subscriptions, sign-in pages and merchant studio.
- `app/api/` — authenticated operations, catalogue, orders, checkout and payment webhooks.
- `lib/` — auth clients, stock quotes, reporting and provider verification.
- `supabase/migrations/` — shared marketplace schema, ownership policies, atomic operations and image storage.
- `netlify/functions/` — native scheduled operational worker.
- `tests/` — isolated database and calculation/security tests.
- `public/` — included artwork and favicon; owners can upload their own product images.

## Official integration references

- Supabase phone authentication: https://supabase.com/docs/guides/auth/phone-login
- Supabase cookie-session authentication: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs
- Razorpay Standard Checkout: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
- Razorpay webhook validation: https://razorpay.com/docs/webhooks/validate-test/
- Netlify Next.js: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
- Netlify Scheduled Functions: https://docs.netlify.com/build/functions/scheduled-functions/

## ChotiDukan shopping update

The October 2026 redesign adds a saffron, ivory and forest-green identity, large category tiles with English/Hindi category labels, larger touch controls, reduced-motion support, a keyboard skip link and screen-reader basket feedback. The larger-text preference is saved on this browser; it increases product and checkout text and switches mobile shopping to a single column.

The premium commerce refresh adds a sticky mobile discovery bar, faster location and delivery context, optional browser voice search, popular-search shortcuts, a photographic quick-picks rail, verified-style neighbourhood store cards, clearer stock/savings signals, and a more prominent multi-store basket. Voice search depends on browser support and falls back to typed search without changing permissions or account data.

Customers can save favourites on their device (scoped by signed-in account), find previously ordered products using Buy again, sort available items by price/name, clear filters, and open a persistent basket summary. Buy again only displays products currently returned by the nearby-store catalogue; it does not automatically place orders. Previous order retrieval is limited to the latest 200 orders. Favourites are not cloud-synced. Hindi labels cover categories; the entire interface is not translated. Old Kesariya basket, address and location keys migrate on the same browser origin.

No database migration or new environment variable is required for this redesign. Existing Supabase/SMS/Razorpay configuration is still required. This downloadable package has not been pushed to GitHub or deployed to Netlify automatically.

## Phone browsers

The UI includes iPhone safe-area spacing, resizable checkout dialogs that follow the visible viewport when the keyboard opens, phone/OTP keyboard hints, address autocomplete hints, 44px minimum mobile button heights and 16px minimum input text. Pinch zoom remains enabled. Checkout forms stack on phones, narrow screens use one product column, and short landscape screens avoid a fixed basket overlay.

Before launch, test on physical iPhone Safari and Android Chrome: phone OTP autofill; location allow/deny; product search; quantities; keyboard-open address entry; COD and online payment return; subscriptions; rotation; 200% zoom; larger-text mode; and merchant photo upload. Browser/device execution was not available in the development environment, so these checks remain required.

## Separate customer and staff entry points

- Customers: `/` and `/signin` (phone signup/sign-in).
- Shop owners: `/shop-admin/signin` and `/shop-admin` (existing inventory, order and sales tools).
- Site administrators: `/admin/signin` and `/admin` (read-only platform overview).

Customer navigation and landing pages contain no staff links. These are separate URL paths on the same domain, not DNS subdomains. Staff pages emit noindex metadata. Direct knowledge of an admin URL does not grant access.

For site administrators, create/confirm an email/password user in Supabase Auth and copy its immutable user UUID into server-only `SITE_ADMIN_USER_IDS` in Netlify. Use comma-separated UUIDs for multiple administrators and redeploy after changes. An empty value denies everyone. Do not put this variable in browser-exposed configuration. No public administrator registration is provided. The server verifies the authenticated user before constructing the privileged database client. Shopkeepers still only access their own shops under database row-level security. Customer and staff sessions share the same origin; signing out signs out the active browser session.

The platform overview shows live total shop/product/order counts, refund-required count, and the latest 20 orders, without customer addresses or phone numbers. It is not a refund, settlement, or user-management console. The former `/owner` page routes have been removed; share the new shopkeeper URLs privately. Existing email confirmation links targeting `/owner` should be reissued using the updated signup flow.


### If Supabase reports `relation "profiles" already exists`

Earlier ChotiDukan packages used the generic table name `public.profiles`, which can collide with Supabase starter schemas. The current migration uses `public.chotidukan_profiles` and does not alter or delete an existing `public.profiles` table. Download the latest package and run its `001_marketplace.sql` from the beginning. Because the migration is wrapped in a transaction, the failed attempt that stopped at its first statement did not create later ChotiDukan objects.

First run `000_preflight.sql`. Continue with `001_marketplace.sql` only when it reports READY. If it reports that ChotiDukan tables already exist, the original migration may already have completed; do not rerun it. If it reports a partial or colliding schema because this project contains the earlier ChotiDukan demo, run `000_archive_demo_before_live.sql` once. It moves conflicting demo tables into the private `chotidukan_demo_backup` schema, preserves their rows, removes conflicting demo routines, and leaves `public` ready for the live migration. Confirm its final query returns zero rows, rerun `000_preflight.sql`, then run `001_marketplace.sql`, `002_images.sql` and `003_sample_catalog.sql` in order. Never drop `public.profiles` merely to make this migration run; it may belong to another application.


### Earlier demo in the same Supabase project

`000_archive_demo_before_live.sql` is only for a confirmed earlier ChotiDukan demo, not an unrelated application. It keeps demo table data in `chotidukan_demo_backup`, retains Auth users, preserves `public.profiles`, and keeps Storage files/buckets. The backup schema is revoked from client roles. It removes old demo functions and the three old `product-images` policies because their names would conflict with the live install. It refuses to run again when the backup schema already exists.

Demo rows are archived rather than converted: demo stores, products and orders do not automatically enter the live marketplace because the live schema has stricter ownership, inventory-batch, payment and order structures. Keep the backup until the live installation and acceptance checks have passed. Any later data conversion should be a reviewed migration, not manual copying.
