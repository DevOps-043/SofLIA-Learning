const SERVER_EXTERNALS = {
  canvas: 'commonjs canvas',
  sharp: 'commonjs sharp',
  html2canvas: 'commonjs html2canvas',
  jspdf: 'commonjs jspdf',
};

const RRWEB_PACKAGES = ['rrweb', 'rrweb-player', '@rrweb/types'];

function applyServerWebpack(config) {
  if (Array.isArray(config.externals)) {
    config.externals.push(SERVER_EXTERNALS);
  } else if (!config.externals) {
    config.externals = [SERVER_EXTERNALS];
  }

  config.resolve.alias = {
    ...config.resolve.alias,
    rrweb: false,
    'rrweb-player': false,
    '@rrweb/types': false,
  };

  if (typeof config.externals === 'function') {
    const originalExternals = config.externals;
    config.externals = [createRrwebExternalResolver(originalExternals)];
    return;
  }

  if (Array.isArray(config.externals)) {
    config.externals.push(...RRWEB_PACKAGES);
  }
}

function createRrwebExternalResolver(originalExternals) {
  return (context, request, callback) => {
    if (RRWEB_PACKAGES.includes(request)) {
      return callback(null, `commonjs ${request}`);
    }

    return originalExternals(context, request, callback);
  };
}

module.exports = { applyServerWebpack };
