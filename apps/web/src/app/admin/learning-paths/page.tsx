import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AdminLoadingSpinner } from '@/features/admin/components/AdminLoadingSpinner'

const AdminLearningPathsPage = dynamic(
  () =>
    import('@/features/admin/components').then((mod) => ({
      default: mod.AdminLearningPathsPage,
    })),
  {
    loading: () => <AdminLoadingSpinner />,
  },
)

export const metadata: Metadata = {
  title: 'Learning Paths | Panel de Administración',
  description: 'Gestiona learning paths y secuencias ordenadas de talleres.',
}

export default function LearningPathsPage() {
  return <AdminLearningPathsPage />
}
