const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/routes');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const fullPath = path.join(dir, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  // Remove duplicate guards: keep only the first guard after try {
  // Pattern: try {\n    const user = req.user;\n    if (!user) return res.error(401, 'Unauthorized');\n    const user = user;\n    if (!user) return res.error(401, 'Unauthorized');
  content = content.replace(
    /(try \{\n\s*const user = req\.user;\n\s*if \(!user\) return res\.error\(401, 'Unauthorized'\);\n)(\s*const user = user;\n\s*if \(!user\) return res\.error\(401, 'Unauthorized'\);\n)/g,
    '$1'
  );

  // Also handle cases where const user = user; is on its own line without the following guard
  content = content.replace(
    /(try \{\n\s*const user = req\.user;\n\s*if \(!user\) return res\.error\(401, 'Unauthorized'\);\n\s*)const user = user;\n/g,
    '$1'
  );

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log('CLEANED:', file);
  }
}

console.log('Done cleaning duplicates');
