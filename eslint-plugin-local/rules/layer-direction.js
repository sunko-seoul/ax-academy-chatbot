'use strict';

const LAYER_ORDER = ['types', 'config', 'repo', 'service', 'runtime', 'ui'];

function detectLayer(filepath) {
  const basename = filepath.split(/[/\\]/).pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') ?? '';
  if (LAYER_ORDER.includes(basename)) return basename;
  if (/[/\\]runtime([/\\]|$)/.test(filepath)) return 'runtime';
  if (/\.(tsx)$/.test(filepath)) return 'ui';
  return null;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Enforce left-to-right layer import direction within a domain' },
    messages: {
      layerViolation:
        'Layer violation: {{from}} cannot import {{to}}. ' +
        'Direction must be types→config→repo→service→runtime→ui. See ARCHITECTURE.md.',
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
