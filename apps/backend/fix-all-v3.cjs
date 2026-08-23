const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/routes');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const fullPath = path.join(dir, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  // Step 1: Remove all guard lines
  content = content.replace(/\n\s*const user = req\.user;\n\s*if \(!user\) return res\.error\(401, 'Unauthorized'\);\n/g, '\n');
  content = content.replace(/\n\s*const user = user;\n\s*if \(!user\) return res\.error\(401, 'Unauthorized'\);\n/g, '\n');
  content = content.replace(/\n\s*const user = user;\n/g, '\n');

  // Step 2: Replace user. back to req.user. globally
  content = content.replace(/\buser\./g, 'req.user.');

  // Step 3: Add guards only to handlers with req parameter and auth middleware
  content = content.replace(/(async \(req[,:][^)]+\) => \{\n)(\s*try \{)/g, (match, p1, p2, offset) => {
    // Find the router.METHOD call that contains this handler
    const beforeHandler = content.substring(0, offset);
    const lastRouterMatch = beforeHandler.match(/router\.(get|post|put|delete|patch)\([^)]*\)/g);
    if (!lastRouterMatch || lastRouterMatch.length === 0) return match;
    
    const lastRouterCall = lastRouterMatch[lastRouterMatch.length - 1];
    const hasAuth = /authenticate|authorize|patientAuthenticate|authOrPatient/.test(lastRouterCall);
    
    if (!hasAuth) return match;
    
    return `${p1}${p2}\n    const user = req.user;\n    if (!user) return res.error(401, 'Unauthorized');`;
  });

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log('FIXED:', file);
  }
}

console.log('Done');
