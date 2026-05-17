import { Route, X } from 'lucide-react'
import type { BusinessLearningPath } from '../../services/businessLearningPaths.service'
import type { BusinessPanelTheme, BusinessT } from './types'

export function ModalHeader({ learningPath, onClose, t, theme }: {
  learningPath: BusinessLearningPath
  onClose: () => void
  t: BusinessT
  theme: BusinessPanelTheme
}) {
  return (
    <div className="border-b px-6 py-5 sm:px-8" style={{ borderColor: theme.borderColor }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem]" style={{ background: 'linear-gradient(135deg, ' + theme.primaryColor + ', ' + theme.accentColor + ')', color: theme.onPrimaryColor }}>
            <Route className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: theme.accentColor }}>
              {t('assignLearningPath.title', { defaultValue: 'Asignar ruta de aprendizaje' })}
            </p>
            <h2 className="mt-2 truncate text-2xl font-black" style={{ color: theme.textColor }}>{learningPath.title}</h2>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: theme.subtextColor }}>{t('assignLearningPath.subtitle')}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-2xl border p-3 transition-colors" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}>
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
