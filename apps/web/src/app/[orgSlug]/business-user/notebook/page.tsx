import type { Metadata } from 'next'
import { NotebookPageClient } from '@/features/notebook'

export const metadata: Metadata = {
  title: 'Libro de Apuntes | SofLIA',
  description:
    'Accede a tus notas manuales y apuntes SofLIA en un solo lugar.',
}

export default async function NotebookPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  return <NotebookPageClient orgSlug={orgSlug} />
}
