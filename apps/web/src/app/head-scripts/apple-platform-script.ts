export const applePlatformScript = `
(function() {
  try {
    var ua = navigator.userAgent || '';
    var platform = navigator.platform || '';
    var maxTouchPoints = navigator.maxTouchPoints || 0;
    var isIOS = /iPhone|iPad|iPod/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
    var isMacLike = /Macintosh|Mac OS X/i.test(ua) || platform.indexOf('Mac') === 0;
    var isWebKit = ua.indexOf('AppleWebKit') !== -1 &&
      ua.indexOf('Safari') !== -1 &&
      !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS|Firefox/.test(ua);

    if (isIOS || isMacLike || isWebKit) {
      document.documentElement.classList.add('is-apple-platform');
    }
  } catch (error) {
    /* Intentionally ignored before hydration. */
  }
})();
`
