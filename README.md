# Kesariya — Netlify source package 

This is the latest grocery marketplace demo, adapted to standard Next.js for Netlify. It includes batch best-before dates and near-date discounts, product subscriptions and synonym-aware search, as well as the original shopping, multi-store checkout and shopkeeper dashboard.

**This package uses Supabase for authentication and persistent data.** The original ChatGPT-hosted sign-in and Cloudflare D1 bindings have been removed. The existing hosted demo is unchanged. No credentials or customer/order data are included in this package; a new database starts with the sample stores.

## 1. Create the database and authentication project

1. Create a Supabase project at https://supabase.com/dashboard.
2. Open its SQL Editor, paste `supabase/schema.sql`, and run it. The script creates the workspace table and row-level-security policies. Each signed-in account can access only its own demo workspace.
3. Copy the Project URL and **publishable key** from the project settings. The app does **not** need a secret or service-role key.
4. Under Authentication, enable Email/Password sign-in and user sign-up. Keep email confirmation enabled. For a private demo, you can disable public sign-up and create test users from the Supabase dashboard instead.

## 2. Run locally

Install Node.js 24, then open a terminal in this folder:

```bash
npm ci
```

Copy `.env.example` to `.env.local` and fill in:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

In Supabase Authentication → URL Configuration, add `http://localhost:3000/auth/callback` to the allowed redirect URLs. Then run:

```bash
npm run dev
```

Open http://localhost:3000. Create an account through Sign in → Create an account, confirm your email in the same browser, then sign in. Use a password of at least 12 characters for a new account.

## 3. Deploy to Netlify

1. Extract this ZIP and put the **contents of `kesariya-netlify/`** at the root of a Git repository. Include `package-lock.json`, `netlify.toml`, and the `public/` images. Do not upload `node_modules/` or `.env.local`.
2. Push the repository to your Git provider.
3. In Netlify, choose **Add new project → Import an existing project** and connect that repository.
4. Use the repository root as the base directory. Build command: `npm run build`. Publish directory: `.next`. Node version: `24`. These are also set in `netlify.toml`.
5. Add the three variables from `.env.example` to the Netlify environment. They must be available during builds and to runtime Functions. Set `NEXT_PUBLIC_SITE_URL` to your actual Netlify origin, such as `https://your-site.netlify.app`.
6. In Supabase Authentication → URL Configuration, set Site URL to that same origin and allow `https://your-site.netlify.app/auth/callback`. If you later add a custom domain, add its callback and update `NEXT_PUBLIC_SITE_URL` too.
7. Deploy (or trigger a fresh deploy after adding/changing variables). Netlify automatically supplies its Next.js/OpenNext adapter. No manual adapter package is needed.
8. Visit the deployed URL, create a test account, confirm it in the same browser, and sign in.

**Do not use Netlify’s static drag-and-drop deployment for this source ZIP.** This app needs a build plus server-side API routes. Use the Git-connected build above.

## Test the demo

- Explore the sample Faridabad location and add products from two stores. A single checkout produces separate deliveries.
- For shopkeepers → My inventory → edit a product → enable batch tracking. Add dated batches, quantities, and optional sale prices/windows. Checkout picks the earliest available date first; past-date stock is held back.
- Search `atta`, `ata`, `aata`, `flour` or `आटा`. Add other aliases in a product’s editor.
- Subscribe to milk or another eligible essential. Choose daily, alternate days or specific weekdays and an IST time slot. Manage it from Subscriptions.
- Use **Create next demo order** to materialise a subscription occurrence. There is no background order generation, recurring charge or real delivery.

## Files and commands

- `app/` — pages, shopping/merchant UI, sign-in and API routes.
- `lib/` — checkout, stock allocation, search, schedules and Supabase persistence.
- `supabase/schema.sql` — database and row-level-security setup.
- `proxy.ts` — verified cookie-session refresh for Next.js 16.
- `public/` — bundled grocery artwork and icons; no external image hotlinks.
- `tests/` — 20 unit tests for checkout, inventory, search and scheduling.
- `netlify.toml` — Netlify build settings.

```bash
npm test
npm run typecheck
npm run build
```

Node.js 24 is required for the TypeScript unit-test imports. `npm run build` uses the webpack production builder for a predictable portable build.

## Deployment checks and limits

The package is prepared and checked locally. A live Netlify deployment, Supabase project, confirmation emails and real authenticated database access require your accounts and environment variables; they are not provisioned or verified by this ZIP.

This remains a **demo**, with sample prices and stores, simulated payments, simulated delivery progress, and account-isolated shopkeeper sandboxes. Each visitor can manage every sample store in their own workspace. It is not a production multi-merchant permissions model. A real launch needs merchant ownership/approval, real payment and refund processing, delivery operations, and appropriate production controls.

## Troubleshooting

- **“Kesariya is almost ready”**: add the Supabase URL and publishable key, then redeploy. `NEXT_PUBLIC_` values must exist at build time.
- **Could not load/save workspace**: run `supabase/schema.sql` in the same Supabase project used by the environment variables. Confirm you are signed in.
- **Confirmation redirects to localhost**: update Supabase Site URL/allowed redirects and `NEXT_PUBLIC_SITE_URL`, then redeploy.
- **Confirmation fails in another browser**: the PKCE sign-up flow needs the original browser cookie. Open the link in the browser where you registered, or sign in after your email has been confirmed.
- **Email not received**: check spam, Supabase email configuration, and provider rate limits. Configure your SMTP service for a broader pilot.
- **No nearby stores at actual location**: use the marked sample Faridabad neighbourhood or create a sample store at your selected coordinates.

## Official references

- Netlify Next.js deployment: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
- Supabase cookie-based server authentication: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs

## Validation performed for this package

- 20 domain feature tests passed.
- TypeScript checking passed.
- Next.js 16.3.4 webpack production build passed, including pages, API routes and session proxy.
- Live Netlify hosting and authenticated Supabase integration were not exercised because no user-owned project credentials were supplied.
