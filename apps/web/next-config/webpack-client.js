function applyBrowserFallbacks(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    path: false,
    os: false,
    canvas: false,
    sharp: false,
  };
}

function applyClientIgnorePlugin(config) {
  const webpack = require('webpack');

  config.plugins = config.plugins || [];
  config.plugins.push(
    new webpack.IgnorePlugin({
      checkResource(resource, context) {
        if (!resource.includes('lib/supabase/server')) {
          return false;
        }

        return [
          'features/notifications/services/auto-notifications.service',
          'features/notifications/services/notification.service',
          'features/auth/services/questionnaire-validation.service',
        ].some(blockedContext => context.includes(blockedContext));
      },
    }),
  );
}

module.exports = {
  applyBrowserFallbacks,
  applyClientIgnorePlugin,
};
