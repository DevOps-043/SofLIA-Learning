import { Lightbulb, Rocket } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  COURSE_MANAGEMENT_ACCENT_ICON_CLASS,
  COURSE_MANAGEMENT_HIGHLIGHT_PANEL_CLASS,
  COURSE_MANAGEMENT_ICON_GRADIENT_CLASS,
  COURSE_MANAGEMENT_INSET_SURFACE_CLASS,
  COURSE_MANAGEMENT_MUTED_TEXT_CLASS,
  COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS,
} from '../../courseManagementTheme';
import { COURSE_MANAGEMENT_CHART_COLORS, COURSE_MANAGEMENT_CHART_TOOLTIP_STYLE, buildTickStyle } from './chartHelpers';
import { MetricGrid } from './MetricGrid';
import { PanelSection } from './PanelSection';
import type { ChartRow, ConversationTopic, MetricCard } from './types';

export function SofliaInteractionPanel({ conversationsByWeek, metrics, topics }: { conversationsByWeek: ChartRow[]; metrics: MetricCard[]; topics: ConversationTopic[] }) {
  return (
    <PanelSection
      className={COURSE_MANAGEMENT_HIGHLIGHT_PANEL_CLASS}
      icon={Lightbulb}
      iconClassName={`h-12 w-12 rounded-xl shadow-lg ${COURSE_MANAGEMENT_ICON_GRADIENT_CLASS}`}
      subtitle="Analisis de conversaciones y asistencia personalizada"
      title="Interaccion con SofLIA"
    >
      <MetricGrid cardClass={`p-4 shadow-sm ${COURSE_MANAGEMENT_INSET_SURFACE_CLASS}`} columnsClass="grid-cols-1 md:grid-cols-3" items={metrics} />
      <div className={`mt-6 p-5 ${COURSE_MANAGEMENT_INSET_SURFACE_CLASS}`}>
        <div className="mb-4 flex items-center gap-2">
          <Rocket className={`h-5 w-5 ${COURSE_MANAGEMENT_ACCENT_ICON_CLASS}`} />
          <h4 className={`text-sm font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>Frecuencia de Conversaciones</h4>
        </div>
        <div className="h-40">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={conversationsByWeek}>
              <defs><linearGradient id="colorConversaciones" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor={COURSE_MANAGEMENT_CHART_COLORS.accent} stopOpacity={0.8} /><stop offset="95%" stopColor={COURSE_MANAGEMENT_CHART_COLORS.accent} stopOpacity={0.1} /></linearGradient></defs>
              <CartesianGrid opacity={0.3} stroke={COURSE_MANAGEMENT_CHART_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="semana" stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(11)} />
              <YAxis stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(11)} />
              <Tooltip contentStyle={COURSE_MANAGEMENT_CHART_TOOLTIP_STYLE} />
              <Area dataKey="conversaciones" fill="url(#colorConversaciones)" fillOpacity={1} stroke={COURSE_MANAGEMENT_CHART_COLORS.accent} strokeWidth={2} type="monotone" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {topics.map((topic) => (
          <div key={topic.tema} className={`p-3 text-center ${COURSE_MANAGEMENT_INSET_SURFACE_CLASS}`}>
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: topic.color }}>{topic.count}</div>
            <div className={`text-xs font-medium ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>{topic.tema}</div>
          </div>
        ))}
      </div>
    </PanelSection>
  );
}
