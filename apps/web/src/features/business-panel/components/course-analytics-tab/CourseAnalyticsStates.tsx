import { AlertTriangle } from 'lucide-react';
import type { BusinessPanelTheme } from './chart-theme';

interface LoadingStateProps {
  panelTheme: BusinessPanelTheme;
}

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  panelTheme: BusinessPanelTheme;
}

export function CourseAnalyticsLoadingState({ panelTheme }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <div
        className="w-16 h-16 border-4 rounded-full animate-spin"
        style={{
          borderColor: `${panelTheme.actionColor}30`,
          borderTopColor: panelTheme.actionColor,
        }}
      />
    </div>
  );
}

export function CourseAnalyticsErrorState({ error, onRetry, panelTheme }: ErrorStateProps) {
  return (
    <div className="text-center py-20">
      <AlertTriangle className="w-16 h-16 mx-auto mb-4" style={{ color: panelTheme.dangerColor }} />
      <p className="text-lg mb-4" style={{ color: panelTheme.dangerColor }}>{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg transition-colors"
        style={{
          backgroundColor: panelTheme.actionSurface,
          border: `1px solid ${panelTheme.borderColor}`,
          color: panelTheme.actionColor,
        }}
      >
        Reintentar
      </button>
    </div>
  );
}

export function CourseAnalyticsEmptyState({ panelTheme }: LoadingStateProps) {
  return (
    <div className="text-center py-20">
      <p style={{ color: panelTheme.subtextColor }}>No hay datos disponibles</p>
    </div>
  );
}
