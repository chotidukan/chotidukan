# Neighbourhood shopping release

This release adds a compact shopping-first homepage, device-local trusted shops, reviewable repeat baskets, English/Hindi shopping-list matching, easier reading mode, a merchant Today view, and shareable shop links.

## Customers

- My trusted shops lets customers pin nearby open shops, see addresses and delivery charges, browse their products, and call the listed business number. Pins are scoped to the account on the current device; they are not cloud-synced.
- Repeat a basket loads delivered products from previous orders. Customers see previous totals, current totals, skipped unavailable items and reduced quantities before adding to the existing basket. Checkout remains a separate step. Existing quantities plus additions are capped against current stock and 99 packs per product.
- Shop my list accepts up to 30 comma-separated or newline-separated product names. Existing English/Hindi synonyms are used. Customers must select each exact product, shop, pack and quantity. This release does not perform handwriting recognition.
- Easy mode increases text and touch targets, removes secondary promotional sections and uses a single product column on phones.
- Unsupported verified, local-favourite and popularity claims were replaced with factual open/nearby/available labels.

## Shopkeepers

- Today is the default dashboard. It shows all active deliveries, overdue estimated arrivals, low-stock products and batches due within seven days. Today's delivered product sales use IST dates and are gross before refunds/fees.
- Active orders are shown in ETA order with the existing packing, delivery and ETA-update controls.
- Share my shop uses the device share sheet or clipboard. The link selects that shop only after the customer sets a delivery pin and the shop is returned by the normal 1 km catalogue query. Closed/out-of-range shops remain unavailable.

## Installation and verification

No new database migration or environment variables are needed beyond the existing installation through 003_sample_catalog.sql. Redeploy the source through Netlify's Git/build workflow.

The existing transaction and security tests plus two new basket-merge tests verify stock caps, duplicate list entries, unavailable products, invalid quantities and preservation of unrelated basket items. Production build includes TypeScript checking.

Before launch, check the new modal flows, phone share-sheet/clipboard fallback, saved-shop isolation, keyboard navigation, enlarged text and mobile layout on iPhone Safari and Android Chrome. Browser visual testing was not available in this workspace.

The broader roadmap remains separate: full Hindi translation of all customer screens/errors, family recipient/payer accounts, seller-approved substitutions, delivery-slot capacity, uploaded shop photographs, QR posters, reviews, loyalty and settlement reconciliation are not implemented by this release.
