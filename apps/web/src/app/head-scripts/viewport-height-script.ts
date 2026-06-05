export const viewportHeightScript = `
(function() {
  var root = document.documentElement;
  var pendingFrame = 0;

  function readViewport() {
    var visualViewport = window.visualViewport;
    return {
      height: Math.round((visualViewport && visualViewport.height) || window.innerHeight || root.clientHeight || 0),
      width: Math.round((visualViewport && visualViewport.width) || window.innerWidth || root.clientWidth || 0)
    };
  }

  function applyViewportVars() {
    pendingFrame = 0;
    var viewport = readViewport();
    if (!viewport.height || !viewport.width) return;

    root.style.setProperty('--soflia-viewport-height', viewport.height + 'px');
    root.style.setProperty('--soflia-viewport-width', viewport.width + 'px');
    root.style.setProperty('--soflia-available-height', 'calc(' + viewport.height + 'px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))');
  }

  function scheduleUpdate() {
    if (pendingFrame) return;
    pendingFrame = window.requestAnimationFrame(applyViewportVars);
  }

  applyViewportVars();
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('orientationchange', scheduleUpdate, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleUpdate, { passive: true });
    window.visualViewport.addEventListener('scroll', scheduleUpdate, { passive: true });
  }
})();
`
