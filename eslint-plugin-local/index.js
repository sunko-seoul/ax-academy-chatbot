'use strict';

module.exports = {
  rules: {
    'no-secret-in-client': require('./rules/no-secret-in-client'),
    'domain-boundary': require('./rules/domain-boundary'),
    'layer-direction': require('./rules/layer-direction'),
    'no-direct-db-in-ui': require('./rules/no-direct-db-in-ui'),
  },
};
