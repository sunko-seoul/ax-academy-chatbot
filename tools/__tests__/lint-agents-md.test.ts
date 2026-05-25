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

  it('fails when a docs/ file is orphaned', () => {
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
