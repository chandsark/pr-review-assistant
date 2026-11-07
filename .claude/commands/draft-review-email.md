---
description: Draft a 5-line review summary email from output/review_report.md
---

Read output/review_report.md. If it does not exist, stop and tell the user to run /review first.

Write a 5-line email to output/review_email.md (the only place to write it). Exactly five lines, no blank lines, no extra text:

1. `Subject: Code Review — <PR name> — <GATE result>` (use the PR name and the GATE line from the report)
2. Overall verdict: one sentence.
3. Most critical finding, with file reference (path:line if the report gives it).
4. Second most critical finding, with file reference.
5. `Recommended action: <approve | request changes | block>` — block if GATE failed on P1 findings, request changes if only P2/P3 issues need fixing, approve if the report has no blocking findings.

Rules:
- Rank findings by severity (P1 before P2 before P3), then by order in the report.
- Only use findings present in the report. Do not add new ones.
- Do not commit or push.

After writing, print the contents of output/review_email.md.
