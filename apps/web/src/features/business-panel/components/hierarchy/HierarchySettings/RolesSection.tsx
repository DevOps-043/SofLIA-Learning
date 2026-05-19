import { Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ROLE_KEYS = [
  'owner',
  'admin',
  'regional_manager',
  'zone_manager',
  'team_leader',
  'node_manager',
  'member',
] as const

export function RolesSection() {
  const { t } = useTranslation('business')

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-white/5 dark:bg-carbon-800">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            {t('hierarchy.roles.title')}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-white/40">
            {t('hierarchy.roles.subtitle')}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {ROLE_KEYS.map((role) => (
          <div
            key={role}
            className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3 transition-colors hover:border-neutral-200 dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/10"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-xs font-black uppercase text-neutral-500 dark:bg-white/5 dark:text-white/50">
              {role.slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {t(`hierarchy.roles.labels.${role}`)}
              </p>
              <p className="text-xs text-neutral-500 dark:text-white/40">
                {t(`hierarchy.roles.scope.${role}`)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
