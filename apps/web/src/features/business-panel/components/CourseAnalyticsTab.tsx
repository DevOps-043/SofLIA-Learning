'use client';

import { motion } from 'framer-motion';
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme';
import { CourseAnalyticsCharts } from './course-analytics-tab/CourseAnalyticsCharts';
import { CourseAnalyticsMetricGrid } from './course-analytics-tab/CourseAnalyticsMetricGrid';
import { CourseAnalyticsSummary } from './course-analytics-tab/CourseAnalyticsSummary';
import {
  CourseAnalyticsEmptyState,
  CourseAnalyticsErrorState,
  CourseAnalyticsLoadingState,
} from './course-analytics-tab/CourseAnalyticsStates';
import { useCourseAnalyticsChartTheme } from './course-analytics-tab/chart-theme';
import type { CourseAnalyticsTabProps } from './course-analytics-tab/types';
import { useCourseAnalytics } from './course-analytics-tab/useCourseAnalytics';

export function CourseAnalyticsTab({ courseId, orgSlug, refreshKey = 0 }: CourseAnalyticsTabProps) {
  const panelTheme = useBusinessPanelTheme();
  const { colors, nivoTheme, surfaceStyle } = useCourseAnalyticsChartTheme(panelTheme);
  const { analyticsData, error, fetchAnalytics, isLoading } = useCourseAnalytics({
    courseId,
    orgSlug,
    refreshKey,
  });

  if (isLoading) return <CourseAnalyticsLoadingState panelTheme={panelTheme} />;
  if (error) return <CourseAnalyticsErrorState error={error} onRetry={fetchAnalytics} panelTheme={panelTheme} />;
  if (!analyticsData) return <CourseAnalyticsEmptyState panelTheme={panelTheme} />;

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <CourseAnalyticsMetricGrid
        colors={colors}
        engagement={analyticsData.engagement}
        performance={analyticsData.performance}
        stats={analyticsData.stats}
      />
      <CourseAnalyticsCharts
        colors={colors}
        dropoffAnalysis={analyticsData.dropoff_analysis}
        nivoTheme={nivoTheme}
        panelTheme={panelTheme}
        progressDistribution={analyticsData.progress_distribution}
        surfaceStyle={surfaceStyle}
      />
      <CourseAnalyticsSummary
        dropoffAnalysis={analyticsData.dropoff_analysis}
        engagement={analyticsData.engagement}
        performance={analyticsData.performance}
        surfaceStyle={surfaceStyle}
        textColor={panelTheme.textColor}
      />
    </motion.div>
  );
}
