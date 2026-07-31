import { motion } from 'framer-motion'
import { ChevronRight, Film, Layers, Lock, Sparkles, Users } from 'lucide-react'
import type { BusinessLearningPathItem, BusinessLearningPathsLogic, BusinessLearningPathsTranslate } from './types'
import styles from '@/app/[orgSlug]/business-panel/courses/ContentPanel.module.css'

interface BusinessLearningPathCardProps {
  path: BusinessLearningPathItem
  index: number
  logic: BusinessLearningPathsLogic
  t: BusinessLearningPathsTranslate
  onOpenVideos: (id: string) => void
}

export function BusinessLearningPathCard({ path, index, logic, t, onOpenVideos }: BusinessLearningPathCardProps) {
  const assignedCount = logic.assignmentsByPathId.get(path.id)?.length ?? 0
  const defaultRulesCount = logic.defaultRulesByPathId.get(path.id)?.length ?? 0
  return (
    <motion.article
      key={path.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={styles.pathCard}
    >
      <header className={styles.pathCardHeader}>
        <span className={styles.pathIcon} aria-hidden="true">
          <Layers />
        </span>
        <div className={styles.pathIdentity}>
          <h2>{path.title}</h2>
          <p>{path.description || 'Ruta secuencial de aprendizaje para tu equipo.'}</p>
        </div>
        <span className={styles.pathCount}>
          {t('learningPathsPage.cards.workshopsCount', { count: path.item_count })}
        </span>
      </header>

      {defaultRulesCount > 0 ? (
        <span className={styles.pathRuleBadge}>
          <Sparkles aria-hidden="true" />
          {t('learningPathsPage.defaults.badge', { count: defaultRulesCount })}
        </span>
      ) : null}

      {path.items.length > 0 ? (
        <div className={styles.pathContent}>
          <p className={styles.pathContentLabel}>{t('learningPathsPage.cards.contentTitle')}</p>
          {path.items.slice(0, 4).map((item) => (
            <div key={item.id} className={styles.pathCourse}>
              <span className={styles.pathCourseIndex}>{item.position}</span>
              <p>{item.course?.title ?? t('learningPathsPage.cards.noCourseTitle')}</p>
              {item.position === 1 ? null : <Lock aria-label="Contenido secuencial bloqueado" />}
            </div>
          ))}
          {path.items.length > 4 ? (
            <p className={styles.pathMore}>+{path.items.length - 4} talleres más</p>
          ) : null}
        </div>
      ) : (
        <div className={styles.pathContent}>
          <p className={styles.pathContentLabel}>{t('learningPathsPage.cards.contentTitle')}</p>
          <p className={styles.pathMore}>Esta ruta aún no tiene talleres configurados.</p>
        </div>
      )}

      <footer className={styles.pathFooter}>
        <p className={styles.pathAssignmentCount}>
          {t('learningPathsPage.cards.assignedUsers', { count: assignedCount })}
        </p>
        <div className={styles.pathActions}>
          <button
            type="button"
            onClick={() => onOpenVideos(path.id)}
            className={styles.secondaryAction}
          >
            <Film aria-hidden="true" />
            {t('learningPathsPage.introVideos.manageVideos')}
          </button>
          <button
            type="button"
            onClick={() => logic.setDefaultConfigLearningPathId(path.id)}
            className={styles.secondaryAction}
          >
            <Sparkles aria-hidden="true" />
            {t('learningPathsPage.defaults.configure')}
          </button>
          <button
            type="button"
            onClick={() => logic.setSelectedLearningPathId(path.id)}
            className={styles.primaryAction}
          >
            <Users aria-hidden="true" />
            {t('learningPathsPage.cards.assignUsers')}
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </footer>
    </motion.article>
  )
}
