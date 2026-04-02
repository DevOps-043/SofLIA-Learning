import { Metadata } from 'next'
import { CourseManagementPage } from '../../../../features/admin/components/CourseManagementPage'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  return {
    title: 'Gestión de Curso | Panel de Administración',
    description: 'Gestiona módulos, lecciones, materiales y actividades del curso.',
  }
}

export default async function WorkshopDetailPage({ params }: PageProps) {
  const { id } = await params
  return <CourseManagementPage courseId={id} />
}
