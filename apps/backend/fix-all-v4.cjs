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

  // Step 3: Add guard to ALL async (req,) handlers
  content = content.replace(/(async \(req[,:][^)]+\) => \{\n)(\s*try \{)/g, 
    `$1$2\n    const user = req.user;\n    if (!user) return res.error(401, 'Unauthorized');`);

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log('FIXED:', file);
  }
}

console.log('Done');
