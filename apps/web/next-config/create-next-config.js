const path = require('path');
const { headers } = require('./headers');
const { images } = require('./images');
const { outputFileTracingExcludes, serverExternalPackages } = require('./tracing');
const { createWebpackConfig } = require('./webpack-config');

function createNextConfig(appDir) {
  // TS_STRICT_BUILD=true enforces type-check and ESLint at build time.
  // Default is false during the migration window; flip to true once
  // all type-check:* slices pass cleanly in CI (see docs/tech-debt/td-001-resolution.md).
  const strictBuild = process.env.TS_STRICT_BUILD === 'true';
  return {
    poweredByHeader: false,
    productionBrowserSourceMaps: false,
    typescript: {
      ignoreBuildErrors: !strictBuild,
    },
    eslint: {
      ignoreDuringBuilds: !strictBuild,
    },
    transpilePackages: ['@aprende-y-aplica/shared', '@aprende-y-aplica/ui'],
    outputFileTracingRoot: path.resolve(appDir, '../../'),
    experimental: {
      externalDir: true,
      optimizePackageImports: ['lucide-react'],
    },
    outputFileTracingExcludes,
    serverExternalPackages,
    images,
    env: {
      NEXT_PUBLIC_APP_NAME: 'Aprende y Aplica',
      NEXT_PUBLIC_APP_VERSION: '1.0.0',
    },
    headers,
    webpack: createWebpackConfig(appDir),
  };
}

module.exports = { createNextConfig };
