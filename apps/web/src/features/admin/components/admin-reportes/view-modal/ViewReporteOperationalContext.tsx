'use client'

import { useTranslation } from 'react-i18next'
import type { ReportProblemMetadata } from '@/core/reporting/report-problem.contract'
import { ReporteInfoCard } from '../ReporteInfoCard'

interface ViewReporteOperationalContextProps {
  metadata: Partial<ReportProblemMetadata> | null
}

export function ViewReporteOperationalContext({ metadata }: ViewReporteOperationalContextProps) {
  const { t } = useTranslation('admin')
  if (!metadata?.source && !metadata?.courseContext && !metadata?.irisSync) return null

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {metadata.source ? <ReporteInfoCard label={t('reportesPage.viewModal.source')}>{metadata.source}</ReporteInfoCard> : null}
      {metadata.courseContext ? (
        <ReporteInfoCard label={t('reportesPage.viewModal.courseLesson')}>
          <div>{metadata.courseContext.courseTitle || t('reportesPage.viewModal.unknownCourse')}</div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{metadata.courseContext.lessonTitle || t('reportesPage.viewModal.unknownLesson')}</p>
        </ReporteInfoCard>
      ) : null}
      {metadata.irisSync ? (
        <ReporteInfoCard label={t('reportesPage.viewModal.irisSync')}>
          <div>{metadata.irisSync.status}</div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{metadata.irisSync.externalIssueId || t('reportesPage.viewModal.noExternalIssue')}</p>
        </ReporteInfoCard>
      ) : null}
    </section>
  )
}
