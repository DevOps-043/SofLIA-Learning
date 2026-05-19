import { ClipboardCheck, Settings, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { HierarchyConfig } from '../../../types/hierarchy.types'
import { UserBehaviorToggleItem } from './UserBehaviorToggleItem'

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
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-white/5 dark:bg-carbon-800">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            {t('hierarchy.userBehavior.title')}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-white/40">
            {t('hierarchy.userBehavior.subtitle')}
          </p>
        </div>
      </div>
      <div className="space-y-3">
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
  )
}
