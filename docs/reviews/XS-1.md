# Review pack: XS-1 Use the configured API address in the bulk-upload screens

## 1. Summary
- Three hardcoded `http://localhost:3001` calls now use `lib/config.ts` (`NEXT_PUBLIC_API_BASE_URL`). Upload builds the URL from `config.apiBaseUrl` and calls `fetch` directly (no JSON Content-Type). History list and delete use `apiClient.get` / `apiClient.delete`.
- Branch: `story/XS-1-bulk-upload-api-url`. No PR opened.
- Red flags: RF7.

## 2. Acceptance criteria evidence
| Criterion | Evidence |
|-----------|----------|
| grep returns only default in config | `grep -rn "localhost:3001" app components lib` -> only `lib/config.ts:2` |
| Unset var, same behaviour | Test `falls back to http://localhost:3001 when unset` |
| Var set, calls go to that host | Test `sends bulk-upload calls to NEXT_PUBLIC_API_BASE_URL when set` (GET and DELETE URLs asserted) |
| Multipart has no JSON Content-Type | Upload still uses raw `fetch` with `FormData` body and no headers (code review; not browser-tested, no DB) |

## 3. Files changed
- `app/(dashboard)/admin/bulk-upload/page.tsx`: import config, template URL.
- `components/BulkUploadHistory.tsx`: `apiClient.get` / `apiClient.delete`.
- `__tests__/web/api-base-url.test.ts`: new.

## 4. Tests
- `__tests__/web/api-base-url.test.ts` (2 tests). Web suite: 3 passed. `tsc`: no errors in touched files (baseline errors unchanged). eslint on touched files: clean.

## 5. How to verify by hand
1. Set `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001`, restart `npx next dev`.
2. Open `/admin/bulk-upload` as admin; network tab shows calls to 127.0.0.1. Not done here: no MySQL, no admin user.

## 6. Decisions marked "Needs SME"
| Decision | Chosen | Alternatives | Why |
|----------|--------|--------------|-----|
| Server components: public vs internal API URL | Not touched | Separate internal var | Out of scope; see sme-questions |

## 7. AI usage notes
- No corrections needed. Not verified in a browser (no database).

## 8. SME verdict
(blank)
