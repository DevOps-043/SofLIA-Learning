import { PageShell } from '@/core/layout'
import type { LpTranslator } from './types'

export function LearningPathMissingState({ error, lp }: { error: string | null; lp: LpTranslator }) {
  return (
    <PageShell spacing="relaxed">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
        {error || lp('notFound', 'Ruta de aprendizaje no encontrada')}
      </div>
    </PageShell>
  )
}
