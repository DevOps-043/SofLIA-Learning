import { Metadata } from 'next'
import { LearningPathManagementPage } from '@/features/admin/components/LearningPathManagementPage'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  return {
    title: 'Editar ruta de aprendizaje | Panel de Administracion',
    description: `Gestiona el contenido y orden de la ruta de aprendizaje ${id}.`,
  }
}

export default async function LearningPathDetailPage({ params }: PageProps) {
  const { id } = await params
  return <LearningPathManagementPage learningPathId={id} />
}
