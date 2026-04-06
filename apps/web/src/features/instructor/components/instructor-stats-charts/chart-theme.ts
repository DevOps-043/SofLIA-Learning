// Colores para las gráficas
export const CHART_COLORS = {
  primary: '#8b5cf6',
  secondary: '#ec4899',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
}

// Helper para obtener colores según el tema
export function getChartTheme(isDark: boolean) {
  return {
    background: isDark ? '#1f2937' : '#ffffff',
    text: {
      fontSize: 12,
      fill: isDark ? '#e5e7eb' : '#374151',
      outlineWidth: 0,
      outlineColor: 'transparent',
    },
    axis: {
      domain: {
        line: {
          stroke: isDark ? '#4b5563' : '#e5e7eb',
          strokeWidth: 1,
        },
      },
      legend: {
        text: {
          fontSize: 12,
          fill: isDark ? '#e5e7eb' : '#374151',
          outlineWidth: 0,
          outlineColor: 'transparent',
        },
      },
      ticks: {
        line: {
          stroke: isDark ? '#4b5563' : '#e5e7eb',
          strokeWidth: 1,
        },
        text: {
          fontSize: 11,
          fill: isDark ? '#9ca3af' : '#6b7280',
          outlineWidth: 0,
          outlineColor: 'transparent',
        },
      },
    },
    grid: {
      line: {
        stroke: isDark ? '#374151' : '#e5e7eb',
        strokeWidth: 1,
      },
    },
    tooltip: {
      container: {
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#e5e7eb' : '#374151',
        fontSize: 12,
        border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
        borderRadius: '8px',
        padding: '8px 12px',
      },
    },
  }
}
