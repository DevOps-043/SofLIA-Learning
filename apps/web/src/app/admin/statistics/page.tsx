import { Metadata } from 'next'
import { AdminStatisticsPage } from '@/features/admin/components/AdminStatisticsPage'

export const metadata: Metadata = {
  title: 'Estadísticas | Panel de Administración',
  description: 'Visualiza las estadísticas y métricas de la plataforma.',
}

export default function StatisticsPage() {
  return <AdminStatisticsPage />
}
