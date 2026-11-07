# PR Review Report — input/pr.diff

## Summary
This PR adds a Flask JWT login endpoint (`POST /api/v1/auth/login`) in `app/auth.py`, registers it in the app factory, adds the PyJWT dependency, and documents it in the README. The code has serious security problems (hardcoded secrets and SQL built by string formatting in several places), and `login()` is oversized, untested and undocumented, so the PR is not mergeable as-is.

## P1 Critical
| File:line | Agent | Finding | Suggested fix |
|---|---|---|---|
| app/auth.py:60 | security-agent | Hardcoded credential: `API_KEY = "sk-12345prqst98765abcdefg"` | Remove the literal. Load the key from environment or a secrets manager (e.g. `os.environ["API_KEY"]`) and rotate the exposed key, since it is now in version control history. |
| app/auth.py:61 | security-agent | Hardcoded JWT signing secret reused from the API key: `JWT_SECRET = API_KEY`. Anyone who has the key can forge valid HS256 tokens. | Use a separate secret loaded from configuration (e.g. `os.environ["JWT_SECRET"]`), distinct from the API key. Rotate it and invalidate existing tokens. |
| app/auth.py:92 | security-agent | SQL injection: `query = "SELECT id, username, password_hash, salt, failed_attempts, locked_until, is_active FROM users WHERE username = '%s'" % username` | Use a parameterised query, e.g. `db.execute("SELECT ... FROM users WHERE username = ?", (username,))`. Do not build SQL with `%` formatting. |
| app/auth.py:119-120 | security-agent | SQL built with `%` string formatting: `"UPDATE users SET failed_attempts = %d, locked_until = %s WHERE id = %d" % (failed, locked_until if locked_until else "NULL", row["id"])`. The `NULL` branch is injected as raw SQL text. | Use placeholders and bind values, e.g. `db.execute("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?", (failed, locked_until, row["id"]))`. |
| app/auth.py:126 | security-agent | SQL built with an f-string: `f"UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login = {now} WHERE id = {row['id']}"` | Use bound parameters, e.g. `db.execute("UPDATE users SET ... last_login = ? WHERE id = ?", (now, row["id"]))`. |

## P2 Major
| File:line | Agent | Finding | Suggested fix |
|---|---|---|---|
| app/auth.py:68 | security-agent | Weak password hashing: `hashlib.sha256((salt + password).encode("utf-8")).hexdigest()` is a single fast hash, not a password KDF. | Use a slow, salted KDF such as `hashlib.scrypt`, `argon2`, `bcrypt`, or PBKDF2 with a high iteration count. Migrate existing hashes on next successful login. |
| app/auth.py:73 | security-agent | Non-constant-time secret comparison: `if request.headers.get("X-Api-Key") != API_KEY:` | Use `hmac.compare_digest(request.headers.get("X-Api-Key", ""), API_KEY)`. |
| app/auth.py:93 | security-agent | Sensitive data logged: `logger.debug("running query: %s", query)` writes the full SQL text, including the user-supplied username, to logs. | Remove this log line, or log only a static query name. Never log query text built from user input. |
| app/auth.py:81-82 | security-agent | Missing input validation: `username = payload.get("username", "").strip()` and `password = payload.get("password", "")` assume strings. A non-string value (e.g. a number or list) raises an unhandled error (500). No length cap is applied to `password`. | Check `isinstance(..., str)` for both fields and return 400 otherwise. Enforce a maximum password length (e.g. 128 to 1024 characters) before hashing. |
| app/auth.py:72 | quality-agent | `login()` spans about 76 added lines (lines 72-147), over the 50-line limit. | Extract helpers, e.g. `_validate_credentials`, `_check_lockout`, `_record_failed_attempt`, `_record_successful_login`, and `_issue_token`, so `login()` becomes a short orchestrator. |
| app/auth.py:72 | quality-agent | Cyclomatic complexity of `login()` is well above 10 (about 12 decision points: API key, JSON, empty-field, length, unknown-user, inactive, lockout and password checks, lockout threshold, and two ternaries). | Split the branches into the helper functions above. Use early-return validators to reduce branching in the main path. |
| app/auth.py:72 | quality-agent | New public function `login()` has no unit tests. The diff includes no test files. | Add unit tests covering: missing or bad API key (401), non-JSON body (400), missing fields (400), username over 150 characters (400), unknown user (401), inactive user (403), locked account (423), wrong password with lockout threshold reached, successful login with and without `remember_me`, and the `Cache-Control` header. |
| app/auth.py:72 (doc-agent cites :27) | quality-agent, doc-agent | Public route handler `login()` has no docstring. Its contract (required `X-Api-Key` header, JSON body with `username`/`password`, lockout behaviour, JWT response shape, and error status codes) is undocumented. | Add a docstring covering request format, required headers, response body with the JWT, and each status code the handler can return. |
| app/auth.py:98, app/auth.py:123 | quality-agent | The `jsonify(error="invalid credentials"), 401` response is duplicated for unknown user and wrong password. | Return one shared response for both cases, or move the message into a constant or helper, so the two paths cannot drift apart. |
| app/auth.py:118-127 | quality-agent | The failed-attempt `UPDATE users ...` plus `db.commit()` and the success-path `UPDATE users ...` plus `db.commit()` duplicate the same persistence pattern. | Move the update and commit into one helper such as `_update_user_auth_state(db, user_id, failed, locked_until, last_login)`. |

## P3 Minor
| File:line | Agent | Finding | Suggested fix |
|---|---|---|---|
| app/auth.py:88 | quality-agent | Magic number `150` (maximum username length) is hardcoded. | Define `MAX_USERNAME_LENGTH = 150` at module level and use it in the check. |
| app/auth.py:130 | quality-agent | Magic number `24` in `TOKEN_TTL_SECONDS * 24` for the remember-me TTL is hardcoded. | Define `REMEMBER_ME_TTL_MULTIPLIER = 24` or `REMEMBER_ME_TTL_SECONDS` at module level. |
| app/auth.py:72 | quality-agent | Public function `login()` has no type hints, which the project standard requires for public functions. | Add type hints where the framework allows, for example a return annotation of `tuple[Response, int]`. |
| README.md:~26 (doc-agent cites :28) | quality-agent, doc-agent | The README import snippet `from app.api.authentication import login` points to a module that does not exist in this diff. The handler is in `app/auth.py`. | Change the import to `from app.auth import login`. |
| app/auth.py:27-102 | doc-agent | The ~77-line `login` body has non-obvious logic (API key gate, lockout after `MAX_FAILED_ATTEMPTS`, salted password hash check, failed-attempt counter updates, JWT issuance) with no inline comments. | Add brief comments before each step, especially the lockout check and the counter reset. |
| app/auth.py:16 | doc-agent | `JWT_SECRET = API_KEY` ties the JWT signing secret to the API key with no explanation. | Add a comment explaining the choice (the hardcoded value itself is covered under P1). |
| app/auth.py:17-19 | doc-agent | Constants have no comments on units or semantics: `TOKEN_TTL_SECONDS`, `MAX_FAILED_ATTEMPTS` (per user or per IP?), `LOCKOUT_SECONDS`. | Add a one-line comment per constant stating its unit and what it governs. |
| README.md:20-25 | doc-agent | The Authentication section names the endpoint but omits the response shape, status codes, lockout behaviour, and how to send the returned token (for example `Authorization: Bearer <token>`). | Document the success and error responses, the lockout policy, and token usage. |

## Run Info
- Input file: input/pr.diff
- Date: 2026-11-07
- Model: coordinator sonnet (claude-sonnet-5-5); sub-agents haiku
- Sub-agents used: security-agent, quality-agent, doc-agent (run in parallel)
- Merge notes: two duplicate findings (login docstring, README broken import) were merged and credit both agents. One doc-agent finding was left out: the CHANGELOG entry. The agent said the diff does not show a CHANGELOG, so the diff does not support it.
- Line-number caveat: security-agent and quality-agent line numbers follow the diff-file numbering, which is 45 higher than the real `app/auth.py` line (e.g. `API_KEY` is at diff line 60 and file line 15). doc-agent used real file lines. Findings are kept as the agents reported them.

---
GATE: FAIL
