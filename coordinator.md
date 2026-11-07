# Coordinator — PR Review Report 
  
## Task 
Produce a code review report for the diff named in the request (default: input/pr.diff). Follow CLAUDE.md. 
  
## Steps 
1. Read the diff file once using the Read tool. 
2. In a single step, launch these three sub-agents IN PARALLEL. 
   Pass each one the full diff text — they do not share your context: 
     - security-agent → P1/P2 security findings table 
     - quality-agent  → P2/P3 quality findings table 
     - doc-agent      → P2/P3 documentation findings table 
3. Wait for all three to finish. Merge findings by severity: collect all P1s first, then P2s, then P3s. 
   De-duplicate identical findings. Do not rewrite any finding. 
4. Append GATE: FAIL if any P1 finding exists, otherwise GATE: PASS. 
5. Write the result to output/review_report.md. 
  
## Output format  (output/review_report.md) 
# PR Review Report — <PR number or file name> 
## Summary          (2-sentence overview of the PR and overall quality) 
## P1 Critical      
| File:line | Agent | Finding | Suggested fix | 
## P2 Major         
| File:line | Agent | Finding | Suggested fix | 
## P3 Minor         
| File:line | Agent | Finding | Suggested fix | 
## Run Info         (input file · date · model · sub-agents used) 
--- 
GATE: FAIL  ← if any P1 finding 
GATE: PASS  ← if no P1 findings