# API authentication

Express checks the NextAuth session cookie. The page guard in `middleware.ts` still only covers `/admin/*`. Identity and role come from the verified JWT, never from the request body.

## How a request is checked

1. `server/middleware/auth.js` `authenticate` reads `next-auth.session-token` or `__Secure-next-auth.session-token`.
2. It decrypts the cookie with `decode` from `next-auth/jwt` and `NEXTAUTH_SECRET`.
3. A missing, expired (beyond the 15-second clock tolerance), tampered, or wrongly signed token leaves `req.user` empty.
4. `lib/api.ts` sends `credentials: "include"`.

Chunked session cookies (`.0`, `.1`) are not joined yet. Needs SME for production cookie domain and SameSite outside localhost.

## Access matrix

| Area | Rule |
|------|------|
| GET products, categories, slugs, images, search, merchants, `/health` | public |
| POST, PUT, DELETE on products, categories, images, main image, merchants | admin |
| All `/api/bulk-upload` routes | admin |
| GET `/api/users`, POST `/api/users` | admin |
| GET, PUT, DELETE `/api/users/:id` | that user or admin |
| GET `/api/users/email/:email` | that email or admin |
| GET `/api/orders`, PUT and DELETE `/api/orders/:id` | admin |
| POST `/api/orders` | public; `req.user` is set when a cookie is present |
| GET `/api/orders/:id` | admin, or the user whose email matches the order |
| GET, PUT, DELETE `/api/order-product` | admin. POST stays open and is deprecated |
| All `/api/notifications` | signed in; `/:userId` routes also require that user or admin |
| All `/api/wishlist` | signed in; the user id is the token, not the URL |

`/api/order-product` is deprecated. Checkout creates line items inside `POST /api/orders`.

## Server dependencies

`server/package.json` now declares `next-auth` (JWT decode in `server/middleware/auth.js`), `dotenv` (loaded by `server/app.js`) and `express-rate-limit` (used by `server/middleware/rateLimiter.js`). They were previously resolved only through the root `node_modules`. Declaring them here keeps the server working if it is installed on its own. Whether the repo should become one workspace is still an open SME question (`docs/sme-questions.md`).
