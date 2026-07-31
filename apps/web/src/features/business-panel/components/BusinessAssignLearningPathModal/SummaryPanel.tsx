import { Users } from 'lucide-react'
import type { BusinessLearningPath, BusinessLearningPathAssignment } from '../../services/businessLearningPaths.service'
import type { BusinessPanelTheme, BusinessT } from './types'
import modalStyles from '../ContentModal.module.css'

export function SummaryPanel({ existingAssignments, learningPath, t }: {
  existingAssignments: BusinessLearningPathAssignment[]
  learningPath: BusinessLearningPath
  t: BusinessT
  theme?: BusinessPanelTheme
}) {
  return (
    <aside className={modalStyles.summaryPanel}>
      <div className={modalStyles.summaryCard}>
        <div className={modalStyles.summaryHeader}>
          <div className={modalStyles.summaryIcon}><Users aria-hidden="true" /></div>
          <div>
            <p className={modalStyles.eyebrow}>{t('assignLearningPath.previewTitle', { defaultValue: 'Resumen de la ruta' })}</p>
            <h3>{learningPath.title}</h3>
            <p>{learningPath.description || t('learningPathsPage.cards.noDescription', { defaultValue: 'Sin descripción disponible.' })}</p>
          </div>
        </div>
        <SummaryStats existingAssignments={existingAssignments} learningPath={learningPath} t={t} />
        <SequenceList learningPath={learningPath} t={t} />
      </div>
    </aside>
  )
}

function SummaryStats({ existingAssignments, learningPath, t }: Parameters<typeof SummaryPanel>[0]) {
  const stats = [
    { label: t('learningPathsPage.stats.workshops', { defaultValue: 'Talleres' }), value: learningPath.item_count },
    { label: t('learningPathsPage.stats.activeAssignments', { defaultValue: 'Asignaciones' }), value: existingAssignments.length },
  ]
  return <div className={modalStyles.summaryStats}>{stats.map((stat) => <div key={stat.label} className={modalStyles.summaryStat}><span>{stat.label}</span><strong>{stat.value}</strong></div>)}</div>
}

function SequenceList({ learningPath, t }: { learningPath: BusinessLearningPath; t: BusinessT }) {
  return (
    <div>
      <p className={modalStyles.summaryLabel}>{t('learningPathsPage.cards.sequence', { defaultValue: 'Secuencia' })}</p>
      <div className={modalStyles.sequence}>
        {learningPath.items.slice(0, 5).map((item) => <SequenceItem key={item.id} item={item} t={t} />)}
        {learningPath.items.length > 5 ? <p className={modalStyles.description}>{t('assignLearningPath.moreItems', { defaultValue: 'Y {{count}} talleres más en la ruta.', count: learningPath.items.length - 5 })}</p> : null}
      </div>
    </div>
  )
}

function SequenceItem({ item, t }: { item: BusinessLearningPath['items'][number]; t: BusinessT }) {
  return <div className={modalStyles.sequenceItem}><div className={modalStyles.sequenceIndex}>{item.position}</div><div><strong>{item.course?.title || t('learningPathsPage.cards.noCourseTitle', { defaultValue: 'Taller sin título' })}</strong><span>{item.course?.category || t('learningPathsPage.cards.noCategory', { defaultValue: 'Sin categoría' })}</span></div></div>
}
