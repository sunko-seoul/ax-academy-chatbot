import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import noSecretInClient from '../rules/no-secret-in-client.js';
import domainBoundary from '../rules/domain-boundary.js';
import layerDirection from '../rules/layer-direction.js';
import noDirectDbInUi from '../rules/no-direct-db-in-ui.js';

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module', parser: tsParser },
});

describe('no-secret-in-client', () => {
  it('allows secrets in server-only paths, blocks elsewhere', () => {
    tester.run('no-secret-in-client', noSecretInClient as any, {
      valid: [
        { code: 'const k = process.env.SUPABASE_SERVICE_ROLE_KEY;', filename: '/proj/app/api/chat/route.ts' },
        { code: 'const k = process.env.SUPABASE_SERVICE_ROLE_KEY;', filename: '/proj/src/providers/auth.ts' },
        { code: 'const k = process.env.SUPABASE_SERVICE_ROLE_KEY;', filename: '/proj/src/domains/chat/repo.ts' },
        { code: 'const k = process.env.SUPABASE_SERVICE_ROLE_KEY;', filename: '/proj/src/domains/chat/runtime/agent.ts' },
        { code: 'const u = process.env.NEXT_PUBLIC_SUPABASE_URL;', filename: '/proj/src/app/page.tsx' },
      ],
      invalid: [
        { code: 'const k = process.env.SUPABASE_SERVICE_ROLE_KEY;', filename: '/proj/src/app/page.tsx', errors: [{ messageId: 'noSecretInClient' }] },
        { code: 'const k = process.env.ANTHROPIC_API_KEY;', filename: '/proj/src/lib/helper.ts', errors: [{ messageId: 'noSecretInClient' }] },
        { code: 'const k = process.env.SLACK_BOT_TOKEN;', filename: '/proj/src/domains/chat/service.ts', errors: [{ messageId: 'noSecretInClient' }] },
      ],
    });
  });
});

describe('domain-boundary', () => {
  it('blocks cross-domain imports', () => {
    tester.run('domain-boundary', domainBoundary as any, {
      valid: [
        { code: "import type { Message } from '@/domains/chat/types';", filename: '/proj/src/domains/chat/service.ts' },
        { code: "import { getUser } from '@/providers/auth';", filename: '/proj/src/domains/chat/service.ts' },
      ],
      invalid: [
        { code: "import { adminRepo } from '@/domains/admin/repo';", filename: '/proj/src/domains/chat/service.ts', errors: [{ messageId: 'crossDomain' }] },
        { code: "import { kbService } from '@/domains/knowledge-base/service';", filename: '/proj/src/domains/chat/runtime/agent.ts', errors: [{ messageId: 'crossDomain' }] },
      ],
    });
  });
});

describe('layer-direction', () => {
  it('blocks reverse-direction layer imports', () => {
    tester.run('layer-direction', layerDirection as any, {
      valid: [
        { code: "import { dbConfig } from './config';", filename: '/proj/src/domains/chat/repo.ts' },
        { code: "import { findMessages } from './repo';", filename: '/proj/src/domains/chat/service.ts' },
      ],
      invalid: [
        { code: "import { chatService } from './service';", filename: '/proj/src/domains/chat/repo.ts', errors: [{ messageId: 'layerViolation' }] },
        { code: "import { messagesRepo } from './repo';", filename: '/proj/src/domains/chat/config.ts', errors: [{ messageId: 'layerViolation' }] },
      ],
    });
  });
});

describe('no-direct-db-in-ui', () => {
  it('blocks Supabase imports in UI files, allows in providers/api', () => {
    tester.run('no-direct-db-in-ui', noDirectDbInUi as any, {
      valid: [
        { code: "import { createClient } from '@supabase/supabase-js';", filename: '/proj/src/providers/db.ts' },
        { code: "import { createClient } from '@supabase/ssr';", filename: '/proj/src/app/api/chat/route.ts' },
      ],
      invalid: [
        { code: "import { createClient } from '@supabase/supabase-js';", filename: '/proj/src/app/chat/page.tsx', errors: [{ messageId: 'noDirectDb' }] },
        { code: "import { createServerClient } from '@supabase/ssr';", filename: '/proj/src/app/components/ChatInput.tsx', errors: [{ messageId: 'noDirectDb' }] },
      ],
    });
  });
});
