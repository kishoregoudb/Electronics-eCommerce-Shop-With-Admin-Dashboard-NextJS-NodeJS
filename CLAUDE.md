# CLAUDE.md: project memory for Claude Code

This repository is an open-source electronics shop (Next.js front end, Express API, Prisma, MySQL). It is a training and evaluation sandbox for InfoVision's AI-enablement approach. The person working with you may have no Next.js or Node experience. A Next.js subject-matter expert (SME) reviews every story. Your job is to deliver the stories in `docs/stories/STORIES.md` with high quality and to make your work easy to review.

Read these before starting any story: `docs/stories/STORIES.md`, `docs/stories/RED_FLAGS.md`.

## Stack and layout (verified at handover)

- Root: Next.js 15 App Router (`next ^15.5`), React 18, TypeScript (`strict`), Tailwind with daisyUI and flowbite-react, Zustand stores in `app/_zustand/`, NextAuth v4 (credentials, JWT sessions, 15-minute expiry), zod, dompurify. Runs on port 3000.
- `server/`: Express 4 API, CommonJS, runs on port 3001 with `node app.js` from `server/`. `server/app.js` loads `server/.env` then the root `.env`.
- Database: MySQL through Prisma. Two schemas, identical at handover: `prisma/schema.prisma` (root client 6.16.1) and `server/prisma/schema.prisma` (server client 6.16.3). Real migrations live in `prisma/migrations/`. `server/prisma/migrations/` contains only `migration_lock.toml`. `server/utills/db.js` loads the root client. Most controllers and scripts instead call `new PrismaClient()` from `@prisma/client`, which resolves to `server/node_modules`. The API does not start until `npx prisma generate` has been run in `server/` as well as at the root. Phase 0 could not apply migrations: nothing is listening on port 3306. See `docs/baseline.md`.
- Folder spelling: the server folder is `utills` (two l's) on purpose; root utilities are `utils`. Do not rename.
- API calls from the front end go through `lib/api.ts` (`apiClient`), which builds URLs from `lib/config.ts` (`NEXT_PUBLIC_API_BASE_URL`, default `http://localhost:3001`). It sends `credentials: "include"` so the browser attaches the NextAuth cookie. Express checks that cookie in `server/middleware/auth.js`. See `docs/AUTH.md`.
- Auth today: `middleware.ts` guards only `/admin/*` pages. The Express API has no authentication (see RED_FLAGS.md, RF1). The login page still calls `signIn("google")` and `signIn("github")`. Those providers are commented out in `app/api/auth/[...nextauth]/route.ts`. Only credentials is active.
- `GET /health` is registered after `generalLimiter`, so it is rate limited. The comment in `server/app.js` that says the health check has no rate limiting does not match the code.
- `GET /rate-limit-info` does not match `server/middleware/rateLimiter.js`. The limiter allows 300 for general, auth, upload, search and orders. Register allows 20 per hour. Wishlist and product limiters are commented out. See RF13.
- `dotenv` is required by `server/app.js` and is not declared in `server/package.json`. It resolves today only because another package installs it. Same pattern as RF14.
- Errors on the server: use `AppError` and `asyncHandler` from `server/utills/errorHandler.js` where the surrounding file does.
- Validation: server in `server/utills/validation.js`; client in `utils/schema.ts` (zod) and `utils/validation.ts`.
- Tests: `npm test` at the repository root runs Jest in-band (`--runInBand`). A worker pool was killed with SIGTERM on this Windows machine. Web tests use `jest.web.config.js` (`next/jest`) and live in `__tests__/web/`. Server tests use `jest.server.config.js` and `supertest`, and live in `server/__tests__/`. `server/app.js` exports the app and calls `listen` only when the file is run directly (`node app.js`). `server/tests/` holds ad hoc scripts and is not part of `npm test`. `server/package.json` still has a placeholder `test` script that exits 1. Use the root command. Dev dependencies added for this runner, and why: `jest` and `jest-environment-jsdom` (web runner), `supertest` (HTTP tests), `@types/jest` and `@types/supertest` (TypeScript). Under Jest, `addRequestId` in `server/middleware/requestLogger.js` fails its dynamic `import('nanoid')` and falls back to `Math.random`. The health test still returns 200.

## Commands

Environment files and setup are in `README.md` (steps 6 to 14), with these corrections to verify in Phase 0: run Prisma commands from the repo root, and note that `server/prisma/migrations/` is empty.

- Install: `npm install` (root), then `npm install` in `server/`.
- Prisma: `npx prisma generate` from the repo root and again from `server/` (both clients are used). Schema changes need a migration from the root (`npx prisma migrate dev`) or `npx prisma db push` for local experiments only. Do not run migrations from `server/`: that folder has no migration history.
- Seed: `node insertDemoData.js` from `server/utills/`. Not run in Phase 0, because MySQL was not available.
- Admin user for testing: `node server/createAdminUser.js <email> <password>`.
- Run API: `cd server && node app.js`. Run web: `npm run dev`. If the API is already running, `npm run dev` can fail with EPERM while Prisma regenerates `query_engine-windows.dll.node`. Stop the API first, or start the site with `npx next dev`.
- Quality checks: `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm test`.

## Working protocol (follow for every story)

1. Read the story and the red flags it lists. Read every file the story names before planning.
2. Make a plan and show it to the engineer before editing. For M-1, L-1 and L-2, also write the design note and wait for SME approval (checkpoint CP-D).
3. Work on a branch named `story/<ID>-<slug>`. Keep commits small.
4. Match existing style. The code uses 2-space indentation, double quotes in TypeScript, and a header comment block on components ("Role of the component", "Name of the component", and so on); copy that block for new components. Server code is CommonJS.
5. Stay inside the story's scope. If you notice something else, append it to `docs/sme-questions.md` or `docs/delivery-log.md` and carry on.
6. Do not add a dependency without stating why in the PR description. Never commit `.env` files or `server/logs/`. Never run destructive database commands against anything but the local development database.
7. Write tests with the code, not afterwards. Run `npx tsc --noEmit`, `npm run lint` and `npm test` before saying a story is done, and show the output.
8. When unsure of a Next.js idiom (server versus client component, caching, routing, environment variables), do not guess silently. Choose the safest option, mark it `Needs SME` in the PR, and add the question to `docs/sme-questions.md`.
9. Fill in `docs/stories/REVIEW_PACK_TEMPLATE.md` for the story. Be candid about where AI output was wrong and how it was caught; that evidence is part of the goal.
10. After SME review, turn each correction into a rule under "Learned rules" below, and record the verdict in `docs/delivery-log.md`.

## Next.js orientation notes (not defects)

- App Router: files under `app/` define routes (`page.tsx`, `layout.tsx`, `route.ts` for API handlers). In Next.js 15, `params` and `searchParams` passed to pages are Promises; the code uses `await params`.
- A file is a server component unless it starts with `"use client"`. Hooks and browser APIs work only in client components. About 46 of 78 component and page files here are client components.
- Server components run on the server, so their `fetch` calls carry no browser cookies.
- Variables prefixed `NEXT_PUBLIC_` are embedded in the browser bundle at build time.
- `middleware.ts` runs on the Edge runtime: Node-only libraries do not work there.
- `app/shop/[[...slug]]/page.tsx` uses `force-dynamic` and `revalidate = 0`, so it is never cached.
- Files starting with `'use server'` (for example `app/actions/index.ts`) are Server Actions.

## Learned rules

Add one line per SME correction, newest last. Format: `[story ID] rule`. Start empty.

## Definition of done

See "Common rules for every story" in `docs/stories/STORIES.md`.
