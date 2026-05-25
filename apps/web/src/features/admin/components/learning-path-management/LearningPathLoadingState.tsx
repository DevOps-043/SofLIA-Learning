import { PageShell } from '@/core/layout'
import type { LpTranslator } from './types'

export function LearningPathLoadingState({ lp }: { lp: LpTranslator }) {
  return (
    <PageShell spacing="relaxed">
      <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-sm text-gray-500 dark:border-white/10 dark:text-white/60">
        {lp('loading', 'Cargando rutas de aprendizaje...')}
      </div>
    </PageShell>
  )
}
