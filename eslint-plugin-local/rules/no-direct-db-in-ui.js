'use strict';

const DB_PACKAGES = ['@supabase/supabase-js', '@supabase/ssr'];
const UI_PATTERN = /[/\\](src[/\\])?app[/\\]/;
const API_EXCEPTION = /[/\\]api[/\\]/;

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
    if (API_EXCEPTION.test(filename)) return {};

    return {
      ImportDeclaration(node) {
        if (DB_PACKAGES.includes(node.source.value)) {
          context.report({ node, messageId: 'noDirectDb' });
        }
      },
    };
  },
};
