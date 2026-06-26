import { AlertTriangle } from 'lucide-react'
import { Trans } from 'react-i18next'

export function HierarchyUnassignedWarning({
  hasStructure,
  hasUnassignedUsers,
  isHierarchyEnabled,
  unassignedCount,
}: {
  hasStructure: boolean
  hasUnassignedUsers: boolean
  isHierarchyEnabled: boolean
  unassignedCount?: number
}) {
  if (!hasStructure || !hasUnassignedUsers || isHierarchyEnabled) return null

  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
      <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
      <p className="text-sm text-amber-600 dark:text-amber-400">
        {/* Trans maps <strong> in the translation string to a real <strong> element
            without dangerouslySetInnerHTML — count is a numeric prop, not raw HTML. */}
        <Trans
          i18nKey="hierarchy.unassignedWarning"
          ns="business"
          values={{ count: unassignedCount }}
          components={{ strong: <strong /> }}
        />
      </p>
    </div>
  )
}
