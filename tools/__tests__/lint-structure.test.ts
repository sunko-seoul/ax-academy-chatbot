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
