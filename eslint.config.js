const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  globalIgnores([
    'dist/*',
    'node_modules/*',
    '.expo/*',
    'e2e/playwright-report/*',
    'e2e/test-results/*',
    'scripts/out/*',
    'legal/*',
    'docs/*',
  ]),
  expoConfig,
]);
