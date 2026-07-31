import { ClipboardCheck, Settings, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { HierarchyConfig } from '../../../types/hierarchy.types'
import { UserBehaviorToggleItem } from './UserBehaviorToggleItem'
import styles from '../HierarchyExperience.module.css'

export function UserBehaviorSettings({
  config,
  updateConfig,
}: {
  config: HierarchyConfig | null
  updateConfig: (config: Partial<HierarchyConfig>) => Promise<boolean>
}) {
  const { t } = useTranslation('business')
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [savedField, setSavedField] = useState<string | null>(null)

  async function handleToggle(
    field: 'auto_assign_new_users' | 'require_team_assignment',
    currentValue: boolean,
  ) {
    setIsSaving(field)
    setSavedField(null)
    const success = await updateConfig({ [field]: !currentValue })
    setIsSaving(null)
    if (success) {
      setSavedField(field)
      setTimeout(() => setSavedField(null), 2000)
    }
  }

  const toggleItems = [
    {
      key: 'auto_assign_new_users' as const,
      icon: UserPlus,
      label: t('hierarchy.userBehavior.autoAssign.label'),
      description: t('hierarchy.userBehavior.autoAssign.description'),
      value: config?.auto_assign_new_users ?? false,
    },
    {
      key: 'require_team_assignment' as const,
      icon: ClipboardCheck,
      label: t('hierarchy.userBehavior.requireTeam.label'),
      description: t('hierarchy.userBehavior.requireTeam.description'),
      value: config?.require_team_assignment ?? false,
    },
  ]

  return (
    <section className={styles.settingsCard}>
      <header className={styles.settingsHeader}>
        <div className={styles.sectionIdentity}>
          <div className={styles.sectionIcon}>
            <Settings aria-hidden="true" />
          </div>
          <div className={styles.sectionCopy}>
            <h2 className={styles.sectionTitle}>{t('hierarchy.userBehavior.title')}</h2>
            <p className={styles.sectionDescription}>{t('hierarchy.userBehavior.subtitle')}</p>
          </div>
        </div>
      </header>
      <div className={styles.settingsBody}>
        <div className={styles.toggleList}>
        {toggleItems.map((item) => (
          <UserBehaviorToggleItem
            key={item.key}
            isBusy={isSaving === item.key}
            isSaved={savedField === item.key}
            item={item}
            onToggle={() => handleToggle(item.key, item.value)}
          />
        ))}
        </div>
      </div>
    </section>
  )
}
