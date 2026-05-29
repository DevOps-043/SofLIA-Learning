import { BarChart3, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  COURSE_MANAGEMENT_ICON_GRADIENT_CLASS,
  COURSE_MANAGEMENT_PANEL_SURFACE_CLASS,
  COURSE_MANAGEMENT_SUCCESS_ICON_GRADIENT_CLASS,
} from '../../courseManagementTheme';
import { COURSE_MANAGEMENT_CHART_COLORS, COURSE_MANAGEMENT_CHART_TOOLTIP_STYLE, buildTickStyle } from './chartHelpers';
import { PanelSection } from './PanelSection';
import type { ChartRow } from './types';

export function ProgressCharts({ dailyStudyTime, weeklyProgress }: { dailyStudyTime: ChartRow[]; weeklyProgress: ChartRow[] }) {
  const { t } = useTranslation('admin');

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <PanelSection
        className={`p-6 ${COURSE_MANAGEMENT_PANEL_SURFACE_CLASS}`}
        icon={BarChart3}
        iconClassName={`h-10 w-10 ${COURSE_MANAGEMENT_ICON_GRADIENT_CLASS}`}
        subtitle={t('workshops.editor.stats.studentDetails.progressCharts.last7Days')}
        title={t('workshops.editor.stats.studentDetails.progressCharts.weeklyProgress')}
      >
        <div className="h-48">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={weeklyProgress}>
              <CartesianGrid opacity={0.3} stroke={COURSE_MANAGEMENT_CHART_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="dia" stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(11)} />
              <YAxis stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(11)} />
              <Tooltip contentStyle={COURSE_MANAGEMENT_CHART_TOOLTIP_STYLE} />
              <Bar dataKey="progreso" fill={COURSE_MANAGEMENT_CHART_COLORS.accent} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </PanelSection>
      <PanelSection
        className={`p-6 ${COURSE_MANAGEMENT_PANEL_SURFACE_CLASS}`}
        icon={Clock}
        iconClassName={`h-10 w-10 ${COURSE_MANAGEMENT_SUCCESS_ICON_GRADIENT_CLASS}`}
        subtitle={t('workshops.editor.stats.studentDetails.progressCharts.dailyDistribution')}
        title={t('workshops.editor.stats.studentDetails.progressCharts.studyTime')}
      >
        <div className="h-48">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={dailyStudyTime}>
              <CartesianGrid opacity={0.3} stroke={COURSE_MANAGEMENT_CHART_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="dia" stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(11)} />
              <YAxis stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(11)} />
              <Tooltip contentStyle={COURSE_MANAGEMENT_CHART_TOOLTIP_STYLE} />
              <Line dataKey="horas" dot={{ fill: COURSE_MANAGEMENT_CHART_COLORS.success, r: 4 }} stroke={COURSE_MANAGEMENT_CHART_COLORS.success} strokeWidth={3} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </PanelSection>
    </div>
  );
}
