'use strict';

const SECRETS = ['SUPABASE_SERVICE_ROLE_KEY', 'SLACK_BOT_TOKEN', 'NOTION_API_KEY', 'ANTHROPIC_API_KEY'];

const ALLOWED_PATTERNS = [
  /[/\\]app[/\\]api[/\\]/,
  /[/\\]src[/\\]providers[/\\]/,
  /[/\\]src[/\\]domains[/\\][^/\\]+[/\\]repo\.(ts|js)$/,
  /[/\\]src[/\\]domains[/\\][^/\\]+[/\\]runtime[/\\]/,
];

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
