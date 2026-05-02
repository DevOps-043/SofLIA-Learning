import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AdminLoadingSpinner } from '@/features/admin/components/AdminLoadingSpinner'

// Lazy loading de la página de gestión de talleres
// Reduce bundle inicial ~100-150 KB
const AdminWorkshopsPage = dynamic(
  () => import('@/features/admin/components/AdminWorkshopsPage').then(mod => ({ default: mod.AdminWorkshopsPage })),
  {
    loading: () => <AdminLoadingSpinner />
  }
)

export const metadata: Metadata = {
  title: 'Gestión de Talleres | Panel de Administración',
  description: 'Gestiona todos los talleres de la plataforma.',
}

export default function WorkshopsPage() {
  return <AdminWorkshopsPage />
}
