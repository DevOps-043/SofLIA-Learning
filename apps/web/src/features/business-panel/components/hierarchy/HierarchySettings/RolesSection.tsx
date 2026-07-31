import { Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import styles from '../HierarchyExperience.module.css'

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
    <section className={styles.settingsCard}>
      <header className={styles.settingsHeader}>
        <div className={styles.sectionIdentity}>
          <div className={styles.sectionIcon}>
            <Shield aria-hidden="true" />
          </div>
          <div className={styles.sectionCopy}>
            <h2 className={styles.sectionTitle}>{t('hierarchy.roles.title')}</h2>
            <p className={styles.sectionDescription}>{t('hierarchy.roles.subtitle')}</p>
          </div>
        </div>
      </header>
      <div className={styles.settingsBody}>
        <div className={styles.rolesGrid}>
        {ROLE_KEYS.map((role) => (
          <div
            key={role}
            className={styles.roleRow}
          >
            <span className={styles.roleInitials}>
              {role.slice(0, 2)}
            </span>
            <div>
              <p className={styles.roleName}>{t(`hierarchy.roles.labels.${role}`)}</p>
              <p className={styles.roleScope}>{t(`hierarchy.roles.scope.${role}`)}</p>
            </div>
          </div>
        ))}
        </div>
      </div>
    </section>
  )
}
