import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AdminLoadingSpinner } from '@/features/admin/components/AdminLoadingSpinner'
import type { AdminContentTab } from '@/features/admin/components/AdminContentPage'

// Lazy loading de la pagina unificada de talleres + rutas de aprendizaje
// Reduce bundle inicial ~100-150 KB
const AdminContentPage = dynamic(
  () => import('@/features/admin/components/AdminContentPage').then(mod => ({ default: mod.AdminContentPage })),
  {
    loading: () => <AdminLoadingSpinner />
  }
)

export const metadata: Metadata = {
  title: 'Gestión de Talleres | Panel de Administración',
  description: 'Gestiona todos los talleres y rutas de aprendizaje de la plataforma.',
}

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function WorkshopsPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const initialTab: AdminContentTab = tab === 'learning-paths' ? 'learning-paths' : 'workshops'
  return <AdminContentPage initialTab={initialTab} />
}
