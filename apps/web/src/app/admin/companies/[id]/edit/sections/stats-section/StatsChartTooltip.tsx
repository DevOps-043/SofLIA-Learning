'use client'

export function createStatsTooltipStyle(isDark: boolean) {
  return {
    backgroundColor: isDark ? '#1E2329' : '#FFFFFF',
    borderRadius: '16px',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    color: isDark ? '#FFFFFF' : '#1A1D21',
  }
}
