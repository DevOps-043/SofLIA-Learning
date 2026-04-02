'use client'

import { useTranslation } from 'react-i18next'
import type { ReportType } from '../../types/report-data.types'
import { LiaAnalysisReport } from './LiaAnalysisReport'
import { UsersReport } from './UsersReport'
import { ActivityReport } from './ActivityReport'
import { CertificatesReport } from './CertificatesReport'
import type {
  ActivityReportData,
  CertificatesReportData,
  LiaAnalysisReportData,
  UsersReportData,
} from './types'

function ReportContent({
  reportType,
  data,
}: {
  reportType: ReportType
  data: UsersReportData | ActivityReportData | CertificatesReportData | LiaAnalysisReportData
}) {
  const { t } = useTranslation('business')
  switch (reportType) {
    case 'users':
      return <UsersReport data={data as UsersReportData} />
    case 'activity':
      return <ActivityReport data={data as ActivityReportData} />
    case 'certificates':
      return <CertificatesReport data={data as CertificatesReportData} />
    case 'lia-analysis':
      return <LiaAnalysisReport data={data as LiaAnalysisReportData} />
    default:
      return <div className="opacity-70">{t('reports.messages.unavailable')}</div>
  }
}

export { ReportContent }
