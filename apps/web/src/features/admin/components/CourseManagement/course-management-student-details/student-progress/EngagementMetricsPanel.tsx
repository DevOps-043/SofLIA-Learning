import { Book, Clock, FileText, LayoutDashboard, Users2 } from 'lucide-react';
import {
  COURSE_MANAGEMENT_ACCENT_ICON_CLASS,
  COURSE_MANAGEMENT_MUTED_TEXT_CLASS,
  COURSE_MANAGEMENT_PANEL_SURFACE_CLASS,
  COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS,
  COURSE_MANAGEMENT_WARNING_ICON_GRADIENT_CLASS,
} from '../../courseManagementTheme';
import { PanelSection } from './PanelSection';
import type { StudentData } from './types';

export function EngagementMetricsPanel({ data }: { data: StudentData }) {
  const metrics = [
    { label: 'Sesiones Totales', value: `${data.studySessions?.totalSessions || 0}`, icon: LayoutDashboard },
    { label: 'Promedio Diario', value: `${data.engagement?.avgDailyTime || 0} hrs`, icon: Clock },
    { label: 'Lecciones Vistas', value: `${data.engagement?.lessonsViewed || 0}`, icon: Book },
    { label: 'Notas Creadas', value: `${data.engagement?.notesCreated || 0}`, icon: FileText },
  ];

  return (
    <PanelSection
      className={`p-6 ${COURSE_MANAGEMENT_PANEL_SURFACE_CLASS}`}
      icon={Users2}
      iconClassName={`h-10 w-10 ${COURSE_MANAGEMENT_WARNING_ICON_GRADIENT_CLASS}`}
      subtitle="Nivel de participacion del estudiante"
      title="Metricas de Engagement"
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <Icon className={`h-5 w-5 ${COURSE_MANAGEMENT_ACCENT_ICON_CLASS}`} />
              </div>
              <div className={`mb-1 text-xl font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>{metric.value}</div>
              <div className={`text-xs ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>{metric.label}</div>
            </div>
          );
        })}
      </div>
    </PanelSection>
  );
}
