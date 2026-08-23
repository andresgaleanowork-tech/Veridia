const fs = require('fs');
const path = require('path');

const files = [
  'src/routes/ai-scribe.ts',
  'src/routes/api-v1.ts',
  'src/routes/auth.ts',
  'src/routes/automations.ts',
  'src/routes/calendar.ts',
  'src/routes/care-process.ts',
  'src/routes/clinical-history.ts',
  'src/routes/clinical.ts',
  'src/routes/meal-plans-generator.ts',
  'src/routes/notifications.ts',
  'src/routes/onboarding.ts',
  'src/routes/patients.ts',
  'src/routes/payments.ts',
  'src/routes/push.ts',
  'src/routes/reports-enhanced.ts',
  'src/routes/service-packages.ts',
  'src/routes/telehealth.ts',
  'src/routes/templates.ts',
  'src/routes/tenants.ts',
  'src/routes/user-settings.ts',
  'src/routes/webhooks.ts',
];

for (const relPath of files) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log('SKIP (not found):', relPath);
    continue;
  }
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace req.user with user globally
  const original = content;
  content = content.replace(/\breq\.user\b/g, 'user');

  // Add guard after try { in each handler
  content = content.replace(/(async \(req[,:][^)]+\) => \{\n)(\s*try \{)/g, `$1$2\n    const user = req.user;\n    if (!user) return res.error('Unauthorized', 401);`);

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log('UPDATED:', relPath);
  } else {
    console.log('NO CHANGE:', relPath);
  }
}

console.log('Done fixing TS18048');
