const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const webDir = path.resolve(__dirname, '../apps/web');
const requireFromWeb = createRequire(path.join(webDir, 'package.json'));
const sanitizerEntry = requireFromWeb.resolve('isomorphic-dompurify');
const jsdomEntry = createRequire(sanitizerEntry).resolve('jsdom');
const normalize = file => process.platform === 'win32' ? file.toLowerCase() : file;

try {
  // Next loads these for the build; load the same environment for route imports.
  requireFromWeb('@next/env').loadEnvConfig(webDir);
  const stdinListeners = ['data', 'end'].map(event => process.stdin.listenerCount(event));

  for (const route of ['tree', 'notes', 'notes/[noteId]']) {
    const entry = path.join(webDir, '.next/server/app/api/[orgSlug]/business-user/notebook', route, 'route.js');
    const imported = require(entry);
    assert.ok(imported.routeModule, `Built notebook route cannot load: ${route}`);

    // The sanitizer must remain external. Bundling jsdom can execute its XHR
    // worker at startup; Lambda's empty stdin then causes an uncaught JSON error.
    const trace = JSON.parse(fs.readFileSync(`${entry}.nft.json`, 'utf8'));
    const tracedFiles = new Set(trace.files.map(file => normalize(path.resolve(path.dirname(entry), file))));
    for (const dependency of [sanitizerEntry, jsdomEntry]) {
      assert.ok(tracedFiles.has(normalize(dependency)), `Missing external sanitizer dependency in ${route}: ${dependency}`);
    }
  }

  assert.deepEqual(
    ['data', 'end'].map(event => process.stdin.listenerCount(event)),
    stdinListeners,
    'Built notebook routes must not start a jsdom worker on process.stdin.',
  );
  console.log('Built notebook routes and external sanitizer are compatible with the Lambda runtime.');
} catch (error) {
  console.error('Built notebook runtime check failed.');
  console.error(error);
  process.exitCode = 1;
}
