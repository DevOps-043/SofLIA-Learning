import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BusinessLearningPathsLogic } from './types'
import styles from '@/app/[orgSlug]/business-panel/courses/ContentPanel.module.css'

export function BusinessLearningPathsSearch({ logic }: { logic: BusinessLearningPathsLogic }) {
  const { t } = useTranslation('business')
  return (
    <section id="tour-paths-search" className={styles.controlsSurface} aria-label="Buscar rutas">
      <label className={styles.search}>
        <span className="sr-only">{t('learningPathsPage.searchPlaceholder')}</span>
        <Search className={styles.searchIcon} aria-hidden="true" />
        <input
          type="search"
          value={logic.searchTerm}
          onChange={(event) => logic.setSearchTerm(event.target.value)}
          placeholder={t('learningPathsPage.searchPlaceholder')}
          className={styles.searchInput}
        />
      </label>
    </section>
  )
}
