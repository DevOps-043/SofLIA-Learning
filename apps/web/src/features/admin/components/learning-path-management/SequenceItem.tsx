import type { LearningPath, LpTranslator, ReorderItems, SetRemoveTarget } from './types'

interface SequenceItemProps {
  index: number
  item: LearningPath['items'][number]
  itemsLength: number
  lp: LpTranslator
  saving: boolean
  setRemoveTargetId: SetRemoveTarget
  onReorder: ReorderItems
}

export function SequenceItem({
  index,
  item,
  itemsLength,
  lp,
  saving,
  setRemoveTargetId,
  onReorder,
}: SequenceItemProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03] xl:flex-row xl:items-start xl:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-[var(--color-accent)]">
          <div className="absolute inset-0 rounded-2xl bg-[var(--color-accent)] opacity-10" />
          <span className="relative">{item.position}</span>
        </div>
        <div className="min-w-0 space-y-1">
          <p className="break-words text-base font-semibold leading-snug text-gray-900 dark:text-white">
            {item.course?.title || lp('untitledCourse', 'Curso sin titulo')}
          </p>
          <p className="break-words text-sm text-gray-500 dark:text-white/60">
            {item.course?.category || lp('noCategory', 'Sin categoria')} / {item.course?.level || lp('noLevel', 'Sin nivel')}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 xl:shrink-0 xl:justify-end">
        <button type="button" disabled={index === 0 || saving} onClick={() => void onReorder(index, index - 1)} className="rounded-2xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-40 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10">
          {lp('moveUp', 'Subir')}
        </button>
        <button type="button" disabled={index === itemsLength - 1 || saving} onClick={() => void onReorder(index, index + 1)} className="rounded-2xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-40 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10">
          {lp('moveDown', 'Bajar')}
        </button>
        <button type="button" disabled={saving} onClick={() => setRemoveTargetId(item.id)} className="rounded-2xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10">
          {lp('removeWorkshop', 'Eliminar')}
        </button>
      </div>
    </div>
  )
}
