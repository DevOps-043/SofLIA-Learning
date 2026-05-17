export const themePrepaintScript = `
(function() {
  try {
    var resolvedTheme = 'dark';
    var themeStorage = localStorage.getItem('theme-storage');
    var prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (themeStorage) {
      try {
        var parsed = JSON.parse(themeStorage);
        var savedTheme = parsed.state && parsed.state.theme
          ? parsed.state.theme
          : parsed.theme || 'system';

        if (savedTheme === 'system') {
          resolvedTheme = prefersDark ? 'dark' : 'light';
        } else if (savedTheme === 'dark' || savedTheme === 'light') {
          resolvedTheme = savedTheme;
        } else {
          resolvedTheme = prefersDark ? 'dark' : 'light';
        }
      } catch (error) {
        resolvedTheme = prefersDark ? 'dark' : 'light';
      }
    } else {
      resolvedTheme = prefersDark ? 'dark' : 'light';
    }

    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  } catch (error) {
    var fallbackRoot = document.documentElement;
    fallbackRoot.classList.add('dark');
    fallbackRoot.style.colorScheme = 'dark';
  }
})();
`
