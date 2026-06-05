export const chunkReloadScript = `
(function() {
  var reloadKey = 'chunk-reload-attempt';

  function hasChunkFailureMessage(value) {
    return Boolean(value && (
      value.indexOf('Loading chunk') !== -1 ||
      value.indexOf('ChunkLoadError') !== -1 ||
      value.indexOf('Failed to fetch dynamically imported module') !== -1 ||
      value.indexOf('Loading CSS chunk') !== -1
    ));
  }

  function attemptReload(reason) {
    // This runs as an inline browser script in global scope — only browser globals
    // exist here. Using a server-side 'logger' threw ReferenceError and aborted the
    // auto-reload recovery, so the chunk error stuck on screen instead of self-healing.
    console.warn('Chunk loading failure detected, reloading page...', reason);
    var attempts = parseInt(sessionStorage.getItem(reloadKey) || '0', 10);
    if (attempts < 2) {
      sessionStorage.setItem(reloadKey, String(attempts + 1));
      setTimeout(function() {
        window.location.reload();
      }, 100);
      return;
    }

    sessionStorage.removeItem(reloadKey);
    console.error('Multiple automatic reload attempts failed. Please reload manually.');
  }

  window.addEventListener('error', function(event) {
    var target = event.target;
    var failedScript = target && target.tagName === 'SCRIPT' && target.src &&
      target.src.indexOf('_next/static/chunks') !== -1;

    if (hasChunkFailureMessage(event.message) || failedScript) {
      attemptReload(event.message || 'script chunk failed');
      event.preventDefault();
      return true;
    }

    return false;
  }, true);

  window.addEventListener('unhandledrejection', function(event) {
    var reason = event.reason;
    var reasonMessage = reason && reason.message;
    if ((reason && reason.name === 'ChunkLoadError') || hasChunkFailureMessage(reasonMessage)) {
      attemptReload(reasonMessage || 'dynamic import failed');
      event.preventDefault();
    }
  });

  setTimeout(function() {
    sessionStorage.removeItem(reloadKey);
  }, 5 * 60 * 1000);
})();
`
