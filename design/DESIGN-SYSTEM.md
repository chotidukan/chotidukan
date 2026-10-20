# ChotiDukan — neighbourhood commerce design system

## Direction

Warm, straightforward and quietly premium. Products, shop identity and delivery information carry the experience. Ivory and white dominate; forest green supplies hierarchy and clear actions; sage separates supporting content. Saffron is a restrained selection indicator, not a text colour on ivory. Approximate surface emphasis is 70% neutral, 20% green/sage and 10% or less saffron; this is an art-direction target, not a measured pixel quota.

## Colour roles and contrast

| Role | Colour | Usage |
| --- | --- | --- |
| Canvas | `#FAF7F0` | Main page background |
| Surface | `#FFFFFF` | Product cards, forms, header, navigation |
| Primary | `#173D32` | Headings, navigation, buttons, focus ring |
| Accent | `#D97726` | Selected outlines and small highlights |
| Body | `#242A27` | Main content and prices |
| Supporting surface | `#E7EEE6` | Secondary information and selected fills |
| Secondary text | `#526358` | Pack sizes, explanatory copy, metadata |
| Control border | `#78877D` | Input and button boundaries |
| Decorative border | `#D9E1D8` | Cards and separators, not sole control indicators |
| Error | `#A52A27` on `#FFF2F0` | Errors and urgent information |

Calculated WCAG relative-luminance ratios:

| Pair | Ratio | Normal text AA |
| --- | ---: | --- |
| Forest / white | 12.00:1 | Pass |
| Charcoal / ivory | 13.67:1 | Pass |
| Secondary text / ivory | 5.98:1 | Pass |
| Forest / sage | 10.15:1 | Pass |
| Charcoal / saffron | 4.61:1 | Pass |
| White / saffron | 3.17:1 | Fail — do not use for normal text |
| Error / pale error surface | 6.49:1 | Pass |

Control borders against white are 3.78:1. Focus uses a 3px forest outline with a white separation ring. Selection also uses text weight, `aria-pressed` or `aria-current`; it does not rely on colour alone. These calculations verify the named token combinations, not complete WCAG conformance of every rendered state.

## Typography and spacing

- Font stack: Inter, platform UI sans-serif, Segoe UI, Arial. Inter is used if installed; no external font download or build-time font fetch is required. A licensed self-hosted Inter asset can be added later for identical cross-platform metrics.
- Body and form controls: 16px minimum, line height 1.55. Secondary metadata: 14px; compact category/navigation captions: 12–14px. Product names: 16px mobile / 18px desktop. Page titles: 28px mobile / 34–36px desktop. Section titles: 22px mobile / 26px desktop.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48px. Mobile gutters: 16px. Desktop gutters: 32px with a 1248px maximum container.
- Corners: 8–10px controls, 12–16px cards and sheets. Border-first surfaces with little or no shadow. No gradients or blurred glass in the customer theme.
- Lucide icons paired with action labels; icon-only heart, quantity and close controls have accessible names.

## Components

| Component | Contract |
| --- | --- |
| Search | Prominent field; English/Hindi synonyms; explicit clear and voice controls; keyboard search submits to results |
| Categories | Consistent square imagery; readable names; horizontal mobile strip with Easy mode grid alternative |
| Product | Image, name, pack, shop, estimate, price, Add/quantity; date and subscription only when relevant |
| Quantity | Each minus/plus target is at least 44px; full-width control on 390px product cards |
| Shop | Actual name, description, distance, open state, estimated time, fee and free-delivery threshold |
| Shop profile | Selected-shop view with business address, introduction, delivery information and call action |
| Cart | Grouped by shop, independent estimate/fee, pack quantities and date information |
| Checkout | One sheet: (1) review items, (2) address/payment; item and delivery totals before confirmation |
| Navigation | Mobile Home, Search, Orders, Account; account leads to orders, subscriptions and sign-out |
| Persistent cart | Placed above bottom navigation and safe area; item count, total, delivery count and labelled basket action |
| Orders | Separate store delivery cards, status steps and estimated remaining time |
| Subscription | Clear frequency, next slot, address, pause/resume/edit/cancel actions |

Minimum-order configuration does not exist in the current schema or checkout logic. Accordingly, shop and cart views truthfully state “No minimum order.” Free delivery thresholds are a separate concept and remain visible.

## Homepage hierarchy

Compact brand/account header → location and search → Easy mode/search shortcuts → short brand line → grocery categories → buy-again/favourites/subscription shortcuts → products → nearby shops → shopping-list and trusted-shop tools.

The previous large hero image, duplicate product rail and decorative badges are removed from this path. All stores come from the existing 1 km catalogue. There are no invented ratings, verifications, promises or seasonal labels. Fresh produce is discoverable through its category; a dedicated seasonal feed needs seller-maintained season data before that claim can be made.

## Milk, atta and vegetables review

1. Choose a delivery pin; actual nearby stock and prices load. The new loading state distinguishes fetching from an empty catalogue.
2. Tap Milk or Atta in the search shortcuts, or use aliases such as ata/flour. Search goes to matching products. Fruit & vegetables is available in the category strip.
3. Compare pack and price; Add and quantity controls stay directly on the card. No product-detail detour is needed.
4. The persistent basket reveals the total and number of deliveries. The review groups items by shop, showing fees and estimates before payment.
5. Enter the address and choose the enabled payment method. The existing server validates stock, prices, phone verification and delivery radius.
6. Orders show separate progress for each shop. Repeat basket and subscription flows remain available.

This is a source-based journey review. Physical-device usability and screen-reader testing have not been performed in this environment.

## Review deliverables

Open `design/design-preview.html` after unzipping. It presents Home, Shop, Browse, Cart and Checkout at 390px and 1200px widths using the application styles. Sample shop names and rupee prices are explicitly illustrative. These are HTML design specimens, not screenshots or an additional production demo mode.

Bundled grocery images are photorealistic generated catalogue illustrations, not photographs documenting actual stock. Sellers can upload their own product images. No real shop photographs were provided, so the interface uses an honest shop icon rather than fabricating a storefront or owner portrait.

## Implementation and limits

`app/customer-theme.css` supplies the customer tokens and component rules, scoped under `.customer-app`; staff layouts remain separately scoped. The new `/account` route is customer-only navigation. Existing checkout, payment, inventory, order and subscription services are preserved. No database migration is needed.

The Sites workflow permits browser QA only through the supported browser skill in this managed environment. That capability was unavailable, so no browser preview, screenshot or physical-device pass is claimed. Verify 390px iPhone Safari/Android Chrome, keyboard-open checkout, 200% zoom, screen-reader order status and reduced motion before launch.
