import type { Metadata } from 'next'
import { NotebookPageClient } from '@/features/notebook'

export const metadata: Metadata = {
  title: 'Libro de Apuntes | SofLIA',
  description:
    'Accede a tus notas manuales y apuntes SofLIA en un solo lugar.',
}

export default function NotebookPage({
  params,
}: {
  params: { orgSlug: string }
}) {
  const { orgSlug } = params
  return <NotebookPageClient orgSlug={orgSlug} />
}
