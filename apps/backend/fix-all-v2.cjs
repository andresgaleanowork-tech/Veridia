const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/routes');

// Files that originally had TS18048 errors
const ts18048Files = [
  'ai-scribe.ts',
  'api-v1.ts',
  'auth.ts',
  'automations.ts',
  'calendar.ts',
  'care-process.ts',
  'clinical-history.ts',
  'clinical.ts',
  'meal-plans-generator.ts',
  'notifications.ts',
  'onboarding.ts',
  'patients.ts',
  'payments.ts',
  'push.ts',
  'reports-enhanced.ts',
  'service-packages.ts',
  'telehealth.ts',
  'templates.ts',
  'tenants.ts',
  'user-settings.ts',
  'webhooks.ts',
];

const allFiles = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const file of allFiles) {
  const fullPath = path.join(dir, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  // Step 1: Remove all guard lines
  content = content.replace(/\n\s*const user = req\.user;\n\s*if \(!user\) return res\.error\(401, 'Unauthorized'\);\n/g, '\n');
  content = content.replace(/\n\s*const user = user;\n\s*if \(!user\) return res\.error\(401, 'Unauthorized'\);\n/g, '\n');
  content = content.replace(/\n\s*const user = user;\n/g, '\n');

  // Step 2: Replace user. back to req.user.
  content = content.replace(/\buser\./g, 'req.user.');

  // Step 3: For TS18048 files, add guards to async (req,) handlers
  if (ts18048Files.includes(file)) {
    content = content.replace(/(async \(req[,:][^)]+\) => \{\n)(\s*try \{)/g, 
      `$1$2\n    const user = req.user;\n    if (!user) return res.error(401, 'Unauthorized');`);
  }

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log('FIXED:', file);
  }
}

console.log('Done');
