#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const AGENTS_MD = path.join(ROOT, 'AGENTS.md');
const ARCHITECTURE_MD = path.join(ROOT, 'ARCHITECTURE.md');
const DOCS_DIR = path.join(ROOT, 'docs');

const ORPHAN_EXEMPT_PREFIXES = [
  'docs/exec-plans/active',
  'docs/exec-plans/completed',
  'docs/generated',
  'docs/superpowers',
];

const LINT_EXEMPT_PREFIXES = [
  'docs/generated',
  'docs/references',
  'docs/exec-plans',
  'docs/superpowers',
];

const MAX_LINES = 200;
const errors: string[] = [];

function check(condition: boolean, message: string): void {
  if (!condition) errors.push(message);
}

function readFile(p: string): string {
  return fs.readFileSync(p, 'utf-8');
}

function extractInternalLinks(content: string): string[] {
  const re = /\[.*?\]\(([^)]+)\)/g;
  const links: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const href = m[1];
    if (!href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
      links.push(href.split('#')[0].replace(/\/$/, ''));
    }
  }
  return links;
}

function getAllMdFiles(dir: string): string[] {
  const files: string[] = [];
  function walk(current: string) {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const rel = path.relative(ROOT, full).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        if (rel.startsWith('docs/references')) continue;
        walk(full);
      } else if (entry.name.endsWith('.md')) {
        files.push(full);
      }
    }
  }
  walk(dir);
  return files;
}

if (!fs.existsSync(AGENTS_MD)) {
  console.error('lint-agents-md: AGENTS.md not found');
  process.exit(1);
}
if (!fs.existsSync(ARCHITECTURE_MD)) {
  console.error('lint-agents-md: ARCHITECTURE.md not found');
  process.exit(1);
}

const agentsMd = readFile(AGENTS_MD);
const archMd = readFile(ARCHITECTURE_MD);
const combinedIndex = agentsMd + '\n' + archMd;

for (const [label, content] of [['AGENTS.md', agentsMd], ['ARCHITECTURE.md', archMd]] as const) {
  for (const link of extractInternalLinks(content)) {
    const resolved = path.resolve(ROOT, link);
    check(fs.existsSync(resolved), `Broken link in ${label}: "${link}" does not exist`);
  }
}

const allMdFiles = getAllMdFiles(DOCS_DIR);
for (const mdFile of allMdFiles) {
  const rel = path.relative(ROOT, mdFile).replace(/\\/g, '/');
  const isExempt = ORPHAN_EXEMPT_PREFIXES.some((prefix) => rel.startsWith(prefix));
  if (isExempt) continue;
  check(
    combinedIndex.includes(rel),
    `Orphan detected: "${rel}" is not linked from AGENTS.md or ARCHITECTURE.md`
  );
}

for (const mdFile of allMdFiles) {
  const rel = path.relative(ROOT, mdFile).replace(/\\/g, '/');
  const isExempt = LINT_EXEMPT_PREFIXES.some((prefix) => rel.startsWith(prefix));
  if (isExempt) continue;

  const content = readFile(mdFile);
  const lines = content.split('\n');

  check(
    lines.length <= MAX_LINES,
    `${rel}: exceeds ${MAX_LINES} lines (${lines.length} lines). Split or move detail to design-docs/.`
  );
  check(
    lines[0]?.startsWith('# '),
    `${rel}: must start with a level-1 heading (# Title). Found: "${lines[0]}"`
  );
}

if (errors.length > 0) {
  console.error(`lint-agents-md: ${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
} else {
  console.log(`lint-agents-md: ✓ All checks passed (${allMdFiles.length} docs scanned)`);
}
