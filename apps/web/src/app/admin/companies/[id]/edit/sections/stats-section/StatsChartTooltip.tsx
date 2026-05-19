'use client'

export function createStatsTooltipStyle(isDark: boolean) {
  return {
    backgroundColor: isDark ? 'var(--color-gray-800)' : 'var(--color-bg-light)',
    borderRadius: '16px',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    color: isDark ? 'var(--color-bg-light)' : 'var(--color-legacy-1a1d21)',
  }
}
