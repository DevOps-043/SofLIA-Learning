import styles from '@/app/[orgSlug]/business-panel/courses/ContentPanel.module.css'

export function BusinessLearningPathsLoading() {
  return (
    <div className={styles.loadingPage} aria-label="Cargando rutas de aprendizaje">
      <div className={`${styles.skeleton} ${styles.skeletonHero}`} />
      <div className={`${styles.skeleton} ${styles.skeletonStats}`} />
      <div className={`${styles.skeleton} ${styles.skeletonToolbar}`} />
      <div className={styles.skeletonGrid}>
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className={`${styles.skeleton} ${styles.skeletonCard}`} />
        ))}
      </div>
    </div>
  )
}
