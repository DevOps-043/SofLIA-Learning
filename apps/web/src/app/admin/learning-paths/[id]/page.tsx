import { Metadata } from 'next'
import { LearningPathManagementPage } from '@/features/admin/components'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  return {
    title: 'Editar Learning Path | Panel de Administración',
    description: `Gestiona el contenido y orden del learning path ${id}.`,
  }
}

export default async function LearningPathDetailPage({ params }: PageProps) {
  const { id } = await params
  return <LearningPathManagementPage learningPathId={id} />
}
