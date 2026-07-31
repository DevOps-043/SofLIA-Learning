import { ArrowLeft, BookOpen } from 'lucide-react'

import styles from './BusinessCourseDetail.module.css'

export function BusinessCourseDetailLoadingState() {
  return (
    <div className={`${styles.page} ${styles.loadingPage}`} aria-label="Cargando detalle del curso">
      <div className={`${styles.skeleton} ${styles.skeletonBack}`} />
      <div className={`${styles.skeleton} ${styles.skeletonHero}`} />
      <div className={styles.skeletonGrid}>
        <div className={`${styles.skeleton} ${styles.skeletonContent}`} />
        <div className={`${styles.skeleton} ${styles.skeletonContent}`} />
      </div>
    </div>
  )
}

interface BusinessCourseDetailErrorStateProps {
  error: string
  courseId: string
  onBack: () => void
}

export function BusinessCourseDetailErrorState({
  error,
  courseId,
  onBack,
}: BusinessCourseDetailErrorStateProps) {
  return (
    <div className={`${styles.page} ${styles.pageStack}`}>
      <button type="button" onClick={onBack} className={styles.backButton}>
        <ArrowLeft aria-hidden="true" />
        Volver a cursos
      </button>
      <div className={styles.emptyState} role="alert">
        <div>
          <span className={styles.emptyStateIcon} aria-hidden="true">
            <BookOpen />
          </span>
          <h4>{error || 'Curso no encontrado'}</h4>
          <p>El curso “{courseId}” no existe, fue retirado o no está disponible para tu organización.</p>
        </div>
      </div>
    </div>
  )
}
