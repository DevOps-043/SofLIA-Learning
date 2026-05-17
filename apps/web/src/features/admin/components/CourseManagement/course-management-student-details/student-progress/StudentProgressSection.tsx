'use client';

import { COURSE_MANAGEMENT_PANEL_SURFACE_CLASS } from '../../courseManagementTheme';
import { EngagementMetricsPanel } from './EngagementMetricsPanel';
import { InsightsBanner } from './InsightsBanner';
import { MetricGrid } from './MetricGrid';
import { ProgressCharts } from './ProgressCharts';
import { SofliaInteractionPanel } from './SofliaInteractionPanel';
import { StudyHabitsPanel } from './StudyHabitsPanel';
import { buildStudentProgressData } from './studentProgressData';
import type { StudentProgressSectionProps } from './types';

export function StudentProgressSection({
  selectedStudent,
  studentDetailsData,
}: StudentProgressSectionProps) {
  const {
    activeDays,
    conversationTopics,
    conversationsByWeek,
    dailyStudyTime,
    metrics,
    preferredTimeSlots,
    sd,
    weeklyProgress,
  } = buildStudentProgressData(studentDetailsData, selectedStudent);

  return (
    <>
      <MetricGrid
        cardClass={`p-4 ${COURSE_MANAGEMENT_PANEL_SURFACE_CLASS}`}
        columnsClass="grid-cols-1 md:grid-cols-4"
        items={metrics.topMetrics}
      />
      <ProgressCharts dailyStudyTime={dailyStudyTime} weeklyProgress={weeklyProgress} />
      <EngagementMetricsPanel data={sd} />
      <SofliaInteractionPanel
        conversationsByWeek={conversationsByWeek}
        metrics={metrics.sofliaMetrics}
        topics={conversationTopics}
      />
      <StudyHabitsPanel
        activeDays={activeDays}
        metrics={metrics.studyMetrics}
        preferredTimeSlots={preferredTimeSlots}
      />
      <InsightsBanner studySessions={sd.studySessions} />
    </>
  );
}
