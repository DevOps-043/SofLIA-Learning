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
      // Transforma imports de barril en imports directos -> menos JS por ruta y
      // mejor tree-shaking. Solo `framer-motion` (animacion) como adicion a lo que
      // ya cubre el default de Next (lucide-react, heroicons, date-fns...).
      // `recharts` se deja FUERA de forma conservadora: la libreria ya emite un
      // warning interno propio (`selectPolarChartLayout`, preexistente y ajeno a
      // esta opcion), asi que no la incluimos para no sumar variables sobre charts.
      optimizePackageImports: ['lucide-react', 'framer-motion'],
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
