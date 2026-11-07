# PR Review Assistant 
  
## What this app does 
Analyses a GitHub PR diff (input/pr.diff) and produces a severity-rated code review report. 
Three parallel agents check for security vulnerabilities, code quality issues, and documentation gaps. 
  
## Model routing 
- Sub-agents (security-agent, quality-agent, doc-agent): haiku — fast scanning. 
- Coordinator (main session): sonnet — merges findings and writes the review report. 
  
## Folders 
- input/  — source material. Read only. 
- output/ — the ONLY place generated files are written. 
  
## Coding standards 
- Functions must be under 50 lines. 
- All public functions must have docstrings or JSDoc comments. 
- No hardcoded credentials, API keys, or secrets. 
- SQL queries must use parameterised inputs — never string formatting. 
  
## Severity taxonomy 
- P1 Critical: hardcoded secrets/API keys, SQL injection, missing authentication, command injection, path traversal. 
- P2 Major: functions over 50 lines, missing unit tests for new code, undocumented public functions, high cyclomatic complexity (>10). 
- P3 Minor: style issues, TODO comments that block merge, stale README references, missing type hints on public functions. 
  
## Do not 
- Do not write generated files outside output/. 
- Do not commit or push during a review. 
- Do not flag TODO comments as issues unless they block a merge. 
- Do not add findings not supported by the diff. 