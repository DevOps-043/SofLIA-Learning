import type { LearningPath, LpTranslator, ReorderItems, SetRemoveTarget } from './types'
import { SequenceItem } from './SequenceItem'

interface SequenceCardProps {
  learningPath: LearningPath
  lp: LpTranslator
  saving: boolean
  setRemoveTargetId: SetRemoveTarget
  onReorder: ReorderItems
}

export function SequenceCard({ learningPath, lp, saving, setRemoveTargetId, onReorder }: SequenceCardProps) {
  const sortedItems = learningPath.items.slice().sort((left, right) => left.position - right.position)

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{lp('sequenceTitle', 'Secuencia de la ruta')}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
          {lp('sequenceDescription', 'El siguiente taller se desbloqueara solo cuando el anterior este completado.')}
        </p>
      </div>
      {learningPath.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/60">
          {lp('emptySequence', 'Esta ruta esta vacia. Agrega el primer taller para iniciar la secuencia.')}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedItems.map((item, index) => (
            <SequenceItem key={item.id} index={index} item={item} itemsLength={sortedItems.length} lp={lp} saving={saving} setRemoveTargetId={setRemoveTargetId} onReorder={onReorder} />
          ))}
        </div>
      )}
    </div>
  )
}
