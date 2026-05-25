export const CHART_COLORS = {
  primary: 'var(--color-accent)',
  secondary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-error)',
  info: 'var(--color-accent)'
};

export function getChartTheme(darkMode = true) {
  return {
    axisColor: darkMode ? 'var(--color-accent)' : 'var(--color-gray-500)',
    borderClass: darkMode
      ? 'border-white/10 bg-gray-900/60'
      : 'border-gray-200 bg-white dark:bg-gray-900',
    gridColor: darkMode ? 'rgba(255,255,255,0.1)' : 'var(--color-gray-200)',
    iconClass: darkMode ? 'text-accent' : 'text-blue-600 dark:text-blue-400',
    textClass: darkMode ? 'text-white' : 'text-gray-900 dark:text-white',
    tickColor: darkMode ? 'var(--color-gray-200)' : 'var(--color-gray-500)',
    tooltipBg: darkMode ? 'var(--color-gray-800)' : 'var(--color-bg-light)',
    tooltipBorder: darkMode ? 'rgba(255,255,255,0.1)' : 'var(--color-gray-200)',
    tooltipText: 'var(--color-contrast)'
  };
}

export function getTooltipStyle(theme: ReturnType<typeof getChartTheme>) {
  return {
    backgroundColor: theme.tooltipBg,
    border: `1px solid ${theme.tooltipBorder}`,
    borderRadius: '8px',
    color: theme.tooltipText
  };
}
