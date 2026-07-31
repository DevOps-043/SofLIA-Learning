import { Sparkles, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import styles from '../HierarchyExperience.module.css'

export function HierarchyPrimaryActions({
  canEnableHierarchy,
  hasStructure,
  isHierarchyEnabled,
  isLoading,
  onCreateStructure,
  onRequestDisable,
  onRequestEnable,
}: {
  canEnableHierarchy: boolean
  hasStructure: boolean
  isHierarchyEnabled: boolean
  isLoading: boolean
  onCreateStructure: () => void
  onRequestDisable: () => void
  onRequestEnable: () => void
}) {
  const { t } = useTranslation('business')

  return (
    <div className={styles.settingsActions}>
      {!hasStructure ? (
        <div className={styles.setupCallout}>
          <div className={styles.sectionIcon}>
            <Sparkles aria-hidden="true" />
          </div>
          <div className={styles.toggleCopy}>
            <p className={styles.toggleTitle}>{t('hierarchy.basicStructureTitle')}</p>
            <p className={styles.toggleDescription}>{t('hierarchy.basicStructureDesc')}</p>
          </div>
          <button
            type="button"
            onClick={onCreateStructure}
            disabled={isLoading}
            className={styles.primaryButton}
          >
            {isLoading ? t('hierarchy.creating') : t('hierarchy.creating2')}
          </button>
        </div>
      ) : null}
      {hasStructure ? (
        !isHierarchyEnabled ? (
          <button
            type="button"
            onClick={onRequestEnable}
            disabled={!canEnableHierarchy || isLoading}
            className={styles.primaryButton}
          >
            <Zap aria-hidden="true" />
            {t('hierarchy.enableLabel')}
          </button>
        ) : (
          <button
            type="button"
            onClick={onRequestDisable}
            disabled={isLoading}
            className={styles.secondaryButton}
          >
            {t('hierarchy.disableLabel')}
          </button>
        )
      ) : null}
    </div>
  )
}
