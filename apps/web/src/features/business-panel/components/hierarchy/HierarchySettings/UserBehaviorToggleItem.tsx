import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import styles from '../HierarchyExperience.module.css'

type UserBehaviorToggleItemData = {
  key: 'auto_assign_new_users' | 'require_team_assignment'
  icon: ComponentType<{ className?: string }>
  label: string
  description: string
  value: boolean
}

export function UserBehaviorToggleItem({
  isBusy,
  isSaved,
  item,
  onToggle,
}: {
  isBusy: boolean
  isSaved: boolean
  item: UserBehaviorToggleItemData
  onToggle: () => void
}) {
  const { t } = useTranslation('business')
  const Icon = item.icon

  return (
    <motion.div
      className={`${styles.toggleRow} ${item.value ? styles.toggleRowActive : ''}`}
    >
      <div className={styles.sectionIcon}>
        <Icon />
      </div>
      <div className={styles.toggleCopy}>
        <p className={styles.toggleTitle}>
          {item.label}
          {isSaved ? (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.savedLabel}>
              <CheckCircle2 aria-hidden="true" />
              {t('hierarchy.saved')}
            </motion.span>
          ) : null}
        </p>
        <p className={styles.toggleDescription}>{item.description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={item.value}
        disabled={isBusy}
        onClick={onToggle}
        className={styles.switch}
        data-checked={item.value}
        aria-label={item.label}
      >
        <span className={styles.switchThumb} />
      </button>
    </motion.div>
  )
}
