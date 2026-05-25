import type { CSSProperties, ReactNode } from 'react';
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme';
import type { DropoffAnalysis, CourseAnalyticsEngagement, CourseAnalyticsPerformance } from './types';

interface CourseAnalyticsSummaryProps {
  dropoffAnalysis: DropoffAnalysis;
  engagement: CourseAnalyticsEngagement;
  performance: CourseAnalyticsPerformance;
  surfaceStyle: CSSProperties;
  textColor: string;
}

export function CourseAnalyticsSummary({
  dropoffAnalysis,
  engagement,
  performance,
  surfaceStyle,
  textColor,
}: CourseAnalyticsSummaryProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SummaryPanel title="Engagement" surfaceStyle={surfaceStyle} textColor={textColor}>
        <StatRow label="Sesiones Totales" value={engagement.total_sessions.toString()} />
        <StatRow label="Duración Promedio de Sesión" value={`${engagement.average_session_duration} min`} />
        <StatRow label="Tasa de Retención" value={`${engagement.retention_rate}%`} />
        <StatRow label="Aprendices Activos (7 días)" value={engagement.active_learners.toString()} />
      </SummaryPanel>
      <SummaryPanel title="Performance" surfaceStyle={surfaceStyle} textColor={textColor}>
        <StatRow label="Rating Promedio" value={performance.average_rating > 0 ? performance.average_rating.toFixed(1) : 'N/A'} />
        <StatRow label="Total Reseñas" value={performance.total_reviews.toString()} />
        <StatRow label="Tiempo Promedio de Completación" value={`${performance.average_completion_time_days} días`} />
        <StatRow label="Tasa de Abandono Promedio" value={`${dropoffAnalysis.average_dropoff_percentage}%`} />
      </SummaryPanel>
    </div>
  );
}

function SummaryPanel({ children, surfaceStyle, textColor, title }: { children: ReactNode; surfaceStyle: CSSProperties; textColor: string; title: string }) {
  return (
    <div className="rounded-3xl p-6 border" style={surfaceStyle}>
      <h3 className="text-xl font-bold mb-4" style={{ color: textColor }}>{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  const panelTheme = useBusinessPanelTheme();

  return (
    <div className="flex items-center justify-between py-2 last:border-0" style={{ borderBottom: `1px solid ${panelTheme.dividerColor}` }}>
      <span style={{ color: panelTheme.subtextColor }}>{label}</span>
      <span className="font-semibold" style={{ color: panelTheme.textColor }}>{value}</span>
    </div>
  );
}
