# Baseline

Recorded 21 October 2026, before any story work. Failures below are left in place on purpose. Story work starts after the SME reviews this file and `docs/ARCHITECTURE.md` (CP0).

Machine: Windows, Node v24.13.0, npm 11.6.2. Docker is not on `PATH`. No `mysql` client and no Windows MySQL service. Nothing is listening on port 3306.

## Environment

| Step | Result |
|------|--------|
| Root `.env` and `server/.env` created from README steps 6 and 7 | Done. Both files are gitignored. Database URL points at `localhost:3306/singitronic_nextjs`. |
| `npm install` at the repo root | Passed. 550 packages. |
| `npm install` in `server/` | Passed. 168 packages. |
| `npx prisma generate` at the repo root | Passed. Client 6.16.1 written to the root `node_modules`. |
| `npx prisma migrate dev --skip-seed` in `server/` | Failed. `P1001: Can't reach database server at localhost:3306`. |
| Same command at the repo root | Failed with the same `P1001`. The empty `server/prisma/migrations/` folder was never reached, because Prisma cannot connect. |
| `npx prisma generate` in `server/` | Passed. Client 6.16.3. Required. See "Server start". |
| Seed (`node insertDemoData.js`) and `createAdminUser.js` | Not run. No database. |

`dotenv` is not declared in `server/package.json`, but it is present under both `node_modules` trees as a transitive dependency, so `server/app.js` can load `.env` today.

## Quality checks

Commands were run from the repo root after the installs and the root `prisma generate`.

### `npx tsc --noEmit`

Exit code 2. Eighteen errors:

| File | Error |
|------|--------|
| `app/(dashboard)/admin/users/new/page.tsx:44` | `Cannot find name 'ap'` (the call is the letters `ap`, not `apiClient`) |
| same file, lines 45, 54, 61 | parameters `response`, `data`, and `error` implicitly `any` |
| `app/api/auth/[...nextauth]/route.ts` | `NextAuthOptions` and `Account` are not exported from `next-auth`; `email` missing on `User`; callback bindings implicit `any`; `NextAuth(...)` is not callable |
| `components/modules/wishlist/index.tsx` | cannot find `@/components/WishItem` (RF8, story L-2) |
| `components/ProductTabs.tsx` | cannot find `./RatingPercentElement` or `./SingleReview` (RF8, story M-2) |

Installed `next-auth` is 4.24.11, and `node_modules/next-auth/index.d.ts` does export `NextAuthOptions`. `tsc` still rejects the import. Not fixed. Needs SME.

A later `npx tsc --noEmit`, after `npx next dev` had written `.next/types`, also reports:

- `.next/types/app/api/auth/[...nextauth]/route.ts` — the generated route type does not satisfy Next's handler constraint (`TS2344`)

That file is generated and gitignored. It was not in the first type-check, which ran before the dev server. The new test files do not appear in either run.

### `npm run lint`

Exit code 1. `next lint` warns that the command is deprecated and will be removed in Next.js 16.

One error:

- `components/NotificationBell.tsx:98` — unescaped `'` in `You're all caught up!` (`react/no-unescaped-entities`)

Warnings (not fixed):

- missing `useEffect` dependencies in `admin/merchant/[id]/page.tsx`, `admin/products/new/page.tsx`, `admin/products/[id]/page.tsx`, `app/checkout/page.tsx`, `components/Filters.tsx`, `components/Header.tsx`, `components/modules/wishlist/index.tsx`
- `<img>` in `components/Header.tsx` and `components/SimpleSlider.tsx`

### `npm run build`

Exit code 1. `prisma generate` passed. Next.js 15.5.3 compiled the production bundle successfully, then failed while linting. The log shows the same `NotificationBell.tsx` error and the same warnings as `npm run lint`. The log does not list the `tsc` errors above. Do not treat the compile step as a clean type-check.

## Server start

First `node app.js` (after only the root generate) crashed on import:

`server/controllers/productImages.js` calls `new PrismaClient()` from `@prisma/client`. Node resolves that to `server/node_modules`, whose client had not been generated (`@prisma/client did not initialize yet`).

The same `new PrismaClient()` pattern is in many server files, not only the three named in RF11. Confirmed in: `productImages.js`, `customer_orders.js`, `customer_order_product.js`, `category.js`, `search.js`, `merchant.js`, `notificationController.js`, `server/utills/validation.js`, `notificationHelpers.js`, `insertDemoData.js`, `createAdminUser.js`, `makeUserAdmin.js`, `listUsers.js`, and several scripts.

After `npx prisma generate` inside `server/`, `node app.js` printed `Server running on port 3001`.

| Request | Result |
|---------|--------|
| `GET http://localhost:3001/health` | 200 `{"status":"OK",...}` |
| `GET http://localhost:3001/api/products` | 500. Expected: MySQL is not running. |

## Web smoke

`npm run dev` failed with `EPERM` renaming `node_modules/.prisma/client/query_engine-windows.dll.node` while `node app.js` already had that file open. The dev script runs `prisma generate` before `next dev`.

`npx next dev` then started Next.js 15.5.3 on port 3000. HTTP checks with no browser session:

| URL | Status | What it means |
|-----|--------|----------------|
| `/` | 200 | Page renders. The server log says `Failed to fetch products: Internal Server Error` because `/api/products` is 500. The featured grid is empty. |
| `/shop` | 200 | Page shell renders. Product data depends on the same API. |
| `/product/demo-slug` | 500 | No seeded product. The page also requests `/api/images/${id}` using a route param this file does not receive (`params` only has `productSlug`). |
| `/cart` | 200 | Cart is client state. |
| `/checkout` | 200 | Page renders. An order was not placed. |
| `/login` | 200 | Form renders. Credentials were not submitted. No admin user exists. |
| `/admin` | 307 | Redirect. No session cookie, so the admin middleware does not let the request through. |

Home, shop, a real product, checkout completion, and admin login still need a running MySQL, a seed, and an admin user. Those were not verified.

## Left unchanged

Missing wishlist and review files, hardcoded bulk-upload URLs, order logging, role checks, order totals, and API authentication. Those belong to the stories. The only application code change in Phase 0 is `server/app.js`: it now exports the app and listens only when started with `node app.js`, so `supertest` can import it.

## `npm test`

Added after the checks above. `npm test` runs Jest in-band.

| Suite | Result |
|-------|--------|
| `__tests__/web/config.test.ts` | Pass. `lib/config` exposes `NEXT_PUBLIC_API_BASE_URL` or `http://localhost:3001`. |
| `server/__tests__/health.test.js` | Pass. `GET /health` via supertest returns 200 and `status: OK`. The process does not bind port 3001. |

Jest prints an error from `server/middleware/requestLogger.js`: dynamic `import('nanoid')` is rejected unless Node is started with `--experimental-vm-modules`. The middleware catches that and uses `Math.random`. Question 9 in `docs/sme-questions.md`.
