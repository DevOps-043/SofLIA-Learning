const path = require('node:path');
const nextWebpack = require('next/dist/compiled/webpack/webpack');
nextWebpack.init();
const { webpack } = nextWebpack;
const { applyZoomSdkParser } = require('../apps/web/next-config/webpack-vendor');

const appDir = path.resolve(__dirname, '../apps/web');
const entry = require.resolve('@zoom/meetingsdk/embedded', { paths: [appDir] });

async function compile(useFix) {
  const config = {
    mode: 'production',
    target: 'web',
    entry,
    output: { path: path.join(appDir, '.next/cache/zoom-sdk-check'), filename: 'sdk.js' },
    optimization: { minimize: false },
    externalsType: 'commonjs',
    externals: { react: 'react', 'react-dom': 'react-dom', 'react-dom/client': 'react-dom/client' },
  };
  if (useFix) applyZoomSdkParser(config);
  const compiler = webpack(config);
  try {
    const stats = await new Promise((resolve, reject) =>
      compiler.run((error, result) => error ? reject(error) : resolve(result)),
    );
    return stats.toJson({ all: false, errors: true }).errors ?? [];
  } finally {
    await new Promise((resolve, reject) => compiler.close((error) => error ? reject(error) : resolve()));
  }
}

(async () => {
  if (process.argv.includes('--verify-regression')) {
    const errors = await compile(false);
    if (!errors.some((error) => error.message.includes('@zoom/download-manager'))) {
      throw new Error('The unpatched SDK did not reproduce the Netlify build failure.');
    }
    console.log('Reproduced missing @zoom/download-manager in the unpatched SDK.');
  }
  const errors = await compile(true);
  if (errors.length) throw new Error(errors.map((error) => error.message).join('\n'));
  console.log('Zoom Meeting SDK compiles with its bundled DownloadManager.');
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
