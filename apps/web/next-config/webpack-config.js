const { applyWorkspaceAliases } = require('./webpack-aliases');
const { applyBrowserFallbacks, applyClientIgnorePlugin } = require('./webpack-client');
const { applyServerWebpack } = require('./webpack-server');
const { applyWindowsResolution } = require('./webpack-windows');

function createWebpackConfig(appDir) {
  return (config, { isServer }) => {
    applyWorkspaceAliases(config, appDir);
    applyWindowsResolution(config, appDir);

    if (isServer) {
      applyServerWebpack(config);
    } else {
      applyBrowserFallbacks(config);
      applyClientIgnorePlugin(config);
    }

    return config;
  };
}

module.exports = { createWebpackConfig };
