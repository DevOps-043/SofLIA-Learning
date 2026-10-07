function applyZoomSdkParser(config) {
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  config.module.rules.push({
    test: /[\\/]@zoom[\\/]meetingsdk[\\/]dist[\\/]zoomus-websdk[^\\/]*\.umd[^\\/]*\.js$/,
    // Zoom incluye DownloadManager dentro del UMD. Su rama AMD anidada nombra
    // un paquete privado que webpack intenta resolver aunque la rama CommonJS
    // ya tenga la implementación. Conservamos CommonJS y solo omitimos AMD
    // dentro de estos bundles del proveedor (cliente y SSR).
    parser: { amd: false },
  });
}

module.exports = { applyZoomSdkParser };
