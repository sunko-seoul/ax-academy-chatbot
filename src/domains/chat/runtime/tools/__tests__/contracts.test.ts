/**
 * Tool Contract Tests
 * Enforces Golden Rule #5: "Tool failures must be graceful"
 * - All tool functions must return { error: string } on failure (never throw)
 * - All tool functions must complete within 5000ms
 * New tools auto-detected via fs.readdirSync. See docs/design-docs/core-beliefs.md
 */
import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

const TOOLS_DIR = path.resolve(__dirname, '..');
const TIMEOUT_MS = 5000;

const toolFiles = fs.existsSync(TOOLS_DIR)
  ? fs.readdirSync(TOOLS_DIR).filter(
      (f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'index.ts'
    )
  : [];

describe('Tool Contract: graceful failure on external API errors', () => {
  if (toolFiles.length === 0) {
    it('placeholder — tool files will auto-register when added to tools/ directory', () => {
      expect(true).toBe(true);
    });
  }

  for (const toolFile of toolFiles) {
    describe(`${toolFile}`, () => {
      it('returns { error: string } and completes within 5s on network failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

        const mod = await import(path.join(TOOLS_DIR, toolFile));
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

        expect(result).toMatchObject({ error: expect.any(String) });
        expect(elapsed).toBeLessThan(TIMEOUT_MS);
      });
    });
  }
});
