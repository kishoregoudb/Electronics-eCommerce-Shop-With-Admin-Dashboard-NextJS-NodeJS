# Copilot instructions

Derived from `CLAUDE.md` during Phase 0. If the two files disagree, `CLAUDE.md` is the source of truth. The Next.js SME reviews every story.

This is an electronics shop: Next.js 15 App Router on port 3000, Express on port 3001, Prisma, MySQL. The engineer may not know Next.js. Stay inside the story in `docs/stories/STORIES.md`. Read `docs/stories/RED_FLAGS.md` before editing.

## How to work

- Show a plan before editing. For M-1, L-1, and L-2, write the design note and wait for SME approval before coding.
- Use a branch named `story/<ID>-<slug>`. Small commits. Do not commit `.env` files or `server/logs/`.
- Match the file you are editing. TypeScript uses 2-space indentation and double quotes. New components copy the existing header comment block (`Role of the component`, `Name of the component`, and the rest). Server code is CommonJS.
- Do not rename `server/utills` (two l's). Root helpers live in `utils`.
- Do not add a dependency without saying why. Do not widen a story because you noticed something else. Append the note to `docs/sme-questions.md` or `docs/delivery-log.md`.
- Write tests with the code. Before calling a story done, run `npx tsc --noEmit`, `npm run lint`, and `npm test`, and show the output.
- When a Next.js choice is uncertain (server versus client component, caching, `params` as a Promise, `NEXT_PUBLIC_` variables), pick the safest option, mark it `Needs SME`, and add the question to `docs/sme-questions.md`.
- Do not claim a command passed unless it was run. Do not run destructive database commands against anything except the local development database.

## Facts that are easy to get wrong

- Front-end API calls go through `lib/api.ts`, using `lib/config.ts`. `apiClient.post` forces JSON. Multipart uploads must use `fetch` and `config.apiBaseUrl`.
- `middleware.ts` protects only `/admin/:path*` pages. The Express API does not check identity. Do not pretend a page guard protects an API route.
- In Next.js 15, `params` and `searchParams` on pages are Promises. Existing pages use `await params`.
- A file is a server component unless it starts with `"use client"`. `middleware.ts` is Edge. Do not import Node-only libraries there.
- `NEXT_PUBLIC_` values are baked in at build time.
- Generate Prisma from the repo root and from `server/`. Migrations live only in `prisma/migrations/`. `server/utills/db.js` uses the root client. Most controllers call `new PrismaClient()` and get the server-local client.
- `server/app.js` exports the app and listens only when started with `node app.js`.
- `npm test` is the root Jest command (`jest.web.config.js` and `jest.server.config.js`, in-band). Do not point it at the ad hoc scripts in `server/tests/`. The `test` script inside `server/package.json` is still a placeholder.
- If `node app.js` is running, `npm run dev` can fail with EPERM on the Prisma query engine. Stop the API, or use `npx next dev`.

## Learned rules

Copy new SME corrections into `CLAUDE.md` under "Learned rules". Repeat them here when that section changes.
