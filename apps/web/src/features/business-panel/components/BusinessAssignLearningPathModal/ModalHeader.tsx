import { Route, X } from 'lucide-react'
import type { BusinessLearningPath } from '../../services/businessLearningPaths.service'
import type { BusinessPanelTheme, BusinessT } from './types'
import modalStyles from '../ContentModal.module.css'

export function ModalHeader({ learningPath, onClose, t }: {
  learningPath: BusinessLearningPath
  onClose: () => void
  t: BusinessT
  theme: BusinessPanelTheme
}) {
  return (
    <header className={modalStyles.header}>
      <div className={modalStyles.headerIcon}><Route aria-hidden="true" /></div>
      <div className={modalStyles.headerCopy}>
        <p className={modalStyles.eyebrow}>{t('assignLearningPath.title', { defaultValue: 'Asignar ruta de aprendizaje' })}</p>
        <h2 className={modalStyles.title} id="assign-learning-path-title">{learningPath.title}</h2>
        <p className={modalStyles.description}>{t('assignLearningPath.subtitle')}</p>
      </div>
      <button aria-label="Cerrar asignación de ruta" className={modalStyles.closeButton} onClick={onClose} type="button">
        <X aria-hidden="true" />
      </button>
    </header>
  )
}
