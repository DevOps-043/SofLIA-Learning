const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');

// Resolve the app's production dependency, not Vitest's newer jsdom. Lambda
// disables require(ESM), so run this check with --no-experimental-require-module.
const requireFromWeb = createRequire(path.resolve(__dirname, '../apps/web/package.json'));

try {
  const imported = requireFromWeb('isomorphic-dompurify');
  const purify = imported.default ?? imported;
  const clean = purify.sanitize(
    '<h2>Apuntes</h2><p onclick="alert(1)"><strong>Concepto</strong></p><script>alert(1)</script>',
  );
  assert.equal(clean, '<h2>Apuntes</h2><p><strong>Concepto</strong></p>');
  console.log('Server HTML sanitizer is compatible with the Lambda runtime.');
} catch (error) {
  console.error('Server HTML sanitizer cannot load safely in the Lambda runtime.');
  console.error(error);
  process.exitCode = 1;
}
