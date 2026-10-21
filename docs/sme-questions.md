# Questions for the SME

Append questions as they arise. Batch them for the daily SME session. Mark answered ones and copy the answer into the relevant review pack.

| # | Date | Story | Question | Safest default used meanwhile | Answer | Rule added to CLAUDE.md? |
|---|------|-------|----------|-------------------------------|--------|---------------------------|
| 1 | 2026-10-21 | Phase 0 | Which test runner and folder layout do you prefer? | Jest 29 with `next/jest` for `__tests__/web/**/*.test.ts`, and a separate `jest.server.config.js` plus supertest for `server/__tests__/**/*.test.js`. Ad hoc scripts in `server/tests/` are excluded. | | |
| 2 | 2026-10-21 | Phase 0 | Are the missing files (RatingPercentElement, SingleReview, WishItem, wishlist controller) intentional? | Leave them. They are recorded in `docs/baseline.md`. `tsc` fails on the first three. | | |
| 3 | 2026-10-21 | Phase 0 | Where do migrations live: root or server? Which Prisma schema is canonical? | Root `prisma/migrations/` and root `prisma/schema.prisma`. Also run `npx prisma generate` in `server/`, because most controllers load that client. Could not confirm with a live migrate: port 3306 is closed. | | |
| 4 | 2026-10-21 | Phase 0 | `tsc` says `next-auth` does not export `NextAuthOptions`, but `node_modules/next-auth/index.d.ts` (v4.24.11) does. `next build` did not print those errors. Which command should CI trust? | Do not change the NextAuth file in Phase 0. Record both results in `docs/baseline.md`. | | |
| 5 | 2026-10-21 | Phase 0 | `app/(dashboard)/admin/users/new/page.tsx` calls `ap(...)` instead of an API client, so creating a user from that screen cannot work. Is this in a story, or a separate fix? | Leave it. S-2 reads this screen but its scope is role validation. | | |
| 6 | 2026-10-21 | Phase 0 | Login still offers Google and GitHub, and those providers are commented out. Remove the buttons? | Leave the buttons. Credentials login is the path the stories use. | | |
| 7 | 2026-10-21 | Phase 0 | `GET /rate-limit-info` does not match `rateLimiter.js` (RF13 is wider than the auth number: general, register, upload, search, and orders all disagree, and `/health` is behind `generalLimiter`). Which numbers are intended? | Do not change limiters. | | |
| 8 | 2026-10-21 | Phase 0 | This machine has no Docker and no MySQL, so CP0 cannot include a seeded click-through. Can the SME or Pratyoosh provide a database, or should we install Docker Desktop? | `.env` files point at `localhost:3306/singitronic_nextjs`. No migrations were applied. | | |
| 9 | 2026-10-21 | Phase 0 | `server/middleware/requestLogger.js` loads `nanoid` with a dynamic `import()`. Jest logs `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG` and the middleware falls back to `Math.random`. Should request ids stay on `nanoid`, and should tests set `--experimental-vm-modules`? | Leave the middleware. The health test accepts the fallback. | | |
| 10 | 2026-10-21 | M-2 | `app/product/[productSlug]/page.tsx` requests `/api/images/${params.id}`, but params has only `productSlug`, so it calls `/api/images/undefined`. Fix with `product.id`? | Left unchanged (outside M-2 scope). | | |
| 11 | 2026-10-21 | S-1 | Prisma error messages can echo customer data. Is logging only error name and code acceptable? | Name and code only for Prisma errors. | | |
| 12 | 2026-10-21 | M-1 | Maximum quantity per order line? | Proposed 10 in `docs/design/M-1.md`. | | |
