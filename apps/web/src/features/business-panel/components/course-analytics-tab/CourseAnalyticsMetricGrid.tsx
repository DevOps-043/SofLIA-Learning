import { Award, CheckCircle, Clock, Target, TrendingUp, Users, type LucideIcon } from 'lucide-react';
import { BusinessPanelStatCard } from '../shared/BusinessPanelStatCard';
import type { CourseAnalyticsColors } from './chart-theme';
import type { CourseAnalyticsEngagement, CourseAnalyticsPerformance, CourseAnalyticsStats } from './types';

interface CourseAnalyticsMetricGridProps {
  colors: CourseAnalyticsColors;
  engagement: CourseAnalyticsEngagement;
  performance: CourseAnalyticsPerformance;
  stats: CourseAnalyticsStats;
}

export function CourseAnalyticsMetricGrid({ colors, engagement, performance, stats }: CourseAnalyticsMetricGridProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard icon={Users} label="Total Asignados" value={stats.total_assigned.toString()} color={colors.action} />
        <MetricCard icon={CheckCircle} label="Completados" value={stats.completed.toString()} color={colors.success} />
        <MetricCard icon={TrendingUp} label="Tasa de Completación" value={`${stats.completion_rate}%`} color={colors.brand} />
        <MetricCard icon={Target} label="Progreso Promedio" value={`${stats.average_progress}%`} color={colors.accent} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard icon={Clock} label="Tiempo Promedio" value={`${Math.round(stats.average_time_minutes / 60)}h ${stats.average_time_minutes % 60}m`} color={colors.warning} />
        <MetricCard icon={Award} label="Rating Promedio" value={performance.average_rating > 0 ? performance.average_rating.toFixed(1) : 'N/A'} color={colors.success} />
        <MetricCard icon={Users} label="Aprendices Activos" value={engagement.active_learners.toString()} color={colors.action} />
        <MetricCard icon={TrendingUp} label="Tasa de Retención" value={`${engagement.retention_rate}%`} color={colors.brand} />
      </div>
    </>
  );
}

function MetricCard({ color, icon: Icon, label, value }: { color: string; icon: LucideIcon; label: string; value: string }) {
  return (
    <BusinessPanelStatCard
      icon={<Icon className="w-5 h-5" />}
      iconColor={color}
      title={label}
      value={value}
    />
  );
}
