#!/usr/bin/env tsx
/**
 * Regenerates docs/generated/ files from live project state.
 * v1: stubs only. Implement in v2 with Supabase CLI + Next.js route introspection.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const GENERATED = path.join(ROOT, 'docs', 'generated');

function writeGenerated(filename: string, content: string): void {
  const full = path.join(GENERATED, filename);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `<!-- AUTO-GENERATED: do not edit -->\n${content}`);
  console.log(`Updated: docs/generated/${filename}`);
}

writeGenerated('db-schema.md', '# DB Schema\n\n> Run `supabase db dump --schema public` to update.\n');
writeGenerated('api-routes.md', '# API Routes\n\n> Run `tsx tools/update-generated.ts` after adding routes.\n');

console.log('update-generated: ✓ Done');
