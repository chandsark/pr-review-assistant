// .claude/hooks/pre_tool_use.js — PR Review Assistant 
// Blocks writes outside output/ (except the build files below), common shell writes, and git commit/push. 
  
const ALLOWED_DIRS     = ['output']; 
const BUILD_PATHS      = ['.claude', 'CLAUDE.md', 'coordinator.md', 'README.md']; 
const BLOCK_GIT_WRITES = true;   // prevent accidental commits during review 
const path = require('path'); 
  
let raw = ''; 
process.stdin.on('data', (chunk) => (raw += chunk)); 
process.stdin.on('end', () => { 
  const event = JSON.parse(raw); 
  const input = event.tool_input || {}; 
  const root  = event.cwd || process.cwd(); 
  
  if (event.tool_name === 'Bash') { 
    if (BLOCK_GIT_WRITES && /\bgit\s+(commit|push)\b/.test(input.command || '')) { 
      console.error('HOOK BLOCKED: git commit/push is disabled during a review.'); 
      process.exit(2); 
    } 
    // Basic check: block common shell write commands unless they target output/ 
    const cmd = input.command || ''; 
    const writes = /\b(Set-Content|Add-Content|Out-File|New-Item|Remove-Item|Move-Item|Copy-Item|rm|mv|cp|touch)\b|>/i.test(cmd); 
    if (writes && !/\boutput[\\/]/.test(cmd)) { 
      console.error('HOOK BLOCKED: shell writes are only allowed in output/. Command: ' + cmd); 
      process.exit(2); 
    } 
    process.exit(0); 
  } 
  
  const target = path.resolve(root, input.file_path || ''); 
  const rel    = path.relative(root, target).split(path.sep).join('/'); 
  const inside = (p) => rel === p || rel.startsWith(p + '/'); 
  
  if (!ALLOWED_DIRS.some(inside) && !BUILD_PATHS.some(inside)) { 
    console.error('HOOK BLOCKED: writes are only allowed in output/ and the build files. Attempted: ' + rel); 
    process.exit(2); 
  } 
  process.exit(0); 
}); 