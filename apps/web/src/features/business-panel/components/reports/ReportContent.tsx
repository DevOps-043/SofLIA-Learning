'use client'

import { useTranslation } from 'react-i18next'
import { ReportType } from '@/app/api/[orgSlug]/business/reports/data/route'
import { LiaAnalysisReport } from './LiaAnalysisReport'
import { UsersReport } from './UsersReport'
import { ActivityReport } from './ActivityReport'
import { CertificatesReport } from './CertificatesReport'
import type { ReportData } from './types'

function ReportContent({ reportType, data }: { reportType: ReportType; data: ReportData }) {
  const { t } = useTranslation('business')
  switch (reportType) {
    case 'users':
      return <UsersReport data={data} />
    case 'activity':
      return <ActivityReport data={data} />
    case 'certificates':
      return <CertificatesReport data={data} />
    case 'lia-analysis':
      return <LiaAnalysisReport data={data} />
    default:
      return <div className="opacity-70">{t('reports.messages.unavailable')}</div>
  }
}

export { ReportContent }
