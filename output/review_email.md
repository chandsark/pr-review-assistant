Subject: Code Review — input/pr.diff — GATE: FAIL
Overall verdict: The JWT login PR is not mergeable because of hardcoded secrets and SQL injection, and the oversized `login()` has no tests or docstring.
Most critical finding (P1): hardcoded credential `API_KEY = "sk-12345prqst98765abcdefg"` at app/auth.py:60, with the JWT signing secret reused from it at app/auth.py:61. The key must be rotated.
Second most critical finding (P1): SQL injection from `%` string formatting of the username at app/auth.py:92, and the same pattern at app/auth.py:119-120 and app/auth.py:126.
Recommended action: block
