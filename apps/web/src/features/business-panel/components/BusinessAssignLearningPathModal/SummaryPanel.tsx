import { Users } from 'lucide-react'
import type { BusinessLearningPath, BusinessLearningPathAssignment } from '../../services/businessLearningPaths.service'
import type { BusinessPanelTheme, BusinessT } from './types'

export function SummaryPanel({ existingAssignments, learningPath, t, theme }: {
  existingAssignments: BusinessLearningPathAssignment[]
  learningPath: BusinessLearningPath
  t: BusinessT
  theme: BusinessPanelTheme
}) {
  return (
    <div className="min-h-0 overflow-y-auto px-6 py-5 sm:px-8">
      <div className="rounded-[1.75rem] border p-5" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.actionSurface, color: theme.primaryColor }}><Users className="h-5 w-5" /></div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: theme.accentColor }}>{t('assignLearningPath.previewTitle', { defaultValue: 'Resumen de la ruta' })}</p>
            <h3 className="mt-2 text-lg font-black" style={{ color: theme.textColor }}>{learningPath.title}</h3>
            <p className="mt-2 text-sm" style={{ color: theme.subtextColor }}>{learningPath.description || t('learningPathsPage.cards.noDescription', { defaultValue: 'Sin descripcion disponible.' })}</p>
          </div>
        </div>
        <SummaryStats existingAssignments={existingAssignments} learningPath={learningPath} t={t} theme={theme} />
        <SequenceList learningPath={learningPath} t={t} theme={theme} />
      </div>
    </div>
  )
}

function SummaryStats({ existingAssignments, learningPath, t, theme }: Parameters<typeof SummaryPanel>[0]) {
  const stats = [
    { label: t('learningPathsPage.stats.workshops', { defaultValue: 'Talleres' }), value: learningPath.item_count },
    { label: t('learningPathsPage.stats.activeAssignments', { defaultValue: 'Asignaciones' }), value: existingAssignments.length },
  ]
  return <div className="mt-5 grid grid-cols-2 gap-3">{stats.map((stat) => <div key={stat.label} className="rounded-2xl border p-4" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}><p className="text-xs font-semibold" style={{ color: theme.subtextColor }}>{stat.label}</p><p className="mt-2 text-2xl font-black" style={{ color: theme.textColor }}>{stat.value}</p></div>)}</div>
}

function SequenceList({ learningPath, t, theme }: { learningPath: BusinessLearningPath; t: BusinessT; theme: BusinessPanelTheme }) {
  return (
    <div className="mt-6">
      <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: theme.accentColor }}>{t('learningPathsPage.cards.sequence', { defaultValue: 'Secuencia' })}</p>
      <div className="mt-4 space-y-3">
        {learningPath.items.slice(0, 5).map((item) => <SequenceItem key={item.id} item={item} t={t} theme={theme} />)}
        {learningPath.items.length > 5 ? <p className="text-xs" style={{ color: theme.subtextColor }}>{t('assignLearningPath.moreItems', { defaultValue: 'Y {{count}} talleres mas en la ruta.', count: learningPath.items.length - 5 })}</p> : null}
      </div>
    </div>
  )
}

function SequenceItem({ item, t, theme }: { item: BusinessLearningPath['items'][number]; t: BusinessT; theme: BusinessPanelTheme }) {
  return <div className="flex items-start gap-3 rounded-2xl border p-3" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black" style={{ backgroundColor: theme.actionSurface, color: theme.primaryColor }}>{item.position}</div><div className="min-w-0"><p className="text-sm font-semibold" style={{ color: theme.textColor }}>{item.course?.title || t('learningPathsPage.cards.noCourseTitle', { defaultValue: 'Taller sin titulo' })}</p><p className="text-xs" style={{ color: theme.subtextColor }}>{item.course?.category || t('learningPathsPage.cards.noCategory', { defaultValue: 'Sin categoria' })}</p></div></div>
}
