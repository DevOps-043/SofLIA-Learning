const path = require('path');

function normalizeWindowsPath(value) {
  if (value && typeof value === 'string' && value.match(/^[A-Z]:/)) {
    return value.charAt(0).toLowerCase() + value.slice(1);
  }

  return value;
}

function applyWindowsResolution(config, appDir) {
  const nodeModulesPath = path.resolve(appDir, 'node_modules');

  config.resolve.modules = [
    ...(config.resolve.modules || []),
    nodeModulesPath,
  ];

  if (process.platform !== 'win32') {
    return;
  }

  config.resolve = {
    ...config.resolve,
    symlinks: false,
    cacheWithContext: false,
    modules: [
      ...(config.resolve.modules || []).map(modulePath =>
        typeof modulePath === 'string' ? normalizeWindowsPath(modulePath) : modulePath,
      ),
      normalizeWindowsPath(nodeModulesPath),
    ],
  };

  config.resolveLoader = {
    ...config.resolveLoader,
    symlinks: false,
  };
}

module.exports = { applyWindowsResolution };
