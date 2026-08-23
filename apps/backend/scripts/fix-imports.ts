import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const files = globSync('src/db/schema/*.ts').filter(f => !f.includes('_common') && !f.includes('index'));

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  
  // Add uuid import if used but not imported
  const usesUuid = content.includes('uuid(') || content.includes('uuidFk(') || content.includes('uuidPk(');
  const importsUuid = content.includes('uuid') && content.includes("from 'drizzle-orm/pg-core'");
  
  if (usesUuid && !importsUuid) {
    content = content.replace(
      /import \{([^}]+)\} from 'drizzle-orm\/pg-core';/,
      "import {$1, uuid} from 'drizzle-orm/pg-core';"
    );
  }
  
  writeFileSync(file, content);
  console.log(`Fixed imports: ${file}`);
}

console.log('All imports fixed!');
