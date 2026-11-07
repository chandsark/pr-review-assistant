--- 
description: Run a full parallel code review on a PR diff 
argument-hint: <diff-path> 
--- 
  
Read the PR diff at $ARGUMENTS. 
Run the full coordinator workflow (security-agent, quality-agent, doc-agent in parallel). 
Follow coordinator.md and save the result to output/review_report.md. 
Print the Summary section and the GATE line. 