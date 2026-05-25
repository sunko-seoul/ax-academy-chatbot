'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow cross-domain imports between src/domains/*' },
    messages: {
      crossDomain: 'Cross-domain import detected. Use providers or duplicate logic. See ARCHITECTURE.md.',
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
