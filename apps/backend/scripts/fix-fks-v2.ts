import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const files = globSync('src/db/schema/*.ts').filter(f => !f.includes('_common') && !f.includes('index'));

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  
  // Ensure uuid is imported from pg-core
  const hasUuidImport = content.includes("uuid") && content.includes("from 'drizzle-orm/pg-core'");
  const hasUuid = content.includes("uuid(") || content.includes("uuidFk(") || content.includes("uuidPk(");
  
  if (!hasUuidImport && hasUuid) {
    content = content.replace(
      /import \{([^}]+)\} from 'drizzle-orm\/pg-core';/,
      "import {$1, uuid} from 'drizzle-orm/pg-core';"
    );
  }
  
  // Add users import if it uses users.id
  if (content.includes('users.id') && !content.includes("import { users } from './users'")) {
    content = content.replace(
      /import \{([^}]+)\} from '\.\/_common';/,
      "import {$1} from './_common';\nimport { users } from './users';"
    );
  }
  
  // Add patients import if it uses patients.id
  if (content.includes('patients.id') && !content.includes("import { patients } from './patients'")) {
    content = content.replace(
      /import \{([^}]+)\} from '\.\/_common';/,
      "import {$1} from './_common';\nimport { patients } from './patients';"
    );
  }
  
  // Add automations import if it uses automations.id
  if (content.includes('automations.id') && !content.includes("import { automations } from './automation'")) {
    content = content.replace(
      /import \{([^}]+)\} from '\.\/_common';/,
      "import {$1} from './_common';\nimport { automations } from './automation';"
    );
  }

  // Replace uuidFk('field', 'table') with proper FK
  content = content.replace(
    /uuidFk\('([^']+)',\s*'users'\)/g,
    "uuid('$1').references(() => users.id, { onDelete: 'cascade' })"
  );
  
  content = content.replace(
    /uuidFk\('([^']+)',\s*'patients'\)/g,
    "uuid('$1').references(() => patients.id, { onDelete: 'cascade' })"
  );
  
  content = content.replace(
    /uuidFk\('([^']+)',\s*'automations'\)/g,
    "uuid('$1').references(() => automations.id, { onDelete: 'cascade' })"
  );

  writeFileSync(file, content);
  console.log(`Fixed: ${file}`);
}

console.log('All FKs fixed!');
