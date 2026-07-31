import { useTranslation } from 'react-i18next'
import styles from '../HierarchyExperience.module.css'

export function HierarchyLoadingState() {
  const { t } = useTranslation('business')

  return (
    <div className={styles.skeletonStack} aria-live="polite" aria-label={t('hierarchy.loadingConfig')}>
      {[0, 1, 2].map((item) => <div key={item} className={styles.skeletonRow} />)}
    </div>
  )
}
