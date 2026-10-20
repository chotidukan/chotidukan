# Launch acceptance guide

Use a staging deployment with your own Supabase project and payment-provider test mode first. Then repeat the essential checks on your live configuration before accepting public orders.

## Accounts and ownership

1. Request and verify an actual SMS code on two different phones. Check wrong/expired codes, resend cooldown, CAPTCHA and provider rate limits. Confirm there are no test-OTP bypasses.
2. Create two shopkeeper accounts, complete confirmation emails and sign in. Create a separate store for each. Confirm neither owner can load or change the other's products, batches, delivery details, purchase costs or reports, including through direct API requests.
3. Apply `003_sample_catalog.sql`. If using the Inventory dashboard's starter catalogue, review all 24 product names, pack sizes, selling prices, MRPs, costs, stock and best-before dates. Replace any catalogue photo that could mislead customers about the actual product or pack.
4. Keep stores closed until their opening inventory, location pin, delivery fees, provider and estimates have been reviewed. Open a store and confirm customers within 1 km see it while customers outside do not.
5. Test **Remove starter products** before taking orders and after a staging order. Confirm unused items are deleted, while ordered products become unlisted and remain visible in order/report history.

## Orders and money

1. Place a real staging COD order across both stores. Confirm quantities, batch picking dates, sale-unit prices, per-store delivery fees and the total. Check stock drops once and repeated checkout submission returns the existing order.
2. Advance each store's delivery separately. Verify an overdue ETA stays overdue until updated, and COD completion requires cash collection. Cancel an un-dispatched COD delivery and confirm stock and the customer total are adjusted once.
3. Use provider test mode to test online payment success, failure, a closed popup, retry from My orders and a payment where the browser closes before the webhook arrives. Require captured status before fulfilment.
4. Test a forged webhook signature and duplicate webhook. Let an unpaid reservation expire and confirm stock is restored once. Simulate late capture after release, review `refund_required`, process a provider refund and confirm the refund webhook updates the order.
5. Configure real merchant settlement arrangements before collecting a multi-store live payment. Gross reports in this package do not execute merchant payouts.

## Subscriptions and operations

1. Create a recurring COD subscription with a near-future slot. Confirm the Netlify operations function runs and creates one occurrence, with date-valid stock, no duplicate orders and the correct next slot.
2. Verify daily, alternate-day and selected-weekday schedules in IST. Pause/resume/cancel and inspect schedule history. Test an unavailable product and a missed slot; the failure should be recorded without a partial order.
3. Confirm only published production deploys run the native schedule. Use a separate database or disable the function for staging when you do not want actual recurring orders.
4. Confirm support contact, SMS/SMTP delivery, operational logs and refund monitoring are staffed. Complete your business's customer terms, privacy, returns, invoicing and fulfilment requirements before public launch.

## Reports

1. Deliver known test orders with and without recorded purchase costs. Reconcile product sales, delivery fees, units, average order value, COGS coverage and category totals with the order records.
2. Compare period boundaries and order-hour heatmaps with IST timestamps. Confirm unknown costs produce incomplete coverage, not invented margin.
3. Export CSVs and reconcile their totals. Check that no customer can access merchant costs or reports.

No live SMS, payment-provider account or Netlify credentials are included in the package. Its successful local build does not establish that your external configuration has passed these acceptance checks.

### Staff entry checks

Provision a site administrator and configure SITE_ADMIN_USER_IDS. Verify logged-out `/admin` redirects to `/admin/signin`; a normal customer or shopkeeper gets Access restricted; and only allowlisted UUIDs can see platform totals. Confirm customer header/footer/home contain no staff links and `/signin` still uses phone signup/login. Test `/shop-admin/signin` registration, confirmation redirect, and own-store inventory and sales access. Add `/auth/callback` to Supabase's permitted redirect URLs as before. Removing an admin ID and redeploying must revoke overview access.
