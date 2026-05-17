import { BarChart3, Clock } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  COURSE_MANAGEMENT_ACCENT_ICON_CLASS,
  COURSE_MANAGEMENT_INSET_SURFACE_CLASS,
  COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS,
  COURSE_MANAGEMENT_STUDY_ICON_GRADIENT_CLASS,
  COURSE_MANAGEMENT_SUCCESS_PANEL_CLASS,
} from '../../courseManagementTheme';
import { COURSE_MANAGEMENT_CHART_COLORS, COURSE_MANAGEMENT_CHART_TOOLTIP_STYLE, buildTickStyle } from './chartHelpers';
import { MetricGrid } from './MetricGrid';
import { PanelSection } from './PanelSection';
import type { ChartRow, MetricCard, TimeSlot } from './types';

export function StudyHabitsPanel({ activeDays, metrics, preferredTimeSlots }: { activeDays: ChartRow[]; metrics: MetricCard[]; preferredTimeSlots: TimeSlot[] }) {
  return (
    <PanelSection
      className={COURSE_MANAGEMENT_SUCCESS_PANEL_CLASS}
      icon={Clock}
      iconClassName={`h-12 w-12 rounded-xl shadow-lg ${COURSE_MANAGEMENT_STUDY_ICON_GRADIENT_CLASS}`}
      subtitle="Analisis de patrones y comportamiento de aprendizaje"
      title="Habitos de Estudio"
    >
      <MetricGrid cardClass={`p-4 ${COURSE_MANAGEMENT_INSET_SURFACE_CLASS}`} columnsClass="grid-cols-1 md:grid-cols-4" items={metrics} />
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PreferredTimeSlots slots={preferredTimeSlots} />
        <ActiveDaysChart activeDays={activeDays} />
      </div>
    </PanelSection>
  );
}

function PreferredTimeSlots({ slots }: { slots: TimeSlot[] }) {
  return (
    <div className={`p-5 ${COURSE_MANAGEMENT_INSET_SURFACE_CLASS}`}>
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5" style={{ color: COURSE_MANAGEMENT_CHART_COLORS.success }} />
        <h4 className={`text-sm font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>Horarios Preferidos</h4>
      </div>
      <div className="space-y-3">
        {slots.map((slot) => (
          <div key={slot.periodo}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{slot.periodo}</span>
              <span className={`text-xs font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>{slot.porcentaje}%</span>
            </div>
            <div className="h-2 w-full rounded-full" style={{ backgroundColor: COURSE_MANAGEMENT_CHART_COLORS.grid }}>
              <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${slot.porcentaje}%`, backgroundColor: slot.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveDaysChart({ activeDays }: { activeDays: ChartRow[] }) {
  return (
    <div className={`p-5 ${COURSE_MANAGEMENT_INSET_SURFACE_CLASS}`}>
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className={`h-5 w-5 ${COURSE_MANAGEMENT_ACCENT_ICON_CLASS}`} />
        <h4 className={`text-sm font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>Dias Mas Activos</h4>
      </div>
      <div className="h-32">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={activeDays}>
            <CartesianGrid opacity={0.3} stroke={COURSE_MANAGEMENT_CHART_COLORS.grid} strokeDasharray="3 3" />
            <XAxis dataKey="dia" stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(10)} />
            <YAxis stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(10)} />
            <Tooltip contentStyle={{ ...COURSE_MANAGEMENT_CHART_TOOLTIP_STYLE, fontSize: '12px' }} />
            <Bar dataKey="sesiones" fill={COURSE_MANAGEMENT_CHART_COLORS.success} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
