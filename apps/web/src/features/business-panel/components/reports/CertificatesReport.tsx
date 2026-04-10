'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { StatCard } from './StatCard'
import { ChartCard } from './ChartCard'
import { Award, Users, Eye, TrendingUp } from 'lucide-react'
import { ReportTable } from '../ReportTable'
import type { ColumnDef } from '@tanstack/react-table'
import type { CertificatesReportData } from './types'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

type CertificateRow = NonNullable<CertificatesReportData['certificates']>[number]

type CourseCertificateDatum = {
  name: string
  certificados: number
}

function CertificatesReport({ data }: { data: CertificatesReportData }) {
  const { t } = useTranslation('business')
  const panelTheme = useBusinessPanelTheme()
  const certifiedUsersCount = data.total_users_with_certificates ?? 0
  const totalCertificatesCount = data.total_certificates ?? 0

  const courseCertData: CourseCertificateDatum[] = (data.certificates_by_course || [])
    .slice(0, 8)
    .map((course) => ({
      name: (course.course_title || t('reports.certificatesReport.courseFallback')).substring(0, 15),
      certificados: course.count || 0
    }))

  const columns: ColumnDef<CertificateRow>[] = [
    { accessorKey: 'user_name', header: t('reports.certificatesReport.columns.user') },
    { accessorKey: 'course_title', header: t('reports.certificatesReport.columns.course') },
    {
      accessorKey: 'course_category',
      header: t('reports.certificatesReport.columns.category'),
      cell: (info) => info.getValue() || '-'
    },
    {
      accessorKey: 'issued_at',
      header: t('reports.certificatesReport.columns.issuedAt'),
      cell: (info) => (info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-')
    },
    {
      id: 'actions',
      header: t('reports.certificatesReport.columns.view'),
      cell: (info) => {
        const url = info.row.original.certificate_url
        return url ? (
          <button
            onClick={() => window.open(url, '_blank')}
            className="p-2 rounded-lg"
            style={{ backgroundColor: panelTheme.hoverBg }}
          >
            <Eye className="w-4 h-4" style={{ color: panelTheme.actionColor }} />
          </button>
        ) : <span className="opacity-50 text-xs">-</span>
      }
    }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label={t('reports.certificatesReport.stats.totalCertificates')} value={totalCertificatesCount} icon={Award} color={panelTheme.secondaryColor} />
        <StatCard label={t('reports.certificatesReport.stats.certifiedUsers')} value={certifiedUsersCount} icon={Users} color={panelTheme.actionColor} />
        <StatCard label={t('reports.certificatesReport.stats.averagePerUser')} value={certifiedUsersCount > 0 ? (totalCertificatesCount / certifiedUsersCount).toFixed(1) : '0'} icon={TrendingUp} color={panelTheme.successColor} />
      </div>

      {courseCertData.length > 0 && (
        <ChartCard title={t('reports.certificatesReport.charts.byCourse')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseCertData}>
              <CartesianGrid strokeDasharray="3 3" stroke={panelTheme.borderColor} opacity={0.3} />
              <XAxis dataKey="name" tick={{ fill: panelTheme.textColor, fontSize: 10 }} angle={-45} textAnchor="end" height={80} axisLine={{ stroke: panelTheme.borderColor }} />
              <YAxis tick={{ fill: panelTheme.textColor, fontSize: 12 }} axisLine={{ stroke: panelTheme.borderColor }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: panelTheme.panelBg,
                  border: `1px solid ${panelTheme.borderColor}`,
                  borderRadius: '8px',
                  color: panelTheme.textColor
                }}
                labelStyle={{ color: panelTheme.textColor }}
                cursor={{ fill: panelTheme.hoverBg }}
              />
              <Bar dataKey="certificados" fill={panelTheme.secondaryColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ReportTable data={data.certificates || []} columns={columns} />
    </div>
  )
}

export { CertificatesReport }
