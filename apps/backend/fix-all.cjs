const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/routes');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const fullPath = path.join(dir, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  // Step 1: Remove all guard lines and duplicate declarations
  content = content.replace(/\n\s*const user = req\.user;\n\s*if \(!user\) return res\.error\(401, 'Unauthorized'\);\n/g, '\n');
  content = content.replace(/\n\s*const user = user;\n\s*if \(!user\) return res\.error\(401, 'Unauthorized'\);\n/g, '\n');
  content = content.replace(/\n\s*const user = user;\n/g, '\n');

  // Step 2: Replace user. back to req.user. (but keep req.user in guards that we just removed)
  content = content.replace(/\buser\./g, 'req.user.');

  // Step 3: Add guards to handlers that use req.user and have req parameter
  // Match async handlers with req parameter
  content = content.replace(/(async \(req[,:][^)]+\) => \{\n)(\s*try \{)/g, (match, p1, p2) => {
    // Extract the handler body (from try { to the matching });
    // We need to check if the handler contains req.user
    const handlerStart = content.indexOf(match);
    if (handlerStart === -1) return match;
    
    // Find the handler body - this is complex, so instead we'll do a simpler check
    // Just add the guard; if the handler doesn't use req.user, it's harmless
    // But we need to avoid adding guards to public endpoints without authenticate
    // We'll check if authenticate or authorize middleware is present before the handler
    const beforeHandler = content.substring(0, handlerStart);
    const hasAuth = /authenticate|authorize|apiKeyAuth|patientAuthenticate|authOrPatient/.test(beforeHandler.slice(-200));
    
    if (!hasAuth) {
      return match; // Skip public endpoints
    }
    
    return `${p1}${p2}\n    const user = req.user;\n    if (!user) return res.error(401, 'Unauthorized');`;
  });

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log('FIXED:', file);
  }
}

console.log('Done fixing all files');
