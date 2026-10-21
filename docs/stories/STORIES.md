# Stories

Seven stories for the Approach 2 evaluation. Red flag IDs (RF1 and so on) refer to `RED_FLAGS.md`.

## Common rules for every story

**Branch and commits.** One branch per story, named `story/<ID>-<short-slug>`. Small commits with clear messages. Never commit `.env` files or `server/logs/`.

**Common definition of done.** A story is done only when all of these hold:

1. All acceptance criteria are met, each with evidence (test name, command output, screenshot or curl output).
2. `npm test` passes (after Phase 0 sets it up), `npx tsc --noEmit` shows no new errors, and `npm run lint` shows no new warnings in the files you touched.
3. No changes outside the story's scope. Anything useful you notice goes to `docs/sme-questions.md` or `docs/delivery-log.md`, not into the diff.
4. The review pack (template in the handover document) is complete.
5. Every correction the SME makes becomes a new rule in `CLAUDE.md` under "Learned rules".
6. The SME verdict (Accept, Accept with changes, Reject) and rework rounds are recorded in `docs/delivery-log.md`.

**SME checkpoints.** CP0 reviews the Phase 0 architecture map and `CLAUDE.md`. CP-D is a 15-minute design review before coding, required for M-1, L-1 and L-2. CP-R is the review of the finished branch, required for every story.

**Order and effort (indicative, to calibrate).** XS-1, S-1, S-2, M-2, M-1, L-1, L-2. Roughly: XS half a day, S half to one day each, M one and a half to two days each, L three to four days each. Start the next story while the previous one waits for review. L-2 branches from L-1.

**Line numbers** in this document were correct at handover. If a line has moved, search for the quoted text.

---

## XS-1: Use the configured API address in the bulk-upload screens

| Field | Value |
|-------|-------|
| Size | XS |
| Order | 1 |
| Depends on | Phase 0 |
| Red flags | RF7 |
| SME checkpoints | CP-R |

**Why.** Three calls hardcode `http://localhost:3001`, so the admin bulk-upload feature breaks in any environment where the API lives elsewhere. `lib/config.ts` already provides `apiBaseUrl` from `NEXT_PUBLIC_API_BASE_URL`.

**User story.** As an administrator, I want bulk upload to work in every environment, so that I can manage products without a developer changing code.

**Scope.** In: replace the three hardcoded URLs. Out: any change to the bulk-upload behaviour, layout or API.

**Files.**

- `app/(dashboard)/admin/bulk-upload/page.tsx` (line 98, a `fetch` POST that sends `FormData`)
- `components/BulkUploadHistory.tsx` (line 54, GET list; line 84, DELETE with a query string)
- `lib/config.ts` and `lib/api.ts` (read, do not change)

**Acceptance criteria.**

- [ ] `grep -rn "localhost:3001" app components lib` returns only the default value inside `lib/config.ts`.
- [ ] With `NEXT_PUBLIC_API_BASE_URL` unset, behaviour is identical to before.
- [ ] With the variable set to another host, all three calls go to that host (show the evidence).
- [ ] The multipart upload still works: the request must NOT carry a JSON `Content-Type` header.

**Tests.** No new framework needed. Include the grep output and, if you introduce a URL helper, a one-line unit test of it.

**Gotchas for a Next.js newcomer.**

- `apiClient` in `lib/api.ts` forces `Content-Type: application/json` and JSON-stringifies bodies. Using `apiClient.post` for the upload would corrupt the multipart request. Build the URL from `config.apiBaseUrl` and call `fetch` directly for the upload. `apiClient.get` and `apiClient.delete` are fine for the other two calls.
- Variables prefixed `NEXT_PUBLIC_` are baked into the browser bundle at build time (see `next.config.mjs`). Changing one needs a restart or rebuild.

**Ask the SME.** Server components also call the API. Should they use the same public address or a separate internal one?

---

## S-1: Stop logging customer personal data on order creation

| Field | Value |
|-------|-------|
| Size | S |
| Order | 2 |
| Depends on | Phase 0 |
| Red flags | RF5 |
| SME checkpoints | CP-R |

**Why.** Order creation logs the whole request body, including name, phone, email and address, to the server console. The checkout page also prints the order to the browser console.

**User story.** As a data-protection owner, I want personal data kept out of logs, so that log access does not expose customers.

**Scope.** In: `createCustomerOrder` and `updateCustomerOrder` logging, the checkout page console output, and one small redaction helper. Out: replacing the logging system, and the email-in-URL pattern in the access log (record it as a note for L-1).

**Files.**

- `server/controllers/customer_orders.js` (line 9 logs `request.body`; about 23 `console.log` calls in total; the success log prints the full created order)
- `app/checkout/page.tsx` (logs the order payload and API responses with `console.log`)
- `server/middleware/requestLogger.js` (read it first and follow its existing pattern)
- New: `server/utills/logSafe.js` and its test

**Acceptance criteria.**

- [ ] No log statement in the order create or update path prints `name`, `lastname`, `phone`, `email`, `adress`, `apartment`, `postalCode` or `orderNotice` values, or a full order object.
- [ ] Logs still identify the event: order id, status, total, item count, request id.
- [ ] A helper such as `redactOrder(obj)` returns a copy with those fields masked, and does not mutate its input.
- [ ] The checkout page no longer logs the order payload or raw API responses to the browser console.
- [ ] No behaviour change in the HTTP responses.

**Tests.** Unit tests for the helper (all sensitive fields masked, non-sensitive fields kept, no mutation, handles missing or null input). One controller-level test that spies on `console.log` during `createCustomerOrder` with a mocked Prisma and asserts no sensitive value appears.

**Gotchas.**

- The file mixes emoji-decorated debug logs and structured ones. Remove or mask only what carries personal data; do not rewrite every log line.
- `createCustomerOrder` is wrapped in its own try/catch, not `asyncHandler`. Do not change that pattern here.

**Ask the SME.** Is there an approved logger and redaction standard for AFG projects? Should this file use the shared request logger instead of `console.log`?

---

## S-2: Accept only valid roles when creating or updating users

| Field | Value |
|-------|-------|
| Size | S |
| Order | 3 |
| Depends on | Phase 0 |
| Red flags | RF2 |
| SME checkpoints | CP-R |

**Why.** `createUser` and `updateUser` copy `role` from the request body without checking it, so any string is stored. The admin check in `middleware.ts` compares `role === "admin"`.

**User story.** As a security owner, I want only known roles accepted, so that bad role values cannot enter the system.

**Scope.** In: validate `role` on create and update. Out: authentication (that is L-1). State clearly in the PR that this story does NOT stop an anonymous caller from setting `admin`; L-1 does that.

**Files.**

- `server/controllers/users.js` (`createUser`: role read at line 20, used at line 44; `updateUser`: read at line 53, applied at lines 84-85)
- `app/(dashboard)/admin/users/new/page.tsx` and `app/(dashboard)/admin/users/[id]/page.tsx` (check which role values the admin screens send)
- `middleware.ts` (shows `admin` is the privileged value)

**Acceptance criteria.**

- [ ] Allowed roles are exactly `user` and `admin`, defined once as a constant in the server code.
- [ ] Create with an invalid role returns 400 with a clear message; create without a role still defaults to `user`.
- [ ] Update with an invalid role returns 400; update without a role leaves the role unchanged.
- [ ] The admin screens still create and edit users (verify manually and say which role values the UI sends).
- [ ] Existing validation (email format, password length of at least 8, bcrypt cost 14) is unchanged.

**Tests.** Unit tests with mocked Prisma: valid roles pass, invalid role rejected, missing role on create defaults to `user`, missing role on update ignored, case sensitivity decided and tested.

**Gotchas.**

- The `role` column is `String?` in `prisma/schema.prisma`; do not change the schema in this story.
- Use the existing `AppError` and `asyncHandler` from `server/utills/errorHandler.js` for errors, like the rest of this file.

**Ask the SME.** Should roles become a Prisma enum? Are there other roles planned (for example `manager`)?

---

## M-2: Make the product page truthful and the build healthy

| Field | Value |
|-------|-------|
| Size | M |
| Order | 4 |
| Depends on | Phase 0 |
| Red flags | RF8 (part), RF12 |
| SME checkpoints | CP-R |

**Why.** The product page shows invented data (stock 94, SKU `abccd-18`, fixed colours) and `ProductTabs` imports two components that do not exist, which breaks type-checking and the build.

**User story.** As a shopper, I want the product page to show only real information, so that I can trust what I buy. As a developer, I want a clean build, so that CI can be trusted.

**Scope.** In: remove the dangling imports in `ProductTabs`; replace fake stock, SKU and colour data with real data or remove it; adapt `StockAvailabillity` and its call sites. Out: building a reviews feature, adding SKU or colour fields to the database, wishlist work (that is L-2).

**Files.**

- `app/product/[productSlug]/page.tsx` (line 75 `stock={94}`; line 80 SKU `abccd-18`)
- `components/ProductTabs.tsx` (imports `./RatingPercentElement` and `./SingleReview`; line 75 colour row)
- `components/StockAvailabillity.tsx` (props `stock` and `inStock`; shows "In stock" when `inStock === 1`)
- `components/index.ts` (check exports and the commented-out `AddToWishlistBtn`)
- `prisma/schema.prisma` (`Product` has `inStock Int`, `slug`, `id`; no SKU, colour or stock count)

**Acceptance criteria.**

- [ ] `npx tsc --noEmit` reports no errors from `ProductTabs.tsx` and the product page. List any remaining baseline errors (for example the wishlist module, which L-2 fixes).
- [ ] The page no longer contains `94`, `abccd-18` or the fixed colour list.
- [ ] Availability reflects `product.inStock`. The unused `stock` prop is removed, with every call site updated (search the repo for `StockAvailabillity`).
- [ ] SKU shows a value derived from real data (for example a short form of the product id), or is removed. Record the choice and why.
- [ ] The product page renders for at least three seeded products, one in stock and one out of stock (screenshots).

**Tests.** If you add a helper (for example `formatSku`), unit-test it. For the page itself, evidence is the type-check result plus screenshots.

**Gotchas.**

- In Next.js 15 the page's `params` is a Promise (see `await params` in the file). Keep that pattern.
- `ProductTabs` is a client component (`"use client"`), while the page is a server component. Data must flow from page to tabs through props.
- `components/index.ts` re-exports components; deleting a file without removing its export breaks other pages.

**Ask the SME.** What SKU convention applies? Should colour and stock count become real product attributes later?

---

## M-1: Make order creation server-authoritative and atomic

| Field | Value |
|-------|-------|
| Size | M |
| Order | 5 |
| Depends on | Phase 0 |
| Red flags | RF3, RF4, RF11 |
| SME checkpoints | CP-D, CP-R |

**Why.** The server stores whatever total the browser sends, and saves the order and its line items in separate calls, so a forged total or a mid-way failure produces bad data.

**User story.** As a business owner, I want the server to calculate order totals and save orders all-or-nothing, so that prices cannot be forged and orders are never half-saved.

**Scope.** In: `POST /api/orders` accepts `items: [{ productId, quantity }]`, loads prices from the database, rejects unknown or out-of-stock products, computes the total, and writes the order and its items in one Prisma transaction; the checkout page sends one request. Out: tax and shipping rules, payment, stock counts, authentication (L-1).

**Files.**

- `server/controllers/customer_orders.js` (`createCustomerOrder`; keep the one-minute duplicate check and the user and notification logic)
- `server/utills/validation.js` (`validateOrderData` at line 320, `validateTotal` near line 280; add items validation)
- `server/controllers/customer_order_product.js` (creates its own `new PrismaClient()`; switch it to `server/utills/db.js`)
- `server/routes/customer_orders.js` and `server/routes/customer_order_product.js`
- `app/checkout/page.tsx` (`orderData` includes `total`; `addOrderProduct` posts each item separately; the UI also shows tax as `total / 5` and shipping of 5)
- `prisma/schema.prisma` (`Customer_order`, `customer_order_product`, `Product.price Int`, `Product.inStock Int`)

**Design checkpoint (CP-D, before coding).** Write a half-page note: the new request and response shape, how the transaction is built, what happens to a client-supplied `total` (default: ignore it and return the computed total), and whether `/api/order-product` stays for backward compatibility (default: keep, mark deprecated). Get the SME's approval.

**Acceptance criteria.**

- [ ] The stored `total` equals the sum of database price times quantity, whatever the client sends (test with a forged total).
- [ ] An unknown product id returns an error and creates no order row.
- [ ] A product with `inStock` other than 1 returns an error and creates no order row.
- [ ] If writing any line item fails, no order or item rows remain (test the transaction path).
- [ ] Quantity must be a positive integer within a sensible maximum, decided with the SME.
- [ ] The response contains the order id and the computed total.
- [ ] Duplicate-order protection and the user notification still work.
- [ ] The checkout page completes an order in one request, and no longer loops over `/api/order-product`.
- [ ] `customer_order_product.js` uses the shared Prisma client.

**Tests.** Unit tests with a mocked Prisma client: forged total, unknown product, out-of-stock product, transaction rollback, quantity limits, duplicate order, happy path. Run them in CI-style with `npm test`.

**Gotchas.**

- `price` and `total` are `Int`. Do not introduce floating-point arithmetic.
- The stored total today is the subtotal; tax and shipping appear only in the UI. Keep those semantics unless the SME decides otherwise.
- Guest checkout is allowed (`userId` is optional). Do not require login in this story.
- `createCustomerOrder` uses its own try/catch and response shapes; match them so the checkout page's error handling still works.

**Ask the SME.** Should the server own tax and shipping? What maximum quantity applies? Prefer an interactive transaction or a nested create?

---

## L-1: Add server-side authentication and authorisation to the Express API

| Field | Value |
|-------|-------|
| Size | L (new capability with unit tests) |
| Order | 6 |
| Depends on | S-2 (recommended), Phase 0 test setup |
| Red flags | RF1, RF2, RF9, RF10, RF14 |
| SME checkpoints | CP-D, CP-R |

**Why.** Today anyone who can reach port 3001 can read all orders, list or delete users, change roles, and edit or delete products. Admin protection exists only on Next.js pages.

**User story.** As a business owner, I want every API request checked for identity and permission on the server, so that only the right people can read or change data.

**Scope.** In: an authentication layer for the Express API using the existing NextAuth session; a route-by-route access matrix; the front-end change that lets the browser send its session; unit and HTTP-level tests; a short `docs/AUTH.md`. Out: refresh tokens, moving to a different auth system, an API gateway.

**Design (propose, then get approval at CP-D).** NextAuth runs with `strategy: "jwt"`, a 15-minute lifetime, and puts `id` and `role` in the token (`app/api/auth/[...nextauth]/route.ts`). A workable design is:

1. A new `server/middleware/auth.js` exporting `authenticate` (attach `req.user` when a valid token is present), `requireAuth`, `requireAdmin` and `requireSelfOrAdmin(paramName)`.
2. Read the NextAuth session cookie (`next-auth.session-token`, or `__Secure-next-auth.session-token` on HTTPS) and decode it with `decode` from `next-auth/jwt` using `NEXTAUTH_SECRET`. The identity and role come from the token, never from the request body.
3. `lib/api.ts` sends `credentials: "include"` so the browser attaches the cookie. CORS already allows credentials (`server/app.js`). Cookies are shared across ports on `localhost`, so this works locally; other environments need a cookie-domain decision.
4. The proposal must include alternatives (for example routing API calls through Next.js route handlers) with a recommendation, for the SME to choose.

**Access matrix (starting proposal, finalise at CP-D).**

| Area | Routes | Access |
|------|--------|--------|
| Catalogue reads | GET on products, categories, slugs, images, main-image, search, merchants (if used by the storefront) | public |
| Health | GET `/health` | public |
| Catalogue writes | POST, PUT, DELETE on products, categories, images, main-image, merchants | admin |
| Bulk upload | all `/api/bulk-upload` routes | admin |
| Users | list, update, delete; GET `/api/users/:id`; GET `/api/users/email/:email` | admin, or the user themselves for their own record |
| User creation | POST `/api/users` | admin (public sign-up already goes through `app/api/register/route.ts`) |
| Orders | GET list, PUT, DELETE | admin |
| Orders | POST create | public (guest checkout), identity attached when present |
| Orders | GET single order | admin or the owner |
| Order items | `/api/order-product` | same as orders |
| Notifications | all | the owning user, or admin |

**Files.**

- New: `server/middleware/auth.js`, tests, `docs/AUTH.md`
- `server/app.js` (call `app.listen` only when run directly and export the app; mount middleware per router; keep the existing order of logging, rate limiting and CORS)
- `server/routes/*.js` (apply guards per the matrix)
- `lib/api.ts` (add credentials)
- `server/package.json` (declare `next-auth`, `dotenv`, `express-rate-limit` if the SME agrees, or document why not)
- Read: `middleware.ts`, `app/api/auth/[...nextauth]/route.ts`, `utils/auth.ts`

**Acceptance criteria.**

- [ ] The access matrix is documented in `docs/AUTH.md` and matches the implementation.
- [ ] No cookie on a protected route returns 401; a valid non-admin token on an admin route returns 403; an admin token succeeds.
- [ ] Expired, tampered or wrongly signed tokens are rejected.
- [ ] `role` and user id come from the verified token. A `role` in a request body can never grant privilege.
- [ ] Public storefront routes still work without a cookie, including the server-side fetches made by the product and shop pages.
- [ ] Admin screens still work when signed in as admin; they fail clearly when signed in as a normal user.
- [ ] `server/app.js` can be imported by tests without opening a port.
- [ ] `GET /api/orders` no longer exposes orders to anonymous callers.

**Tests.** Use `supertest` against the exported app. Generate test tokens with `encode` from `next-auth/jwt`. Cover: each guard (anonymous, user, admin), expired and tampered tokens, self-or-admin, public routes remain open, a spoofed `role` in the body, and one representative route per row of the matrix. Mock Prisma at `server/utills/db.js`.

**Gotchas.**

- Server components in Next.js call the API from the server, where there is no browser cookie. Any route they call must stay public (product page: `/api/slugs/...` and `/api/images/...`; shop and search pages).
- `middleware.ts` runs on the Edge runtime and cannot use Node-only libraries. That is why API checks belong in Express.
- The login screen and header look up the user via `/api/users/email/<email>` from the browser. Keep that working for the signed-in user.
- Existing scripts in `server/tests/` assume an open API. Note which break.
- Rate limiters are mounted before routes in `server/app.js`; keep that order.

**Ask the SME.** Which pattern should the API use: verify the NextAuth JWT in Express, proxy through Next.js route handlers, or a shared session store? What cookie domain and SameSite policy applies outside localhost? Is guest checkout a requirement? Is a single workspace with one `package.json` intended?

---

## L-2: Rebuild the wishlist feature end to end

| Field | Value |
|-------|-------|
| Size | L (new feature with unit tests) |
| Order | 7 |
| Depends on | L-1 merged or its branch as the base |
| Red flags | RF8, RF6, RF1 |
| SME checkpoints | CP-D, CP-R |

**Why.** The wishlist is half removed: the Prisma `Wishlist` model and store exist, but the API controller, the page, the row component and the add button are missing, and the header fetch is disabled. Shoppers see a heart icon that goes nowhere.

**User story.** As a signed-in shopper, I want to save products to a wishlist and see them later, so that I can come back and buy them.

**Scope.** In: API, page, add and remove controls, header count, tests. Out: sharing wishlists, moving items to the cart in bulk, email reminders.

**Files (what exists and what is missing).**

- Exists: `Wishlist` model in `prisma/schema.prisma` (id, productId, userId, cascade on delete); `app/_zustand/wishlistStore.ts`; `components/HeartElement.tsx`; `components/modules/wishlist/index.tsx`; `app/actions/index.ts` (`deleteWishItem` calls `/api/wishlist/${id}`).
- Missing: `server/controllers/wishlist.js` (required by `server/routes/wishlist.js`); the router mount in `server/app.js` (commented out); `app/wishlist/page.tsx`; `components/WishItem.tsx`; `components/AddToWishlistBtn.tsx` (export commented out in `components/index.ts`).
- Disabled: `components/Header.tsx` returns early near line 53 in `getWishlistByUserId`.

**Design checkpoint (CP-D, before coding).** Write a half-page note covering: API shape; how duplicates are prevented (the model has no unique constraint on user plus product; choose a code-level check or a schema change with a migration, and ask the SME); how the old path-parameter user id is replaced; where the heart button appears.

**Default API design (with L-1 in place).**

- `GET /api/wishlist`: the signed-in user's items with product details.
- `POST /api/wishlist` with `{ productId }`: idempotent add.
- `DELETE /api/wishlist/:productId`: remove.
- The user id always comes from the verified token, never from the URL or body.
- Update `server/routes/wishlist.js` accordingly and remove the old `:userId` shapes.

**Acceptance criteria.**

- [ ] The three endpoints work for a signed-in user and return 401 for anonymous callers.
- [ ] A user can never read or change another user's wishlist (test it).
- [ ] Adding the same product twice leaves one row.
- [ ] Adding a product that does not exist returns 404.
- [ ] A heart toggle on the product page adds and removes the item; the header count updates.
- [ ] `/wishlist` lists the items with image, name, stock status and a remove action, and shows an empty state.
- [ ] Header fetching is re-enabled, and no longer needs the email-to-id lookup.
- [ ] Deleting a product removes it from wishlists (existing cascade; verify).
- [ ] `npx tsc --noEmit` shows no remaining errors from the wishlist files.

**Tests.** Controller tests with `supertest`, a mocked Prisma client and test tokens (list, add, duplicate add, remove, unknown product, anonymous, cross-user access). Store tests for `wishlistStore` (add, remove, set, quantity). Note: `wishQuantity` looks stale after `addToWishlist` and `removeFromWishlist` because it is set from the list length before the update. Confirm, fix, and cover it with a test.

**Gotchas.**

- `app/wishlist/page.tsx` can be a server component that renders the client `WishlistModule`. Remember that hooks such as `useSession` only work in client components.
- `app/actions/index.ts` is a Server Actions file (`'use server'`); it calls the API without cookies, so it cannot carry the user's session. Replace it with a client-side call or a different pattern, and ask the SME which.
- There is no `wishlistLimiter` in `server/middleware/rateLimiter.js` even though `/rate-limit-info` mentions one. Decide with the SME whether to add one.
- A schema change must be made in both `prisma/schema.prisma` and `server/prisma/schema.prisma`, plus a migration (see RF6).

**Ask the SME.** Was the wishlist parked for a reason? Code-level uniqueness or a database constraint? Preferred pattern for mutations from client components: direct API call, Server Action, or route handler?
