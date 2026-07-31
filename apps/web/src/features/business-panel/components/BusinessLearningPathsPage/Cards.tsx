import { Route } from 'lucide-react'
import { BusinessLearningPathCard } from './Card'
import type { BusinessLearningPathsLogic, BusinessLearningPathsTranslate } from './types'
import styles from '@/app/[orgSlug]/business-panel/courses/ContentPanel.module.css'

interface BusinessLearningPathCardsProps {
  logic: BusinessLearningPathsLogic
  t: BusinessLearningPathsTranslate
  onOpenVideos: (id: string) => void
}

export function BusinessLearningPathCards({ logic, t, onOpenVideos }: BusinessLearningPathCardsProps) {
  return (
    <section id="tour-paths-cards" className={styles.contentStack}>
      <header className={styles.collectionHeader}>
        <div>
          <h2 className={styles.collectionTitle}>Rutas disponibles</h2>
          <p className={styles.collectionSummary}>
            {logic.filteredLearningPaths.length} de {logic.learningPaths.length} rutas
          </p>
        </div>
      </header>
      {logic.filteredLearningPaths.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateContent}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <Route />
            </span>
            <h2>No hay rutas disponibles</h2>
            <p>
              {logic.learningPaths.length === 0
                ? 'Cuando el equipo administrador publique rutas activas, aparecerán aquí.'
                : 'No encontramos rutas con la búsqueda actual. Prueba con otro término.'}
            </p>
            {logic.learningPaths.length > 0 ? (
              <button
                type="button"
                className={styles.emptyAction}
                onClick={() => logic.setSearchTerm('')}
              >
                Limpiar búsqueda
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className={styles.pathGrid}>
          {logic.filteredLearningPaths.map((path, index) => (
            <BusinessLearningPathCard key={path.id} path={path} index={index} logic={logic} t={t} onOpenVideos={onOpenVideos} />
          ))}
        </div>
      )}
    </section>
  )
}
