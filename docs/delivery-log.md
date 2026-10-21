# Delivery log

One row per story. This log feeds the evidence for the Approach 2 pitch, so fill it in accurately and on the day.

| Story | Start | Ready for review | Reviewed | Claude Code sessions | Tests added | SME verdict | Rework rounds | Defects found by SME | Rules added to CLAUDE.md |
|-------|-------|------------------|----------|----------------------|-------------|-------------|---------------|----------------------|--------------------------|
| Phase 0 | 2026-10-21 | 2026-10-21 | | 1 | 2 (`__tests__/web/config.test.ts`, `server/__tests__/health.test.js`) | | | | 0 (SME has not reviewed yet) |
| XS-1 | 2026-10-21 | 2026-10-21 | | 1 | 2 (`__tests__/web/api-base-url.test.ts`) | | | | 0 |
| S-1 | 2026-10-21 | 2026-10-21 | | 1 | 9 (`logSafe.test.js`, `customer_orders.logging.test.js`) | | | | 0 |
| S-2 | 2026-10-21 | 2026-10-21 | | 1 | 16 (`users.roles.test.js`) | | | | 0 |
| M-2 | 2026-10-21 | 2026-10-21 | | 1 | 2 (`formatSku.test.ts`) | | | | 0 |
| M-1 | 2026-10-21 | 2026-10-21 | | 2 | 6 (`orders.pricing.test.js`) | | | | 0 |
| L-1 | 2026-10-21 | 2026-10-21 | | 2 | 7 (`auth.test.js`) | | | | 0 |
| L-2 | 2026-10-21 | 2026-10-21 | | 2 | 8 (`wishlist.test.js`, `wishlistStore.test.ts`) | | | | 0 |

## Observations

- 2026-10-21: Phase 0 harness is in the repo (`CLAUDE.md`, `docs/`, `.github/copilot-instructions.md`, Jest). CP0 is not done. Book it with the SME.
- 2026-10-21: Docker and MySQL are not installed. Migrations, seed, demo products, and admin login could not be exercised. `/api/products` returns 500. Page shells for `/`, `/shop`, `/cart`, `/checkout`, and `/login` returned 200. `/admin` returned 307. `/product/demo-slug` returned 500.
- 2026-10-21: The API did not boot until `npx prisma generate` was run inside `server/`. Many controllers construct their own Prisma client from `server/node_modules`, not from `server/utills/db.js`.
- 2026-10-21: `npm run dev` failed with EPERM on the Prisma query-engine DLL while `node app.js` was running, because the dev script generates the client first. `npx next dev` started the site.
- 2026-10-21: `server/app.js` now exports the app and listens only when run directly. That was required for the supertest smoke test. L-1 should treat this as already done.
- 2026-10-21: Dev dependencies added at the root, with the reason recorded in `CLAUDE.md`: `jest`, `jest-environment-jsdom`, `supertest`, `@types/jest`, `@types/supertest`.
- 2026-10-21: The engineer directed implementation of M-1, L-1 and L-2 using the defaults already written in `docs/design/`. SME CP-D approval is still outstanding. The combined code is in the `main` working tree so one running app contains every story. Nothing is merged, and no SME verdict has been recorded.
- 2026-10-21: Local MySQL 8.4.13 is running with the credentials already in `.env`. Root migrations are applied, the schema is synced, and `insertDemoData.js` loaded 12 products. A local admin user can sign in.
- 2026-10-21: Each story is on its own branch in `kishoregoudb/Electronics-eCommerce-Shop-With-Admin-Dashboard-NextJS-NodeJS`. L-2 is based on L-1. M-1 is based on S-1 because the order controller already logs through the S-1 helper. CP0, CP-D and CP-R are still open, so the handover definition of done is not met.
- 2026-10-21: Note for L-1: the access log records `/api/users/email/<email>` URLs (left out of S-1 by scope).
