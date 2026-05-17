const path = require('path');
const { headers } = require('./headers');
const { images } = require('./images');
const { outputFileTracingExcludes, serverExternalPackages } = require('./tracing');
const { createWebpackConfig } = require('./webpack-config');

function createNextConfig(appDir) {
  return {
    poweredByHeader: false,
    productionBrowserSourceMaps: false,
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
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
