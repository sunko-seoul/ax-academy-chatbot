# Development Harness Bootstrap — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the development harness that enables agent-driven, TDD-based implementation of the ax-academy-chatbot, following the OpenAI Codex team's agent-first repository pattern.

**Architecture:** Sequential 15-step bootstrap: Next.js init → deps → config → .env → Supabase migration → custom lint tools (TDD) → ESLint custom rules (TDD) → contract test skeleton → docs seed → ARCHITECTURE.md → AGENTS.md + symlink → lint verification → npm scripts + CI → spec migration → CI symlink guard.

**Tech Stack:** Next.js 15 (App Router), TypeScript 5, Tailwind CSS 3, Vitest, ESLint v9 (flat config + inline plugin), markdownlint-cli2, lychee, tsx, Supabase CLI, GitHub Actions

---

## File Map

Files created or modified in this plan:

| File | Action | Task |
|------|--------|------|
| `package.json` | Init + modify scripts | 1, 14 |
| `tsconfig.json` | Init (verify path alias `@/*`) | 1, 3 |
| `vitest.config.ts` | Create | 3 |
| `.markdownlint-cli2.jsonc` | Create | 3 |
| `.env.example` | Create | 4 |
| `.gitignore` | Modify (add `.env.local`) | 4 |
| `supabase/migrations/0001_initial_schema.sql` | Create | 5 |
| `supabase/seed.sql` | Create (empty) | 5 |
| `tools/lint-agents-md.ts` | Create (TDD) | 6 |
| `tools/lint-structure.ts` | Create (TDD) | 7 |
| `tools/update-generated.ts` | Create (stub) | 7 |
| `tools/__tests__/lint-agents-md.test.ts` | Create (TDD) | 6 |
| `tools/__tests__/lint-structure.test.ts` | Create (TDD) | 7 |
| `eslint-plugin-local/index.js` | Create | 8 |
| `eslint-plugin-local/rules/no-secret-in-client.js` | Create (TDD) | 8 |
| `eslint-plugin-local/rules/domain-boundary.js` | Create (TDD) | 8 |
| `eslint-plugin-local/rules/layer-direction.js` | Create (TDD) | 8 |
| `eslint-plugin-local/rules/no-direct-db-in-ui.js` | Create (TDD) | 8 |
| `eslint-plugin-local/__tests__/rules.test.ts` | Create (TDD) | 8 |
| `eslint.config.mjs` | Modify (add custom plugin) | 8 |
| `src/domains/chat/runtime/tools/__tests__/contracts.test.ts` | Create | 9 |
| `docs/DESIGN.md` | Create (seed) | 10 |
| `docs/FRONTEND.md` | Create (seed) | 10 |
| `docs/PRODUCT_SENSE.md` | Create (seed) | 10 |
| `docs/QUALITY_SCORE.md` | Create (seed) | 10 |
| `docs/RELIABILITY.md` | Create (seed) | 10 |
| `docs/SECURITY.md` | Create (seed) | 10 |
| `docs/design-docs/core-beliefs.md` | Create (seed) | 10 |
| `docs/design-docs/index.md` | Create (seed) | 10 |
| `docs/exec-plans/index.md` | Create (seed) | 10 |
| `docs/exec-plans/tech-debt-tracker.md` | Create (seed) | 10 |
| `docs/product-specs/index.md` | Create (seed) | 10 |
| `docs/generated/db-schema.md` | Create (stub) | 10 |
| `docs/generated/api-routes.md` | Create (stub) | 10 |
| `docs/references/claude-agent-sdk-llms.txt` | Create (placeholder) | 10 |
| `docs/references/supabase-llms.txt` | Create (placeholder) | 10 |
| `docs/references/nextjs-app-router-llms.txt` | Create (placeholder) | 10 |
| `docs/references/pgvector-llms.txt` | Create (placeholder) | 10 |
| `README.md` | Create | 11 |
| `ARCHITECTURE.md` | Create | 11 |
| `AGENTS.md` | Create | 12 |
| `CLAUDE.md` | Create (symlink → AGENTS.md) | 12 |
| `.github/workflows/verify.yml` | Create | 14 |
| `docs/product-specs/2026-05-25-internal-chatbot-design.md` | Move from `docs/superpowers/specs/` | 15 |
| `docs/product-specs/2026-05-25-development-harness-design.md` | Move from `docs/superpowers/specs/` | 15 |
| `docs/exec-plans/active/2026-05-25-harness-bootstrap-plan.md` | Move from `docs/superpowers/plans/` | 15 |

---

## Task 1: Next.js Project Initialization

**Files:**
- Init: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/`, `tailwind.config.ts`, `.eslintrc` (will be replaced in Task 8)

- [ ] **Step 1: Initialize Next.js project**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git \
  --yes
```

When prompted about existing directory, answer `y` to proceed. The command will NOT touch the existing `docs/` directory.

- [ ] **Step 2: Verify the build works**

```bash
npm run build
```

Expected: `✓ Compiled successfully` (or similar). No type errors.

- [ ] **Step 3: Verify tsconfig path alias**

Check `tsconfig.json` contains:
```json
"paths": { "@/*": ["./src/*"] }
```
If not present, add it manually to `compilerOptions`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: initialize Next.js 15 App Router project"
```

---

## Task 2: Install Dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install dev dependencies**

```bash
npm install -D vitest @vitest/coverage-v8 tsx markdownlint-cli2
```

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install zod @anthropic-ai/agent-sdk @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 3: Verify key packages are accessible**

```bash
npx vitest --version
npx tsx --version
npx markdownlint-cli2 --version
```

Expected: version numbers printed for all three.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add vitest, tsx, markdownlint-cli2, supabase, zod, agent-sdk"
```

---

## Task 3: Config Files (vitest + markdownlint)

**Files:**
- Create: `vitest.config.ts`, `.markdownlint-cli2.jsonc`
- Verify: `tsconfig.json`

- [ ] **Step 1: Create `vitest.config.ts`**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 2: Create `.markdownlint-cli2.jsonc`**

```jsonc
// .markdownlint-cli2.jsonc
{
  "config": {
    "MD013": { "line_length": 120 },
    "MD033": false,
    "MD041": true,
    "MD047": true
  },
  "globs": ["**/*.md"],
  "ignores": [
    "**/node_modules/**",
    "docs/references/**",
    ".claude/**",
    ".next/**"
  ]
}
```

- [ ] **Step 3: Verify vitest runs**

```bash
npx vitest run --reporter=verbose
```

Expected: `No test files found` (0 tests pass — that's fine, no tests yet).

- [ ] **Step 4: Verify tsc passes**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts .markdownlint-cli2.jsonc
git commit -m "chore: add vitest and markdownlint config"
```

---

## Task 4: .env.example + .gitignore

**Files:**
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create `.env.example`**

```bash
# Anthropic
ANTHROPIC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # (구: ANON_KEY)
SUPABASE_SECRET_KEY=                    # (구: SERVICE_ROLE_KEY)

# External integrations
SLACK_BOT_TOKEN=
NOTION_API_KEY=
```

- [ ] **Step 2: Ensure `.env.local` is git-ignored**

Open `.gitignore` and verify `.env.local` is listed. If not, add it:
```
.env.local
.env*.local
```

- [ ] **Step 3: Verify `.env.local` is not tracked**

```bash
echo "TEST=1" > .env.local
git status
```

Expected: `.env.local` does NOT appear in git status (it's ignored).
Then delete: `rm .env.local`

- [ ] **Step 4: Commit**

```bash
git add .env.example .gitignore
git commit -m "chore: add .env.example with all required variables"
```

---

## Task 5: Supabase Migration

**Files:**
- Create: `supabase/config.toml` (from supabase init), `supabase/migrations/0001_initial_schema.sql`, `supabase/seed.sql`

- [ ] **Step 1: Initialize Supabase**

```bash
supabase init
```

Expected: `supabase/` directory created with `config.toml` and `seed.sql`.

If `supabase` CLI is not installed: `brew install supabase/tap/supabase`

- [ ] **Step 2: Create migration file**

Create `supabase/migrations/0001_initial_schema.sql`:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 대화 목록
CREATE TABLE conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,              -- 첫 메시지 기반 자동 생성
  created_at  timestamptz DEFAULT now()
);

-- 메시지 (대화 히스토리)
CREATE TABLE messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role             text NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content          text,                  -- tool 메시지는 null 가능
  tool_calls       jsonb,                 -- 에이전트 tool call 로그
  created_at       timestamptz DEFAULT now()  -- 대화 순서 정렬 기준
);

-- 사내 knowledge base 문서
CREATE TABLE documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  content     text NOT NULL,             -- 원본 텍스트 청크
  embedding   vector(1536),              -- pgvector 임베딩
  metadata    jsonb DEFAULT '{}',        -- 카테고리, 작성자, 버전 등
  created_by  uuid REFERENCES auth.users(id),
  updated_at  timestamptz DEFAULT now()
);

-- 사용자 프로필 (관리자 권한)
CREATE TABLE profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin  boolean NOT NULL DEFAULT false
);

-- RLS 정책
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can only see own conversations"
  ON conversations FOR ALL USING (user_id = auth.uid());

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can only see own messages"
  ON messages FOR ALL
  USING (conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  ));

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all authenticated users can read documents"
  ON documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "only admins can write documents"
  ON documents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));
```

- [ ] **Step 3: Create empty seed file**

If `supabase/seed.sql` was not created by `supabase init`, create it empty:
```bash
touch supabase/seed.sql
```

- [ ] **Step 4: Verify migration applies locally (optional — requires Docker)**

```bash
supabase start
supabase db reset
```

Expected: `Local Supabase is running.` and schema applied.
If Docker is not available, skip this step and note it in a comment.

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "chore: add Supabase init + initial schema migration with RLS"
```

---

## Task 6: lint-agents-md.ts — TDD

**Files:**
- Create: `tools/__tests__/lint-agents-md.test.ts` (test first)
- Create: `tools/lint-agents-md.ts` (implementation)

- [ ] **Step 1: Write the failing test**

Create `tools/__tests__/lint-agents-md.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const SCRIPT = path.resolve('tools/lint-agents-md.ts');

function createFixture(structure: Record<string, string>): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-agents-'));
  for (const [rel, content] of Object.entries(structure)) {
    const full = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return tmpDir;
}

function run(cwd: string): { exitCode: number; output: string } {
  try {
    const output = execSync(`npx tsx ${SCRIPT}`, { cwd, encoding: 'utf-8', stdio: 'pipe' });
    return { exitCode: 0, output };
  } catch (err: any) {
    return { exitCode: err.status ?? 1, output: (err.stderr ?? '') + (err.stdout ?? '') };
  }
}

describe('lint-agents-md', () => {
  it('passes on minimal valid structure', () => {
    const dir = createFixture({
      'AGENTS.md': '# AGENTS\n\n[Design](docs/DESIGN.md)\n',
      'ARCHITECTURE.md': '# ARCHITECTURE\n',
      'docs/DESIGN.md': '# Design\n\nContent here.\n',
    });
    expect(run(dir).exitCode).toBe(0);
    fs.rmSync(dir, { recursive: true });
  });

  it('fails when AGENTS.md has a broken link', () => {
    const dir = createFixture({
      'AGENTS.md': '# AGENTS\n\n[Missing](docs/nonexistent.md)\n',
      'ARCHITECTURE.md': '# ARCHITECTURE\n',
    });
    const { exitCode, output } = run(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain('nonexistent.md');
    fs.rmSync(dir, { recursive: true });
  });

  it('fails when a docs/ file is orphaned (not linked from AGENTS.md or ARCHITECTURE.md)', () => {
    const dir = createFixture({
      'AGENTS.md': '# AGENTS\n',
      'ARCHITECTURE.md': '# ARCHITECTURE\n',
      'docs/ORPHAN.md': '# Orphan\n\nSome content here.\n',
    });
    const { exitCode, output } = run(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain('ORPHAN.md');
    fs.rmSync(dir, { recursive: true });
  });

  it('does NOT flag orphans inside docs/exec-plans/active/', () => {
    const dir = createFixture({
      'AGENTS.md': '# AGENTS\n\n[Plans](docs/exec-plans/active/)\n',
      'ARCHITECTURE.md': '# ARCHITECTURE\n',
      'docs/exec-plans/active/2026-05-25-plan.md': '# Plan\n\n## Task 1\n\nDo something.\n',
    });
    expect(run(dir).exitCode).toBe(0);
    fs.rmSync(dir, { recursive: true });
  });

  it('does NOT flag orphans inside docs/exec-plans/completed/', () => {
    const dir = createFixture({
      'AGENTS.md': '# AGENTS\n\n[Completed](docs/exec-plans/completed/)\n',
      'ARCHITECTURE.md': '# ARCHITECTURE\n',
      'docs/exec-plans/completed/2026-01-01-old-plan.md': '# Done Plan\n\n## Task 1\n\nContent.\n',
    });
    expect(run(dir).exitCode).toBe(0);
    fs.rmSync(dir, { recursive: true });
  });

  it('fails when a docs/ file exceeds 200 lines', () => {
    const longContent = '# Long Doc\n\n' + 'some text here\n'.repeat(200);
    const dir = createFixture({
      'AGENTS.md': '# AGENTS\n\n[Long](docs/LONG.md)\n',
      'ARCHITECTURE.md': '# ARCHITECTURE\n',
      'docs/LONG.md': longContent,
    });
    const { exitCode, output } = run(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain('200');
    fs.rmSync(dir, { recursive: true });
  });

  it('does NOT enforce line limit on docs/generated/ files', () => {
    const longContent = '<!-- AUTO-GENERATED: do not edit -->\n# Schema\n\n' + 'line\n'.repeat(500);
    const dir = createFixture({
      'AGENTS.md': '# AGENTS\n\n[Generated](docs/generated/)\n',
      'ARCHITECTURE.md': '# ARCHITECTURE\n',
      'docs/generated/db-schema.md': longContent,
    });
    expect(run(dir).exitCode).toBe(0);
    fs.rmSync(dir, { recursive: true });
  });

  it('fails when a docs/ file does not start with a # heading', () => {
    const dir = createFixture({
      'AGENTS.md': '# AGENTS\n\n[Bad](docs/BAD.md)\n',
      'ARCHITECTURE.md': '# ARCHITECTURE\n',
      'docs/BAD.md': 'No heading here\n\nContent.\n',
    });
    const { exitCode, output } = run(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain('heading');
    fs.rmSync(dir, { recursive: true });
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run tools/__tests__/lint-agents-md.test.ts --reporter=verbose
```

Expected: FAIL — `tools/lint-agents-md.ts` does not exist yet.

- [ ] **Step 3: Implement `tools/lint-agents-md.ts`**

Create `tools/lint-agents-md.ts`:

```typescript
#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const AGENTS_MD = path.join(ROOT, 'AGENTS.md');
const ARCHITECTURE_MD = path.join(ROOT, 'ARCHITECTURE.md');
const DOCS_DIR = path.join(ROOT, 'docs');

// Directories where individual files don't need to be linked (directory-level reference is enough)
const ORPHAN_EXEMPT_PREFIXES = [
  'docs/exec-plans/active',
  'docs/exec-plans/completed',
  'docs/generated',
];

// Directories exempt from the 200-line limit and heading format checks
const LINT_EXEMPT_PREFIXES = [
  'docs/generated',
  'docs/references',
  'docs/exec-plans',
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
      // Strip trailing slashes and anchors
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
        if (rel.startsWith('docs/references')) continue; // only .txt files there
        walk(full);
      } else if (entry.name.endsWith('.md')) {
        files.push(full);
      }
    }
  }
  walk(dir);
  return files;
}

// Guard: both root files must exist
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

// 1. Verify all links in AGENTS.md and ARCHITECTURE.md resolve to real paths
for (const [label, content] of [['AGENTS.md', agentsMd], ['ARCHITECTURE.md', archMd]] as const) {
  for (const link of extractInternalLinks(content)) {
    const resolved = path.resolve(ROOT, link);
    check(fs.existsSync(resolved), `Broken link in ${label}: "${link}" does not exist`);
  }
}

// 2. Verify no orphan .md files in docs/
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

// 3. Verify line limit (≤ 200) and heading format for non-exempt docs
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
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run tools/__tests__/lint-agents-md.test.ts --reporter=verbose
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/lint-agents-md.ts tools/__tests__/lint-agents-md.test.ts
git commit -m "feat: add lint-agents-md.ts with TDD (orphan detection, link check, line limit)"
```

---

## Task 7: lint-structure.ts + update-generated.ts — TDD

**Files:**
- Create: `tools/__tests__/lint-structure.test.ts` (test first)
- Create: `tools/lint-structure.ts`
- Create: `tools/update-generated.ts` (stub)

- [ ] **Step 1: Write the failing test**

Create `tools/__tests__/lint-structure.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const SCRIPT = path.resolve('tools/lint-structure.ts');

function createFixture(structure: Record<string, string>): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-struct-'));
  for (const [rel, content] of Object.entries(structure)) {
    const full = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return tmpDir;
}

function run(cwd: string): { exitCode: number; output: string } {
  try {
    const output = execSync(`npx tsx ${SCRIPT}`, { cwd, encoding: 'utf-8', stdio: 'pipe' });
    return { exitCode: 0, output };
  } catch (err: any) {
    return { exitCode: err.status ?? 1, output: (err.stderr ?? '') + (err.stdout ?? '') };
  }
}

describe('lint-structure', () => {
  it('passes on a clean structure', () => {
    const dir = createFixture({
      'docs/exec-plans/active/2026-05-25-my-plan.md': '# My Plan\n\n## Task 1\n\nDo something.\n',
      'docs/product-specs/2026-05-25-spec.md': '# Spec\n\nContent.\n',
      'docs/generated/db-schema.md': '<!-- AUTO-GENERATED: do not edit -->\n# DB Schema\n',
    });
    expect(run(dir).exitCode).toBe(0);
    fs.rmSync(dir, { recursive: true });
  });

  it('fails when docs/superpowers/ exists', () => {
    const dir = createFixture({
      'docs/superpowers/specs/some-spec.md': '# Spec\n',
    });
    const { exitCode, output } = run(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain('docs/superpowers/');
    fs.rmSync(dir, { recursive: true });
  });

  it('fails when docs/exec-plans/active/ file has no H2 heading', () => {
    const dir = createFixture({
      'docs/exec-plans/active/2026-05-25-plan.md': '# Plan\n\nNo h2 here.\n',
    });
    const { exitCode, output } = run(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain('H2');
    fs.rmSync(dir, { recursive: true });
  });

  it('fails when product-spec filename does not match YYYY-MM-DD-*.md', () => {
    const dir = createFixture({
      'docs/product-specs/my-spec.md': '# Spec\n\nContent.\n',
    });
    const { exitCode, output } = run(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain('YYYY-MM-DD');
    fs.rmSync(dir, { recursive: true });
  });

  it('allows index.md inside product-specs/ without date prefix', () => {
    const dir = createFixture({
      'docs/product-specs/index.md': '# Product Specs Index\n\nContent.\n',
    });
    expect(run(dir).exitCode).toBe(0);
    fs.rmSync(dir, { recursive: true });
  });

  it('fails when docs/generated/ file lacks AUTO-GENERATED header', () => {
    const dir = createFixture({
      'docs/generated/api-routes.md': '# API Routes\n\nContent.\n',
    });
    const { exitCode, output } = run(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain('AUTO-GENERATED');
    fs.rmSync(dir, { recursive: true });
  });
});
```

- [ ] **Step 2: Run test — verify FAIL**

```bash
npx vitest run tools/__tests__/lint-structure.test.ts --reporter=verbose
```

Expected: FAIL — `tools/lint-structure.ts` does not exist yet.

- [ ] **Step 3: Implement `tools/lint-structure.ts`**

Create `tools/lint-structure.ts`:

```typescript
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

// 2. docs/exec-plans/active/ files must be non-empty and have at least one H2 heading
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

// 3. docs/product-specs/ filenames must match YYYY-MM-DD-*.md (index.md is exempt)
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
```

- [ ] **Step 4: Create `tools/update-generated.ts` stub**

Create `tools/update-generated.ts`:

```typescript
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

// v1 stubs — replace with live generation in v2
writeGenerated('db-schema.md', '# DB Schema\n\n> Run `supabase db dump --schema public` to update.\n');
writeGenerated('api-routes.md', '# API Routes\n\n> Run `tsx tools/update-generated.ts` after adding routes.\n');

console.log('update-generated: ✓ Done');
```

- [ ] **Step 5: Run tests — verify PASS**

```bash
npx vitest run tools/__tests__/lint-structure.test.ts --reporter=verbose
```

Expected: All 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add tools/lint-structure.ts tools/update-generated.ts tools/__tests__/lint-structure.test.ts
git commit -m "feat: add lint-structure.ts and update-generated.ts stub with TDD"
```

---

## Task 8: ESLint Custom Rules — TDD

**Files:**
- Create: `eslint-plugin-local/__tests__/rules.test.ts` (test first)
- Create: `eslint-plugin-local/rules/no-secret-in-client.js`
- Create: `eslint-plugin-local/rules/domain-boundary.js`
- Create: `eslint-plugin-local/rules/layer-direction.js`
- Create: `eslint-plugin-local/rules/no-direct-db-in-ui.js`
- Create: `eslint-plugin-local/index.js`
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Write the failing tests**

Create `eslint-plugin-local/__tests__/rules.test.ts`:

```typescript
import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import noSecretInClient from '../rules/no-secret-in-client.js';
import domainBoundary from '../rules/domain-boundary.js';
import layerDirection from '../rules/layer-direction.js';
import noDirectDbInUi from '../rules/no-direct-db-in-ui.js';

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

// RuleTester throws on failure — vitest catches it as a test failure

describe('no-secret-in-client', () => {
  it('allows secrets in server-only paths', () => {
    tester.run('no-secret-in-client', noSecretInClient as any, {
      valid: [
        {
          code: 'const k = process.env.SUPABASE_SERVICE_ROLE_KEY;',
          filename: '/proj/app/api/chat/route.ts',
        },
        {
          code: 'const k = process.env.SUPABASE_SERVICE_ROLE_KEY;',
          filename: '/proj/src/providers/auth.ts',
        },
        {
          code: 'const k = process.env.SUPABASE_SERVICE_ROLE_KEY;',
          filename: '/proj/src/domains/chat/repo.ts',
        },
        {
          code: 'const k = process.env.SUPABASE_SERVICE_ROLE_KEY;',
          filename: '/proj/src/domains/chat/runtime/agent.ts',
        },
        {
          // NEXT_PUBLIC_ vars are fine anywhere
          code: 'const u = process.env.NEXT_PUBLIC_SUPABASE_URL;',
          filename: '/proj/src/app/page.tsx',
        },
      ],
      invalid: [
        {
          code: 'const k = process.env.SUPABASE_SERVICE_ROLE_KEY;',
          filename: '/proj/src/app/page.tsx',
          errors: [{ messageId: 'noSecretInClient' }],
        },
        {
          code: 'const k = process.env.ANTHROPIC_API_KEY;',
          filename: '/proj/src/lib/helper.ts',
          errors: [{ messageId: 'noSecretInClient' }],
        },
        {
          code: 'const k = process.env.SLACK_BOT_TOKEN;',
          filename: '/proj/src/domains/chat/service.ts',
          errors: [{ messageId: 'noSecretInClient' }],
        },
      ],
    });
  });
});

describe('domain-boundary', () => {
  it('blocks cross-domain direct imports', () => {
    tester.run('domain-boundary', domainBoundary as any, {
      valid: [
        {
          // same domain import
          code: "import type { Message } from '@/domains/chat/types';",
          filename: '/proj/src/domains/chat/service.ts',
        },
        {
          // providers are always allowed
          code: "import { getUser } from '@/providers/auth';",
          filename: '/proj/src/domains/chat/service.ts',
        },
      ],
      invalid: [
        {
          code: "import { adminRepo } from '@/domains/admin/repo';",
          filename: '/proj/src/domains/chat/service.ts',
          errors: [{ messageId: 'crossDomain' }],
        },
        {
          code: "import { kbService } from '@/domains/knowledge-base/service';",
          filename: '/proj/src/domains/chat/runtime/agent.ts',
          errors: [{ messageId: 'crossDomain' }],
        },
      ],
    });
  });
});

describe('layer-direction', () => {
  it('blocks reverse-direction layer imports within a domain', () => {
    tester.run('layer-direction', layerDirection as any, {
      valid: [
        {
          // repo can import config (left → right)
          code: "import { dbConfig } from './config';",
          filename: '/proj/src/domains/chat/repo.ts',
        },
        {
          // service can import repo
          code: "import { findMessages } from './repo';",
          filename: '/proj/src/domains/chat/service.ts',
        },
      ],
      invalid: [
        {
          // repo cannot import service (right → left violation)
          code: "import { chatService } from './service';",
          filename: '/proj/src/domains/chat/repo.ts',
          errors: [{ messageId: 'layerViolation' }],
        },
        {
          // config cannot import repo
          code: "import { messagesRepo } from './repo';",
          filename: '/proj/src/domains/chat/config.ts',
          errors: [{ messageId: 'layerViolation' }],
        },
      ],
    });
  });
});

describe('no-direct-db-in-ui', () => {
  it('blocks Supabase client imports in app/ UI files', () => {
    tester.run('no-direct-db-in-ui', noDirectDbInUi as any, {
      valid: [
        {
          // providers can use supabase
          code: "import { createClient } from '@supabase/supabase-js';",
          filename: '/proj/src/providers/db.ts',
        },
        {
          // api routes can use supabase
          code: "import { createClient } from '@supabase/ssr';",
          filename: '/proj/src/app/api/chat/route.ts',
        },
      ],
      invalid: [
        {
          code: "import { createClient } from '@supabase/supabase-js';",
          filename: '/proj/src/app/chat/page.tsx',
          errors: [{ messageId: 'noDirectDb' }],
        },
        {
          code: "import { createServerClient } from '@supabase/ssr';",
          filename: '/proj/src/app/components/ChatInput.tsx',
          errors: [{ messageId: 'noDirectDb' }],
        },
      ],
    });
  });
});
```

- [ ] **Step 2: Run tests — verify FAIL**

```bash
npx vitest run eslint-plugin-local/__tests__/rules.test.ts --reporter=verbose
```

Expected: FAIL — rule files don't exist yet.

- [ ] **Step 3: Implement `eslint-plugin-local/rules/no-secret-in-client.js`**

```javascript
// eslint-plugin-local/rules/no-secret-in-client.js
'use strict';

const SECRETS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SLACK_BOT_TOKEN',
  'NOTION_API_KEY',
  'ANTHROPIC_API_KEY',
];

const ALLOWED_PATTERNS = [
  /[/\\]app[/\\]api[/\\]/,
  /[/\\]src[/\\]providers[/\\]/,
  /[/\\]src[/\\]domains[/\\][^/\\]+[/\\]repo\.(ts|js)$/,
  /[/\\]src[/\\]domains[/\\][^/\\]+[/\\]runtime[/\\]/,
];

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow secret env vars outside server-only paths' },
    messages: {
      noSecretInClient:
        'Secret {{secret}} cannot be used outside allowed paths. ' +
        'Allowed: app/api/**, src/providers/**, src/domains/*/repo.ts, src/domains/*/runtime/**. ' +
        'See docs/SECURITY.md.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, '/');
    const isAllowed = ALLOWED_PATTERNS.some((p) => p.test(filename));
    if (isAllowed) return {};

    function reportIfSecret(node, name) {
      if (SECRETS.includes(name)) {
        context.report({ node, messageId: 'noSecretInClient', data: { secret: name } });
      }
    }

    return {
      MemberExpression(node) {
        // process.env.SECRET_NAME
        if (
          node.object.type === 'MemberExpression' &&
          node.object.object.type === 'Identifier' &&
          node.object.object.name === 'process' &&
          node.object.property.type === 'Identifier' &&
          node.object.property.name === 'env' &&
          node.property.type === 'Identifier'
        ) {
          reportIfSecret(node, node.property.name);
        }
        // process.env['SECRET_NAME']
        if (
          node.computed &&
          node.object.type === 'MemberExpression' &&
          node.object.object.type === 'Identifier' &&
          node.object.object.name === 'process' &&
          node.object.property.type === 'Identifier' &&
          node.object.property.name === 'env' &&
          node.property.type === 'Literal' &&
          typeof node.property.value === 'string'
        ) {
          reportIfSecret(node, node.property.value);
        }
      },
    };
  },
};
```

- [ ] **Step 4: Implement `eslint-plugin-local/rules/domain-boundary.js`**

```javascript
// eslint-plugin-local/rules/domain-boundary.js
'use strict';

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow cross-domain imports between src/domains/*' },
    messages: {
      crossDomain:
        'Cross-domain import detected. Use providers or duplicate logic. See ARCHITECTURE.md.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, '/');
    const domainMatch = filename.match(/src\/domains\/([^/]+)\//);
    if (!domainMatch) return {};
    const currentDomain = domainMatch[1];

    return {
      ImportDeclaration(node) {
        const src = node.source.value;
        // Match @/domains/X or src/domains/X or ../domains/X style
        const m = src.match(/(?:@\/|src\/)domains\/([^/]+)/);
        if (!m) return;
        const importedDomain = m[1];
        if (importedDomain !== currentDomain) {
          context.report({ node, messageId: 'crossDomain' });
        }
      },
    };
  },
};
```

- [ ] **Step 5: Implement `eslint-plugin-local/rules/layer-direction.js`**

```javascript
// eslint-plugin-local/rules/layer-direction.js
'use strict';

// Left-to-right order: lower index = closer to data, higher = closer to user
const LAYER_ORDER = ['types', 'config', 'repo', 'service', 'runtime', 'ui'];

function detectLayer(filepath) {
  // Check filename without extension
  const basename = filepath.split(/[/\\]/).pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') ?? '';
  if (LAYER_ORDER.includes(basename)) return basename;
  // Check directory segments
  if (/[/\\]runtime([/\\]|$)/.test(filepath)) return 'runtime';
  if (/\.(tsx)$/.test(filepath)) return 'ui';
  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Enforce left-to-right layer import direction within a domain' },
    messages: {
      layerViolation:
        'Layer violation: {{from}} cannot import {{to}}. ' +
        'Import direction must be types→config→repo→service→runtime→ui. See ARCHITECTURE.md.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, '/');
    const currentLayer = detectLayer(filename);
    if (!currentLayer) return {};
    const currentIdx = LAYER_ORDER.indexOf(currentLayer);

    return {
      ImportDeclaration(node) {
        const importedLayer = detectLayer(node.source.value);
        if (!importedLayer) return;
        const importedIdx = LAYER_ORDER.indexOf(importedLayer);
        if (importedIdx > currentIdx) {
          context.report({
            node,
            messageId: 'layerViolation',
            data: { from: currentLayer, to: importedLayer },
          });
        }
      },
    };
  },
};
```

- [ ] **Step 6: Implement `eslint-plugin-local/rules/no-direct-db-in-ui.js`**

```javascript
// eslint-plugin-local/rules/no-direct-db-in-ui.js
'use strict';

const DB_PACKAGES = ['@supabase/supabase-js', '@supabase/ssr'];

// UI files: anything under src/app/ or app/ EXCEPT api routes
const UI_PATTERN = /[/\\](src[/\\])?app[/\\]/;
const API_EXCEPTION = /[/\\]api[/\\]/;

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow direct Supabase DB imports in UI (app/) files' },
    messages: {
      noDirectDb:
        'UI must call API routes, not the DB directly. ' +
        'Move DB access to src/providers/ or src/domains/*/repo.ts. See ARCHITECTURE.md.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, '/');
    if (!UI_PATTERN.test(filename)) return {};
    if (API_EXCEPTION.test(filename)) return {}; // api routes are allowed

    return {
      ImportDeclaration(node) {
        if (DB_PACKAGES.includes(node.source.value)) {
          context.report({ node, messageId: 'noDirectDb' });
        }
      },
    };
  },
};
```

- [ ] **Step 7: Create `eslint-plugin-local/index.js`**

```javascript
// eslint-plugin-local/index.js
'use strict';

module.exports = {
  rules: {
    'no-secret-in-client': require('./rules/no-secret-in-client'),
    'domain-boundary': require('./rules/domain-boundary'),
    'layer-direction': require('./rules/layer-direction'),
    'no-direct-db-in-ui': require('./rules/no-direct-db-in-ui'),
  },
};
```

- [ ] **Step 8: Run tests — verify PASS**

```bash
npx vitest run eslint-plugin-local/__tests__/rules.test.ts --reporter=verbose
```

Expected: All 4 rule test suites PASS (14 valid + 9 invalid cases).

- [ ] **Step 9: Update `eslint.config.mjs` to include the custom plugin**

Open `eslint.config.mjs` (created by `create-next-app`) and add the local plugin. The file will already have `@eslint/eslintrc` or Next.js config. Modify it to:

```javascript
// eslint.config.mjs
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import localPlugin from './eslint-plugin-local/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const nextConfig = compat.extends('next/core-web-vitals', 'next/typescript');

export default [
  ...nextConfig,
  {
    plugins: { local: localPlugin },
    rules: {
      'local/no-secret-in-client': 'error',
      'local/domain-boundary': 'error',
      'local/layer-direction': 'error',
      'local/no-direct-db-in-ui': 'error',
    },
  },
  {
    // Lint tools themselves are allowed to use any pattern
    files: ['tools/**/*.ts', 'eslint-plugin-local/**/*.js'],
    rules: {
      'local/no-secret-in-client': 'off',
      'local/domain-boundary': 'off',
      'local/layer-direction': 'off',
      'local/no-direct-db-in-ui': 'off',
    },
  },
];
```

- [ ] **Step 10: Verify ESLint runs without errors on the current codebase**

```bash
npx eslint src/ --ext .ts,.tsx --max-warnings 0
```

Expected: 0 errors (src/ is mostly empty from create-next-app's boilerplate).

- [ ] **Step 11: Commit**

```bash
git add eslint-plugin-local/ eslint.config.mjs eslint-plugin-local/__tests__/rules.test.ts
git commit -m "feat: add 4 ESLint custom rules with TDD (no-secret-in-client, domain-boundary, layer-direction, no-direct-db-in-ui)"
```

---

## Task 9: Tool Contract Test Skeleton

**Files:**
- Create: `src/domains/chat/runtime/tools/__tests__/contracts.test.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p src/domains/chat/runtime/tools/__tests__
```

- [ ] **Step 2: Write `contracts.test.ts`**

Create `src/domains/chat/runtime/tools/__tests__/contracts.test.ts`:

```typescript
/**
 * Tool Contract Tests
 *
 * Enforces Golden Rule #5: "Tool failures must be graceful"
 * - All tool functions must return { error: string } on failure (never throw)
 * - All tool functions must complete within 5000ms
 *
 * New tools are automatically detected via fs.readdirSync — no boilerplate needed.
 * See docs/design-docs/core-beliefs.md
 */
import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

const TOOLS_DIR = path.resolve(__dirname, '..');
const TIMEOUT_MS = 5000;

// Auto-detect all tool implementation files (exclude test files)
const toolFiles = fs.existsSync(TOOLS_DIR)
  ? fs.readdirSync(TOOLS_DIR).filter(
      (f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'index.ts'
    )
  : [];

describe('Tool Contract: graceful failure on external API errors', () => {
  if (toolFiles.length === 0) {
    it('placeholder — tool files will auto-register when added to tools/ directory', () => {
      // This test exists so vitest does not report "no tests found"
      expect(true).toBe(true);
    });
  }

  for (const toolFile of toolFiles) {
    describe(`${toolFile}`, () => {
      it('returns { error: string } and completes within 5s on network failure', async () => {
        // Simulate network failure for all external calls
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

        const mod = await import(path.join(TOOLS_DIR, toolFile));

        // Find the first exported function (each tool file exports one named function)
        const fn = Object.values(mod).find((v): v is (...args: unknown[]) => unknown =>
          typeof v === 'function'
        );

        if (!fn) {
          vi.unstubAllGlobals();
          throw new Error(`No exported function found in ${toolFile}`);
        }

        const start = Date.now();
        const result = await fn({ query: 'test' });
        const elapsed = Date.now() - start;

        vi.unstubAllGlobals();

        expect(result, `${toolFile} should return { error: string } instead of throwing`).toMatchObject({
          error: expect.any(String),
        });
        expect(elapsed, `${toolFile} exceeded ${TIMEOUT_MS}ms timeout`).toBeLessThan(TIMEOUT_MS);
      });
    });
  }
});
```

- [ ] **Step 3: Run the test — verify 1 placeholder test passes**

```bash
npx vitest run src/domains/chat/runtime/tools/__tests__/contracts.test.ts --reporter=verbose
```

Expected: 1 PASS — "placeholder — tool files will auto-register when added to tools/ directory".

- [ ] **Step 4: Commit**

```bash
git add src/domains/chat/runtime/tools/__tests__/contracts.test.ts
git commit -m "feat: add tool contract test skeleton (auto-detects tools via glob)"
```

---

## Task 10: Docs Seed

**Files:**
- Create: all `docs/**` seed files

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p docs/{design-docs,exec-plans/{active,completed},product-specs,generated,references}
```

- [ ] **Step 2: Create `docs/DESIGN.md`**

```markdown
# Design

UI/UX 가이드라인 — shadcn/ui + 한국어 UX + 다크모드 정책.

## 컴포넌트 라이브러리

shadcn/ui를 기본으로 사용한다. 새 컴포넌트 추가 전 shadcn 목록을 먼저 확인하고,
없는 경우에만 직접 작성한다 (500 LOC 이하, Tailwind 클래스 기반).

## 한국어 UX 규약

- 사용자 노출 문자열은 모두 한국어
- 에러 메시지 포맷: `"[상황] [이유] [조치]"` — 예: "검색 결과가 없습니다. 다른 키워드로 시도해 보세요."
- Loading 상태: skeleton UI 우선, 스피너는 3초 이상 대기 시에만

## 다크모드 정책

v1: 시스템 설정을 따른다 (`prefers-color-scheme`). shadcn/ui의 CSS 변수 방식 사용.
사용자 토글은 v2에서 추가.

## 접근성

- 모든 인터랙티브 요소에 `aria-label` 필수
- 키보드 포커스 링 제거 금지
- 최소 명암비 WCAG AA (4.5:1)

## 관련 문서

→ `docs/FRONTEND.md` (React 패턴), `ARCHITECTURE.md` (레이어 구조)
```

- [ ] **Step 3: Create `docs/FRONTEND.md`**

```markdown
# Frontend

Next.js App Router 패턴 — Server Components 우선, RSC 경계, 상태관리.

## Server Components 우선 원칙

- 기본: Server Component (`async function Page()`)
- 클라이언트 필요 시만 `'use client'` 추가 — 이유를 주석으로 명시
- 데이터 패칭은 Server Component에서 직접. `useEffect` + fetch 패턴 금지

## RSC 경계 규칙

```
app/page.tsx (Server)
  └── components/ChatContainer.tsx ('use client' — 스트리밍 SSE 필요)
        └── components/MessageBubble.tsx (Server 가능 시 Server로)
```

## 상태 관리

- 서버 상태: React Server Components + SWR (필요 시)
- 클라이언트 전용 상태: `useState` / `useReducer` — 전역 상태 라이브러리는 도입 전 논의 필요
- URL 상태: `useSearchParams` / `useRouter`

## 스트리밍 패턴

`/api/chat` SSE → `ReadableStream` → `useEffect`에서 읽기.
`EventSource` 대신 `fetch` + `ReadableStreamDefaultReader` 사용 (POST body 전송 가능).

## 관련 문서

→ `docs/DESIGN.md` (UI 가이드라인), `ARCHITECTURE.md` (레이어 구조)
```

- [ ] **Step 4: Create `docs/PRODUCT_SENSE.md`**

```markdown
# Product Sense

사내 챗봇이 추구하는 가치와 의사결정 원칙.

## 핵심 가치 (우선순위 순)

1. **직원 시간 절약 최우선** — 1개의 질문에 5초 안에 답변 시작. 긴 검색 과정 대신
2. **모른다고 말하기를 두려워하지 않음** — 불확실할 때 "모르겠습니다"가 틀린 답보다 낫다
3. **출처 투명성** — 모든 답변에 출처(Slack permalink, Notion URL, 문서명) 첨부

## 하지 말아야 할 것

- 정보를 확신 없이 단정 짓기 ("~입니다" → "~인 것 같습니다 [출처 없음]"은 금지)
- 동일한 질문에 매번 다른 답변 (일관성 깨짐)
- 답변이 너무 길어 핵심을 묻어버리기

## 성공 지표 (v1)

- 질문 → 첫 토큰 출력까지 < 2초
- 검색 도구 호출 → 결과까지 < 5초 (tool timeout)
- 사용자가 "더 찾아봐야 함"이라고 느끼지 않는 답변 비율

## 관련 문서

→ `docs/design-docs/core-beliefs.md` (황금 원칙 10개)
```

- [ ] **Step 5: Create `docs/QUALITY_SCORE.md`**

```markdown
# Quality Score

도메인별 코드/문서 품질 현황. PR 머지 전 담당 도메인 등급을 확인하세요.

## 현황

| 도메인 | 등급 | 마지막 갱신 | 부채 노트 |
|--------|------|-------------|-----------|
| chat | N/A | — | 미구현 |
| knowledge-base | N/A | — | 미구현 |
| auth | N/A | — | 미구현 |
| admin | N/A | — | 미구현 |

## 등급 기준

| 등급 | 의미 |
|------|------|
| A | 테스트 커버리지 > 80%, 부채 없음 |
| B | 커버리지 60~80%, 부채 1~2건 |
| C | 커버리지 40~60%, 부채 3~5건 |
| D | 커버리지 < 40% 또는 심각한 부채 |

## 업데이트 절차

도메인 작업 완료 후 이 표를 업데이트하세요.
기술 부채는 `docs/exec-plans/tech-debt-tracker.md`에 먼저 기록 후 여기서 참조.
```

- [ ] **Step 6: Create `docs/RELIABILITY.md`**

```markdown
# Reliability

외부 API 호출, 재시도, graceful degradation 패턴.

## 외부 API 호출 원칙

모든 외부 API 호출 (Slack, Notion, Anthropic, Supabase) 은:
1. **Timeout 5초 이내** — tool contract test가 강제 (`contracts.test.ts`)
2. **에러 시 throw 금지** — `{ error: "..." }` 반환 (Golden Rule #5)
3. **재시도 없음 (v1)** — 단순성 우선. v2에서 지수 백오프 추가

## Rate Limiting

- `/api/chat`: 사용자당 분당 20 요청 (Supabase Edge Function 또는 미들웨어)
- Slack API: 기본 Tier 1 제한 준수 (1 req/min per method)

## SSE 스트리밍 복구

클라이언트 SSE 연결 끊김 시 자동 재연결 (`EventSource` 또는 커스텀 retry).
재연결 시 동일 `conversationId`로 히스토리 재로드.

## 저장 실패 정책 (v1)

스트리밍 완료 후 메시지 저장 실패 시:
- 서버 로그만 기록 (`console.error`)
- 클라이언트에 알림 없음
- 사용자는 대화 목록에서 누락을 인지

→ v2에서 재시도 큐 + 사용자 알림 추가 예정 (`tech-debt-tracker.md` 참조)

## 관련 문서

→ `docs/design-docs/core-beliefs.md` (Golden Rule #5, #6)
```

- [ ] **Step 7: Create `docs/SECURITY.md`**

```markdown
# Security

보안 정책 — secret 관리, RLS, PII.

## Secret 관리

| Secret | 허용 위치 |
|--------|-----------|
| `SUPABASE_SERVICE_ROLE_KEY` | `app/api/**`, `src/providers/**`, `src/domains/*/repo.ts`, `src/domains/*/runtime/**` |
| `ANTHROPIC_API_KEY` | 동일 |
| `SLACK_BOT_TOKEN` | 동일 |
| `NOTION_API_KEY` | 동일 |

클라이언트 코드(`'use client'`, `src/app/` 컴포넌트)에서 위 변수 참조 시 ESLint `no-secret-in-client` 룰이 차단.

## Row Level Security

- 모든 Supabase 테이블에 RLS 활성화 필수 (Golden Rule #3)
- 앱 레이어 권한 체크(`if user.id !== row.user_id`)는 RLS의 보조 수단, 대체 수단이 아님
- 새 테이블 생성 시 RLS 정책 없으면 마이그레이션 PR 차단

## PII 로깅 금지

- 사용자 이름, 이메일, 대화 내용을 서버 로그에 기록 금지
- 에러 로깅 시 `user_id`만 포함 (이메일 X)

## Admin 접근

- `profiles.is_admin = true`를 서버에서 검증 (클라이언트 주장 신뢰 금지)
- 관리자 계정 최초 설정: Supabase 대시보드에서 수동으로 `UPDATE profiles SET is_admin = true WHERE id = '...'`

## 관련 문서

→ `docs/design-docs/core-beliefs.md` (Golden Rule #3, #4)
```

- [ ] **Step 8: Create `docs/design-docs/core-beliefs.md`**

```markdown
# Core Beliefs

이 프로젝트의 모든 코드와 문서가 따라야 할 원칙. 위반은 PR 차단 사유.

## 1. Parse, don't validate (경계에서)

외부에서 들어오는 모든 데이터(API request body, 외부 API response, env vars)는
**Zod 스키마로 파싱**해서 타입을 좁혀야 한다. 검증 후 캐스팅 ❌.

## 2. TDD always

구현 코드 작성 전 **반드시** `superpowers:test-driven-development` skill을 호출.
순서: 실패하는 테스트 → 최소 구현 → 리팩토링. 예외 없음.

## 3. RLS first

데이터 접근 권한은 **Supabase Row Level Security가 1차 방어선**.
`if (user.id !== row.user_id)` 같은 앱 레이어 체크 ❌. RLS로 표현 가능한 모든 권한은 RLS로.

## 4. Secrets are server-only

`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `SLACK_BOT_TOKEN`, `NOTION_API_KEY`는
**`app/api/`, `src/providers/`, `src/domains/*/repo.ts`, `src/domains/*/runtime/`에서만 import 가능**
(ESLint `no-secret-in-client` 룰로 강제).

## 5. Tool failures must be graceful

Claude Agent SDK의 모든 tool은:
- 외부 API 실패 시 **throw하지 않고** `{ error: "..." }` 형태로 반환
- Claude가 자연어로 사용자에게 안내할 수 있도록
- 타임아웃 5초 이내 (vitest contract test가 강제)

## 6. Prefer narrow utilities over deps

500 LOC 이하로 구현 가능한 기능에 외부 라이브러리 추가 ❌.
`src/lib/utils/`에 직접 작성. 단, 테스트 커버리지 100% 필수.

## 7. Co-locate types with implementation

타입은 사용처 가까이. 별도 `types/` 디렉토리 금지.
도메인 공유 타입만 `src/domains/*/types.ts`에 둠. `any` 사용 시 주석으로 이유 명시.

## 8. Don't memorize external libs — read references

외부 라이브러리 사용법이 헷갈리면 **`docs/references/*-llms.txt`를 먼저 읽어라**.
기억에 의존하지 말 것.

## 9. Korean UX, English code

사용자 노출 문자열: 한국어. 코드 식별자, 주석, 커밋 메시지: 영어.

## 10. Source attribution

챗봇이 답변할 때: Slack 결과 → permalink, Notion 결과 → URL, 사내 문서 → 제목 + 수정일 첨부.
```

- [ ] **Step 9: Create `docs/design-docs/index.md`**

```markdown
# Design Docs Index

`docs/design-docs/`의 파일 목록과 각각의 목적.

| 파일 | 목적 |
|------|------|
| `core-beliefs.md` | 황금 원칙 10개 — 위반은 PR 차단 사유 |
| `agent-tool-design.md` | Claude Agent SDK tool 설계 가이드 (챗봇 구현 시 작성 예정) |
| `rag-strategy.md` | pgvector RAG 전략 (챗봇 구현 시 작성 예정) |

새 설계 문서 추가 시 이 파일에 행 추가 + `AGENTS.md`에 링크 추가.
```

- [ ] **Step 10: Create `docs/product-specs/index.md`**

```markdown
# Product Specs Index

`docs/product-specs/`의 스펙 파일 목록.

| 파일 | 상태 | 설명 |
|------|------|------|
| `2026-05-25-internal-chatbot-design.md` | ✅ 확정 | 사내 챗봇 제품 스펙 |
| `2026-05-25-development-harness-design.md` | ✅ 확정 | 개발 하네스 설계 |

새 스펙 추가 시 이 파일에 행 추가. 파일명 형식: `YYYY-MM-DD-<topic>.md`
```

- [ ] **Step 11: Create `docs/exec-plans/index.md`**

```markdown
# Execution Plans Index

`docs/exec-plans/`의 계획 파일 사용법.

## 디렉토리 구조

- `active/` — 현재 진행 중인 실행 계획. `superpowers:writing-plans` 출력물이 여기에 위치.
- `completed/` — 완료된 계획. `superpowers:finishing-a-development-branch` 완료 시 이동.

## 절차

1. 새 계획 작성 → `docs/exec-plans/active/YYYY-MM-DD-<topic>-plan.md`
2. 계획 실행 → `superpowers:executing-plans`
3. 완료 → `active/` → `completed/`로 이동

## 기술 부채 기록

기술 부채는 반드시 `tech-debt-tracker.md`에 **단일 기록** (다른 곳 ❌).
코드 주석, PR 설명, 슬랙 메시지에 기록하지 말 것.
```

- [ ] **Step 12: Create `docs/exec-plans/tech-debt-tracker.md`**

```markdown
# Tech Debt Tracker

기술 부채 단일 기록처. 코드 주석, PR, 슬랙 등 다른 곳에 기록 ❌.

## 열린 부채

| ID | 도메인 | 설명 | 영향 | 등록일 |
|----|--------|------|------|--------|
| TD-001 | chat | 메시지 저장 실패 시 silent failure (v1 정책). v2에서 재시도 큐 필요. | 대화 누락 가능 | 2026-05-25 |

## 닫힌 부채

| ID | 해결 날짜 | 해결 방법 |
|----|-----------|-----------|
| (없음) | — | — |

## 기록 방법

새 부채 발견 시:
1. 이 파일에 행 추가 (ID: TD-NNN 순번)
2. `docs/QUALITY_SCORE.md`의 해당 도메인 부채 노트 업데이트
```

- [ ] **Step 13: Create generated file stubs**

```bash
# Run update-generated.ts to create the stubs
npx tsx tools/update-generated.ts
```

Expected: `docs/generated/db-schema.md` and `docs/generated/api-routes.md` created with AUTO-GENERATED header.

- [ ] **Step 14: Create references placeholders**

```bash
cat > docs/references/claude-agent-sdk-llms.txt << 'EOF'
# Claude Agent SDK — LLM Reference

Source: https://docs.anthropic.com/claude-agent-sdk
Fetch and paste the full docs here before implementing agent tools.

Key exports: Agent, run, stream.toTextStreamResponse
EOF

cat > docs/references/supabase-llms.txt << 'EOF'
# Supabase — LLM Reference

Source: https://supabase.com/docs/reference/javascript
Fetch and paste the relevant sections (auth, db, storage) before implementing.
EOF

cat > docs/references/nextjs-app-router-llms.txt << 'EOF'
# Next.js App Router — LLM Reference

Source: https://nextjs.org/docs/app
Fetch and paste the relevant sections before implementing routes/layouts.
EOF

cat > docs/references/pgvector-llms.txt << 'EOF'
# pgvector — LLM Reference

Source: https://github.com/pgvector/pgvector
Key: cosine similarity search, HNSW index, match_documents RPC function.
EOF
```

- [ ] **Step 15: Commit all docs seed**

```bash
git add docs/
git commit -m "chore: seed all docs/ files with initial content (DESIGN, FRONTEND, PRODUCT_SENSE, QUALITY_SCORE, RELIABILITY, SECURITY, core-beliefs, indexes)"
```

---

## Task 11: README.md + ARCHITECTURE.md

**Files:**
- Create: `README.md`, `ARCHITECTURE.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# ax-academy-chatbot

사내 전용 AI 어시스턴트. 자연어 질문에 따라 Slack/Notion/사내 문서를 자동 검색해 답변합니다.

## 요구 사항

- Node.js 24+
- Supabase CLI: `brew install supabase/tap/supabase`
- lychee (docs 링크 체커): `brew install lychee`
- Docker (Supabase 로컬 실행 시)

## 빠른 시작

```bash
npm install
cp .env.example .env.local   # API 키 입력 후 저장
supabase start                # Docker 필요
supabase db reset
npm run dev
```

## 개발 워크플로우

```bash
npm run verify    # 전체 검증 (lint + typecheck + test)
npm run test      # vitest 단위 테스트
npm run lint      # ESLint + markdownlint
npm run lint:docs # AGENTS.md 링크 + 구조 검증 + 링크 체크
```

## Windows 지원

v1은 macOS / Linux (Vercel 포함) 만 지원합니다.
Windows 사용자는 WSL2를 사용하거나 `git config core.symlinks=true` + Developer Mode를 활성화하세요.

## 프로젝트 구조

→ [AGENTS.md](AGENTS.md) — 목차/맵 (여기서 시작)
→ [ARCHITECTURE.md](ARCHITECTURE.md) — 도메인 × 레이어 설계
```

- [ ] **Step 2: Create `ARCHITECTURE.md`**

```markdown
# Architecture

도메인 × 레이어 설계 맵. 자세한 설계 결정은 `docs/design-docs/`를 참조하세요.

## 비즈니스 도메인 (4개)

| 도메인 | 책임 |
|--------|------|
| `chat` | 대화, 메시지, Claude Agent 오케스트레이션 |
| `knowledge-base` | 문서 업로드, 임베딩, RAG 검색 |
| `auth` | 사용자 프로필, admin 권한 |
| `admin` | 관리자 UI (문서 CRUD) |

## 레이어 모델

```
types → config → repo → service → runtime → ui
(Zod)   (env)   (DB)   (logic)   (route)  (React)
```

- import 방향: 왼쪽 → 오른쪽만 허용 (ESLint `layer-direction` 룰이 강제)
- 같은 레이어 내 import 가능
- 모든 레이어에서 `src/providers/*` import 가능

## 디렉토리 구조

```
src/
├── domains/
│   ├── chat/
│   │   ├── types.ts           # Zod 스키마 + 파생 타입
│   │   ├── config.ts          # env vars (Zod parsed)
│   │   ├── repo.ts            # Supabase 쿼리
│   │   ├── service.ts         # 비즈니스 로직
│   │   ├── runtime/
│   │   │   ├── agent.ts       # Claude Agent 정의
│   │   │   └── tools/         # search_slack, search_notion, search_knowledge_base
│   │   └── __tests__/
│   ├── knowledge-base/
│   ├── auth/
│   └── admin/
├── providers/
│   ├── auth.ts                # Supabase Auth 클라이언트 (서버 전용)
│   ├── connectors/
│   │   ├── slack.ts           # Slack API 클라이언트
│   │   └── notion.ts          # Notion API 클라이언트
│   ├── telemetry.ts           # 로깅 (v1: console, v2: 외부 서비스)
│   └── flags.ts               # Feature flags (v1: 환경변수 기반)
├── lib/
│   └── utils/                 # 500 LOC 이하 좁은 헬퍼 (테스트 커버리지 100%)
└── app/                       # Next.js App Router
    ├── (auth)/page.tsx        # 로그인 페이지
    ├── chat/
    │   ├── page.tsx           # 새 대화
    │   └── [id]/page.tsx      # 이전 대화 이어서
    ├── admin/
    │   ├── layout.tsx         # 관리자 권한 검증 레이아웃
    │   └── documents/page.tsx # 문서 관리
    └── api/
        ├── chat/route.ts      # SSE 스트리밍 (runtime을 얇게 wrapping)
        ├── conversations/route.ts
        └── admin/documents/route.ts
```

## 금지되는 의존성 패턴

| 위반 | ESLint 룰 |
|------|----------|
| 역방향 레이어 import (`repo` → `service`) | `layer-direction` |
| 도메인 간 직접 import (`chat` → `admin`) | `domain-boundary` |
| UI에서 DB 직접 호출 | `no-direct-db-in-ui` |
| 클라이언트에서 secret 참조 | `no-secret-in-client` |

예외: `src/providers/*`는 어디서든 import 가능.

## 관련 문서

- 황금 원칙: `docs/design-docs/core-beliefs.md`
- 보안 정책: `docs/SECURITY.md`
- 외부 라이브러리: `docs/references/`
```

- [ ] **Step 3: Commit**

```bash
git add README.md ARCHITECTURE.md
git commit -m "docs: add README.md and ARCHITECTURE.md"
```

---

## Task 12: AGENTS.md + CLAUDE.md Symlink

**Files:**
- Create: `AGENTS.md`
- Create: `CLAUDE.md` (symlink)

- [ ] **Step 1: Create `AGENTS.md`**

```markdown
# AGENTS.md

> 이 파일은 코드베이스의 **목차**입니다. 자세한 내용은 링크된 문서를 참조하세요.
> 한 곳에 모든 걸 담지 않습니다 — 컨텍스트는 희소 리소스입니다.

## 🎯 이 프로젝트는

전 직원이 사용하는 사내 AI 어시스턴트. 자연어 질문에 따라 Slack/Notion/사내 문서를 자동 검색해 답변.
- 제품 스펙: `docs/product-specs/2026-05-25-internal-chatbot-design.md`
- 아키텍처: `ARCHITECTURE.md`

## ⚡ 작업 시작 전 반드시 확인

1. **황금 원칙**: `docs/design-docs/core-beliefs.md` — 위반 시 PR 자동 차단
2. **활성 실행 계획**: `docs/exec-plans/active/` — 현재 진행 중인 작업
3. **품질 점수**: `docs/QUALITY_SCORE.md` — 손대는 도메인의 현재 상태

## 🛠 개발 워크플로우 (superpowers + TDD)

| 작업 | 사용 skill | 출력 위치 |
|------|----------|----------|
| 새 기능 설계 | `superpowers:brainstorming` | `docs/product-specs/` |
| 구현 계획 | `superpowers:writing-plans` | `docs/exec-plans/active/` |
| 계획 실행 | `superpowers:executing-plans` | (TDD 사이클) |
| 코드 작성 | `superpowers:test-driven-development` | 테스트 먼저, 구현 후 |
| 리뷰 | `superpowers:requesting-code-review` | (PR 코멘트) |
| 완료 | `superpowers:finishing-a-development-branch` | plan을 completed/로 이동 |

## 📚 기술 영역별 진입점

| 작업 영역 | 시작 파일 |
|---------|----------|
| 프론트엔드 (UI/React) | `docs/FRONTEND.md` → `docs/DESIGN.md` |
| API 라우트 / 서버 | `docs/RELIABILITY.md` → `ARCHITECTURE.md` |
| 데이터베이스 / 스키마 | `docs/generated/db-schema.md` |
| 에이전트 / Tools | `docs/design-docs/agent-tool-design.md` |
| RAG / 임베딩 | `docs/design-docs/rag-strategy.md` |
| 보안 / 인증 | `docs/SECURITY.md` |
| 외부 라이브러리 | `docs/references/` |

## ✋ 절대 하지 마세요

- ❌ AGENTS.md에 임시 메모/규칙 추가 — 적절한 문서에 추가하고 여기서 링크만
- ❌ `docs/generated/` 수동 편집 — `npx tsx tools/update-generated.ts` 실행
- ❌ TDD 없이 구현 코드 작성 — 테스트가 먼저
- ❌ Supabase service role 키를 클라이언트 코드에서 import
- ❌ HR 규정 같은 민감 정보를 코드 안에 하드코딩

## 🔀 superpowers 경로 오버라이드 (필수 절차)

superpowers 스킬들은 기본 경로(`docs/superpowers/specs/`, `docs/superpowers/plans/`)에 출력합니다.
이 프로젝트에서는 출력 직후 **반드시 아래 경로로 이동**해야 합니다.

| 스킬 호출 직후 | 수동 이동 |
|--------------|----------|
| `superpowers:brainstorming` 완료 | `docs/superpowers/specs/*.md` → `docs/product-specs/` |
| `superpowers:writing-plans` 완료 | `docs/superpowers/plans/*.md` → `docs/exec-plans/active/` |
| `superpowers:finishing-a-development-branch` 완료 | `docs/exec-plans/active/*.md` → `docs/exec-plans/completed/` |

이동 후 `docs/superpowers/`가 빈 디렉토리이거나 존재하지 않는지 `tools/lint-structure.ts`가 검증합니다 (CI에서 차단).
디버깅 메시지: "docs/superpowers/ must not exist. Move files to docs/product-specs/ or docs/exec-plans/active/."

## 🔍 자체 검증

PR 열기 전:
```bash
npm run verify    # lint + lint:docs + lint:links + typecheck + test
```

개별 명령:
```bash
npm run lint        # eslint + markdownlint
npm run lint:docs   # AGENTS.md 링크 + 구조 검증
npm run lint:links  # lychee 내부 링크 체크
npm run test        # vitest
npm run typecheck   # tsc --noEmit
```

## 🚨 도움이 필요할 때

- 패턴이 누락 → `docs/design-docs/core-beliefs.md`에 추가 PR
- 문서가 코드와 어긋남 → `docs/QUALITY_SCORE.md`에 부채 기록 + `docs/exec-plans/tech-debt-tracker.md`
- 새 외부 라이브러리 추가 → `docs/references/`에 LLM 문서 함께 추가
```

- [ ] **Step 2: Create CLAUDE.md as a symlink**

```bash
ln -s AGENTS.md CLAUDE.md
```

- [ ] **Step 3: Verify the symlink**

```bash
ls -la CLAUDE.md
# Expected: CLAUDE.md -> AGENTS.md

diff CLAUDE.md AGENTS.md
# Expected: no output (files are identical)
```

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md CLAUDE.md
git commit -m "docs: add AGENTS.md (table of contents) + CLAUDE.md symlink"
```

---

## Task 13: Lint Verification — AGENTS.md Must Pass

**Files:**
- No new files; fix issues if any.

- [ ] **Step 1: Run lint-agents-md against the real project**

```bash
npx tsx tools/lint-agents-md.ts
```

Expected: `lint-agents-md: ✓ All checks passed`

If errors appear, fix them:
- **Broken link**: update the link or create the missing file
- **Orphan file**: add it to AGENTS.md or ARCHITECTURE.md
- **Line limit**: split the file or move content to design-docs/
- **Missing heading**: add `# Title` as the first line

- [ ] **Step 2: Run lint-structure**

```bash
npx tsx tools/lint-structure.ts
```

Expected: `lint-structure: ✓ All checks passed`

Note: `docs/superpowers/` still exists at this point (we haven't migrated yet). If lint-structure fails on this, it's expected — we will fix it in Task 15.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run --reporter=verbose
```

Expected: All tests PASS (lint-agents-md tests + lint-structure tests + ESLint rule tests + contract test placeholder).

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address lint-agents-md verification issues" # if any fixes needed
```

---

## Task 14: package.json Scripts + CI Workflow

**Files:**
- Modify: `package.json` (add scripts)
- Create: `.github/workflows/verify.yml`

- [ ] **Step 1: Update `package.json` scripts**

Add/replace the `scripts` section in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . && markdownlint-cli2 \"**/*.md\" \"#node_modules\" \"#.next\"",
    "lint:docs": "tsx tools/lint-agents-md.ts && tsx tools/lint-structure.ts",
    "lint:links": "lychee --offline --no-progress 'docs/**/*.md' AGENTS.md ARCHITECTURE.md",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "verify": "npm run lint && npm run lint:docs && npm run lint:links && npm run typecheck && npm run test",
    "update-generated": "tsx tools/update-generated.ts"
  }
}
```

- [ ] **Step 2: Test individual scripts locally**

```bash
npm run lint         # Should pass (no ESLint or markdownlint errors)
npm run lint:docs    # Should pass (AGENTS.md + structure valid)
npm run typecheck    # Should pass (no type errors)
npm run test         # Should pass (all tests green)
```

For `npm run lint:links` (requires lychee):
```bash
# Install if not present: brew install lychee
npm run lint:links
```

If lychee is not installed, skip this step locally (CI will run it).

- [ ] **Step 3: Create `.github/workflows/verify.yml`**

```yaml
name: verify

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  verify:
    name: Lint, Type Check, Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install lychee
        run: |
          LYCHEE_URL="https://github.com/lycheeverse/lychee/releases/latest/download/lychee-x86_64-unknown-linux-gnu.tar.gz"
          curl -sSL "$LYCHEE_URL" | tar xz
          chmod +x lychee
          sudo mv lychee /usr/local/bin/lychee

      - name: Lint (ESLint + Markdownlint)
        run: npm run lint

      - name: Lint docs (AGENTS.md integrity + structure)
        run: npm run lint:docs

      - name: Check documentation links
        run: npm run lint:links

      - name: Type check
        run: npm run typecheck

      - name: Test
        run: npm run test

      - name: Verify CLAUDE.md symlink
        run: |
          test -L CLAUDE.md || (echo "ERROR: CLAUDE.md must be a symlink to AGENTS.md" && exit 1)
          LINK_TARGET=$(readlink CLAUDE.md)
          test "$LINK_TARGET" = "AGENTS.md" || (echo "ERROR: CLAUDE.md symlink target is '$LINK_TARGET', expected 'AGENTS.md'" && exit 1)
          echo "✓ CLAUDE.md is a valid symlink to AGENTS.md"
```

- [ ] **Step 4: Commit**

```bash
git add package.json .github/workflows/verify.yml
git commit -m "chore: add npm verify scripts and GitHub Actions CI workflow"
```

---

## Task 15: Migrate Specs + Clean Up docs/superpowers/

**Files:**
- Move: `docs/superpowers/specs/*.md` → `docs/product-specs/`
- Move: `docs/superpowers/plans/*.md` → `docs/exec-plans/active/`
- Delete: `docs/superpowers/` directory

- [ ] **Step 1: Move spec files**

```bash
mv docs/superpowers/specs/2026-05-25-internal-chatbot-design.md docs/product-specs/
mv docs/superpowers/specs/2026-05-25-development-harness-design.md docs/product-specs/
```

- [ ] **Step 2: Move this plan file**

```bash
mv docs/superpowers/plans/2026-05-25-harness-bootstrap-plan.md docs/exec-plans/active/
```

- [ ] **Step 3: Remove the now-empty docs/superpowers/ directory**

```bash
rmdir docs/superpowers/plans
rmdir docs/superpowers/specs
rmdir docs/superpowers
```

Expected: directory removed without errors (all subdirectories must be empty first).

- [ ] **Step 4: Verify lint-structure now passes**

```bash
npx tsx tools/lint-structure.ts
```

Expected: `lint-structure: ✓ All checks passed`
(docs/superpowers/ no longer exists → check passes)

- [ ] **Step 5: Verify lint-agents-md still passes**

```bash
npx tsx tools/lint-agents-md.ts
```

Expected: ✓ All checks passed (AGENTS.md links still resolve — they point to the new locations).

Note: AGENTS.md still links to `docs/product-specs/2026-05-25-internal-chatbot-design.md` and `docs/design-docs/agent-tool-design.md` (doesn't exist yet — will be created during chatbot implementation). Update AGENTS.md to remove the broken `agent-tool-design.md` and `rag-strategy.md` links for now:

In `AGENTS.md`, change:
```
| 에이전트 / Tools | `docs/design-docs/agent-tool-design.md` |
| RAG / 임베딩 | `docs/design-docs/rag-strategy.md` |
```
To:
```
| 에이전트 / Tools | `docs/design-docs/index.md` (agent-tool-design.md — 챗봇 구현 시 작성) |
| RAG / 임베딩 | `docs/design-docs/index.md` (rag-strategy.md — 챗봇 구현 시 작성) |
```

Re-run `npx tsx tools/lint-agents-md.ts` to confirm it passes.

- [ ] **Step 6: Run full verify**

```bash
npm run verify
```

Expected: All steps pass. (Skip `lint:links` if lychee not installed locally.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: migrate specs to docs/product-specs/, plan to exec-plans/active/, remove docs/superpowers/"
```

---

## Task 16: Final Verification

- [ ] **Step 1: Run complete verify suite**

```bash
npm run verify
```

Expected output:
```
✓ ESLint (0 errors, 0 warnings)
✓ markdownlint-cli2 (0 violations)
✓ lint-agents-md: ✓ All checks passed
✓ lint-structure: ✓ All checks passed
✓ lychee: No broken links found
✓ tsc --noEmit: 0 errors
✓ vitest: X tests passed (X/X)
```

- [ ] **Step 2: Verify success criteria from harness spec**

Run each criterion manually:

```bash
# Criterion 2: ESLint catches golden rule violations
echo "const k = process.env.SUPABASE_SERVICE_ROLE_KEY" > /tmp/test-violation.tsx
npx eslint --rule 'local/no-secret-in-client: error' /tmp/test-violation.tsx
# Expected: 1 error

# Criterion 3: Orphan detection works
echo "# Orphan" > docs/ORPHAN-TEST.md
npx tsx tools/lint-agents-md.ts
# Expected: error about ORPHAN-TEST.md
rm docs/ORPHAN-TEST.md

# Criterion 6: CLAUDE.md symlink is valid
test -L CLAUDE.md && readlink CLAUDE.md | grep -q AGENTS.md && echo "✓ Symlink OK"

# Criterion 7: Contract test runs (placeholder passes)
npx vitest run src/domains/chat/runtime/tools/__tests__/contracts.test.ts --reporter=verbose
# Expected: 1 test passes (placeholder)
```

- [ ] **Step 3: Commit README update with setup status**

Open `README.md` and add a `## Status` section noting the harness is operational.

```bash
git add -A
git commit -m "docs: mark harness bootstrap complete in README"
```

- [ ] **Step 4: Create a PR to verify CI gates work**

```bash
git checkout -b harness/bootstrap-verification
git push origin harness/bootstrap-verification
# Open a PR on GitHub and verify CI workflow runs and passes
```

Expected: All CI steps green. The PR serves as the final integration test.

---

## Success Criteria

All criteria from `docs/product-specs/2026-05-25-development-harness-design.md` §11:

- [ ] 1. `npm run verify` passes after Task 13 (before spec migration)
- [ ] 2. ESLint blocks intentional golden rule violations (tested in Task 16)
- [ ] 3. lint-agents-md detects orphan docs (tested in Task 16)
- [ ] 4. CI gates block a PR (verified in Task 16 Step 4)
- [ ] 5. superpowers output migrated to correct paths (verified in Task 15)
- [ ] 6. CLAUDE.md symlink is valid and CI checks it (Task 14 + Task 16)
- [ ] 7. vitest contract test runs and enforces `{ error }` + 5s limit (Task 9 + Task 16)
- [ ] 8. `no-secret-in-client` rule blocks secret use outside allowed paths (Task 8 + Task 16)

---

*Plan complete. After execution, move this file: `docs/exec-plans/active/` → `docs/exec-plans/completed/` using `superpowers:finishing-a-development-branch`.*
