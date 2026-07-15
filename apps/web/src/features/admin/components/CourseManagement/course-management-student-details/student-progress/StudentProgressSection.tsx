'use client';

import { COURSE_MANAGEMENT_PANEL_SURFACE_CLASS } from '../../courseManagementTheme';
import { EngagementMetricsPanel } from './EngagementMetricsPanel';
import { MetricGrid } from './MetricGrid';
import { SofliaInteractionPanel } from './SofliaInteractionPanel';
import { buildStudentProgressData } from './studentProgressData';
import type { StudentProgressSectionProps } from './types';

export function StudentProgressSection({
  selectedStudent,
  studentDetailsData,
}: StudentProgressSectionProps) {
  const {
    conversationTopics,
    conversationsByWeek,
    metrics,
    sd,
  } = buildStudentProgressData(studentDetailsData, selectedStudent);

  return (
    <>
      <MetricGrid
        cardClass={`p-4 ${COURSE_MANAGEMENT_PANEL_SURFACE_CLASS}`}
        columnsClass="grid-cols-1 md:grid-cols-2"
        items={metrics.topMetrics}
      />
      <EngagementMetricsPanel data={sd} />
      <SofliaInteractionPanel
        conversationsByWeek={conversationsByWeek}
        metrics={metrics.sofliaMetrics}
        topics={conversationTopics}
      />
    </>
  );
}
