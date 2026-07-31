import { Route } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BusinessLearningPathsTheme } from './types'
import styles from '@/app/[orgSlug]/business-panel/courses/ContentPanel.module.css'

export function BusinessLearningPathsHero({ theme }: { theme: BusinessLearningPathsTheme }) {
  const { t } = useTranslation('business')
  return (
    <section
      id="tour-paths-hero"
      className={styles.hero}
      style={{ background: theme.heroBackground, borderColor: theme.heroBorderColor }}
      aria-labelledby="learning-paths-page-title"
    >
      <div className={styles.heroAtmosphere} aria-hidden="true" />
      <div className={styles.heroRingLarge} aria-hidden="true" />
      <div className={styles.heroRingSmall} aria-hidden="true" />
      <div className={styles.heroDot} aria-hidden="true" />
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>{t('learningPathsPage.badge')}</p>
        <h1 id="learning-paths-page-title" className={styles.heroTitle}>
          {t('learningPathsPage.title')}
        </h1>
        <p className={styles.heroDescription}>{t('learningPathsPage.subtitle')}</p>
      </div>
      <div className={styles.heroIcon} aria-hidden="true">
        <Route />
      </div>
    </section>
  )
}
