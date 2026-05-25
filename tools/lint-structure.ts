#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const errors: string[] = [];

function check(condition: boolean, message: string): void {
  if (!condition) errors.push(message);
}

// 1. docs/superpowers/ must NOT exist
const superpowersDir = path.join(ROOT, 'docs', 'superpowers');
check(
  !fs.existsSync(superpowersDir),
  'docs/superpowers/ must not exist. Move output files: ' +
    'specs → docs/product-specs/, plans → docs/exec-plans/active/. See AGENTS.md.'
);

// 2. docs/exec-plans/active/ files must be non-empty with at least one H2
const activeDir = path.join(ROOT, 'docs', 'exec-plans', 'active');
if (fs.existsSync(activeDir)) {
  for (const file of fs.readdirSync(activeDir)) {
    if (!file.endsWith('.md')) continue;
    const content = fs.readFileSync(path.join(activeDir, file), 'utf-8');
    check(content.trim().length > 0, `docs/exec-plans/active/${file}: file is empty`);
    check(
      /^## /m.test(content),
      `docs/exec-plans/active/${file}: must have at least one H2 (##) heading`
    );
  }
}

// 3. docs/product-specs/ filenames must match YYYY-MM-DD-*.md (index.md exempt)
const specsDir = path.join(ROOT, 'docs', 'product-specs');
if (fs.existsSync(specsDir)) {
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}-.+\.md$/;
  for (const file of fs.readdirSync(specsDir)) {
    if (!file.endsWith('.md') || file === 'index.md') continue;
    check(
      DATE_PATTERN.test(file),
      `docs/product-specs/${file}: filename must match YYYY-MM-DD-*.md pattern`
    );
  }
}

// 4. docs/generated/ files must start with AUTO-GENERATED comment
const generatedDir = path.join(ROOT, 'docs', 'generated');
if (fs.existsSync(generatedDir)) {
  for (const file of fs.readdirSync(generatedDir)) {
    if (!file.endsWith('.md')) continue;
    const content = fs.readFileSync(path.join(generatedDir, file), 'utf-8');
    check(
      content.startsWith('<!-- AUTO-GENERATED: do not edit -->'),
      `docs/generated/${file}: must start with "<!-- AUTO-GENERATED: do not edit -->"`
    );
  }
}

if (errors.length > 0) {
  console.error(`lint-structure: ${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
} else {
  console.log('lint-structure: ✓ All checks passed');
}
