# Review pack: <Story ID and title>

Copy this file to `docs/reviews/<ID>.md` for each story and fill it in. The SME reads this first.

## 1. Summary
- What changed, in three sentences, in plain language.
- Branch and pull request link.
- Red flags addressed (IDs from RED_FLAGS.md).

## 2. Acceptance criteria evidence
| Criterion | Evidence (test name, command output, screenshot, curl output) |
|-----------|----------------------------------------------------------------|
| | |

## 3. Files changed
List each file with one line on why. Flag any file outside the story's named files and justify it.

## 4. Tests
- Tests added (file and test names).
- Output of `npm test`, `npx tsc --noEmit`, `npm run lint` (paste the summary lines).

## 5. How to verify by hand
Numbered steps the SME can follow in under five minutes, with the expected result for each.

## 6. Decisions marked "Needs SME"
| Decision | Option chosen | Alternatives considered | Why |
|----------|---------------|--------------------------|-----|
| | | | |

## 7. AI usage notes (be candid)
- Where did the AI output need correcting? What caught it (test, type-check, your own review)?
- Any assumption the AI made that turned out to be wrong?
- Rough count of Claude Code sessions and time spent.

## 8. SME verdict (filled by the SME)
- Verdict: Accept / Accept with changes / Reject
- First-review result: accepted as is / needed rework
- Defects found by the SME:
- Rules to add to CLAUDE.md "Learned rules":
