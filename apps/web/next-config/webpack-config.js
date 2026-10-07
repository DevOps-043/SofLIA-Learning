const { applyWorkspaceAliases } = require('./webpack-aliases');
const { applyBrowserFallbacks, applyClientIgnorePlugin } = require('./webpack-client');
const { applyServerWebpack } = require('./webpack-server');
const { applyWindowsResolution } = require('./webpack-windows');
const { applyZoomSdkParser } = require('./webpack-vendor');

function createWebpackConfig(appDir) {
  return (config, { isServer }) => {
    applyWorkspaceAliases(config, appDir);
    applyWindowsResolution(config, appDir);
    applyZoomSdkParser(config);

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
