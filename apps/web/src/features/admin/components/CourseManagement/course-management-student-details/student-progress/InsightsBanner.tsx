import { Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  COURSE_MANAGEMENT_INSIGHT_BANNER_CLASS,
  COURSE_MANAGEMENT_INSIGHT_ICON_CLASS,
  COURSE_MANAGEMENT_MUTED_TEXT_CLASS,
  COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS,
} from '../../courseManagementTheme';
import type { StudentData } from './types';

export function InsightsBanner({ studySessions }: { studySessions: StudentData['studySessions'] }) {
  const { t } = useTranslation('admin');
  const dominantSlot = studySessions?.preferredTimeSlots?.reduce(
    (current, slot) => (!current || slot.porcentaje > current.porcentaje ? slot : current),
    undefined as { periodo: string; porcentaje: number } | undefined,
  );
  const insight = dominantSlot
    ? t('workshops.editor.stats.studentDetails.insights.pattern', {
      avgDuration: studySessions?.avgSessionDuration ?? 0,
      period: dominantSlot.periodo.toLowerCase(),
      streak: studySessions?.studyStreak ?? 0,
      weeklyFrequency: studySessions?.weeklyFrequency ?? 0,
    })
    : t('workshops.editor.stats.studentDetails.insights.empty');

  return (
    <div className={COURSE_MANAGEMENT_INSIGHT_BANNER_CLASS}>
      <div className="flex items-start gap-3">
        <div className={COURSE_MANAGEMENT_INSIGHT_ICON_CLASS}>
          <Lightbulb className="h-4 w-4 text-white" />
        </div>
        <div>
          <h5 className={`mb-1 text-sm font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>
            {t('workshops.editor.stats.studentDetails.insights.title')}
          </h5>
          <p className={`text-xs leading-relaxed ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>
            {insight}
          </p>
        </div>
      </div>
    </div>
  );
}
