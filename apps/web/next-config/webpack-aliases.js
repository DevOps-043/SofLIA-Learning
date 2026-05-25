const path = require('path');

function applyWorkspaceAliases(config, appDir) {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(appDir, 'src'),
    '@/features': path.resolve(appDir, 'src/features'),
    '@/core': path.resolve(appDir, 'src/core'),
    '@/app': path.resolve(appDir, 'src/app'),
    '@/components': path.resolve(appDir, 'src/shared/components'),
    '@/lib': path.resolve(appDir, 'src/lib'),
    '@/utils': path.resolve(appDir, 'src/shared/utils'),
    '@/hooks': path.resolve(appDir, 'src/shared/hooks'),
    '@/context': path.resolve(appDir, 'src/shared/context'),
  };
}

module.exports = { applyWorkspaceAliases };
