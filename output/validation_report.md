# Validation Report — output/review_report.md and coordinator.md

## 1. Correctness — High
Every finding in `output/review_report.md` was checked against `input/pr.diff` and is backed by code in the diff. No finding is fabricated. Defects found:
- **Wrong line number:** `README.md:~26` should be `README.md:28`. Doc-agent's `:28` was right.
- **Overstated claim:** the `app/auth.py:119-120` finding says the `NULL` branch "is injected as raw SQL text". `NULL` is a fixed literal, and `failed`, `locked_until` and `row["id"]` are all integers. The finding is still valid as a violation of the parameterised-SQL standard, but it is not exploitable. The same applies to the f-string at line 126.
- **Partly inaccurate:** `README.md:20-25` says the response shape is omitted, but the README says "Returns a JWT bearer token." The omitted status codes, lockout behaviour and token usage are real.
- **Severity outside the taxonomy:** weak hashing, the non-constant-time compare, the logged SQL and the missing input validation are rated P2, but none is a P2 category in CLAUDE.md. They are supported by the diff, but the rating is a judgment call.

## 2. Completeness — gaps against the spec
All required parts are present: title, two-sentence Summary, P1/P2/P3 tables with the four columns, Run Info (input, date, model, sub-agents), and `GATE: FAIL` last. Deviations:
- **Mixed line numbering.** Security-agent and quality-agent use diff-file lines, which are 45 higher than real file lines, and doc-agent uses real file lines. The spec's single `File:line` column is therefore not consistent. Run Info discloses this, but it is not fixed.
- **Edited merged rows.** coordinator.md says "Do not rewrite any finding", but the merged rows were annotated (`(doc-agent cites :27)`, `~26`). The raw agent outputs were not available to confirm the rest is verbatim.
- **Extra Run Info content.** "Merge notes" and "Line-number caveat" go beyond the four required items.
- **No input validation in the spec.** coordinator.md had no rule for a malformed input file (fixed below).

## 3. Robustness — broken-input result before the fix
Input: `input/broken_input.txt` contains one line, `zx9 ;;; ### ??? lorem 0000 <<>>`. It has no diff or hunk headers.
- **Before the fix, the spec would have:** launched all three sub-agents on junk, merged zero findings, and emitted `GATE: PASS` into `output/review_report.md`. That is a false "pass" on unreviewed input, and it would overwrite the real report.
- **In this session:** the coordinator was not run. I stopped and asked, because the spec had no defined behaviour.

## Issue Fixed
**Problem:** the coordinator trusted any input file, so non-diff input could produce a misleading `GATE: PASS` and overwrite a valid report.

**Change made:** added step 1a to `coordinator.md`. Before launching any sub-agent, it requires at least one `diff --git` (or `--- a/` and `+++ b/`) header and at least one `@@` hunk header. If either is missing, the coordinator stops. It launches no sub-agents, writes no `output/review_report.md`, emits no `GATE` line, and replies `INPUT ERROR: <file> is not a valid unified diff (missing: ...)`.

**Evidence from the re-run:**
- The step 1a check was applied to `input/broken_input.txt` by pattern search. It found 0 diff or hunk headers, so the new rule gives:
  `INPUT ERROR: input/broken_input.txt is not a valid unified diff (missing: diff header, hunk header)`.
  No sub-agents were launched, no gate was emitted, and `output/review_report.md` was left untouched.
- The same check on `input/pr.diff` found 9 header lines, so valid diffs still pass validation and the normal flow is unchanged.
- **Limitation:** this re-run applied the new rule directly. It was not a full end-to-end invocation of the coordinator in a fresh session.
