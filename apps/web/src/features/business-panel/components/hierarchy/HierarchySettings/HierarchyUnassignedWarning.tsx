import { AlertTriangle } from 'lucide-react'
import { Trans } from 'react-i18next'
import styles from '../HierarchyExperience.module.css'

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
    <div className={`${styles.alert} ${styles.alertWarning}`} role="status">
      <AlertTriangle aria-hidden="true" />
      <p className={styles.alertCopy}>
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
