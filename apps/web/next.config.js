const { createNextConfig } = require('./next-config/create-next-config');
const { withBundleAnalyzer, withPWA } = require('./next-config/plugins');

module.exports = withBundleAnalyzer(withPWA(createNextConfig(__dirname)));
