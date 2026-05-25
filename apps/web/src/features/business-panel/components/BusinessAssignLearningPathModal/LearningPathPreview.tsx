import { Users } from 'lucide-react'
import type {
  BusinessLearningPath,
  BusinessLearningPathAssignment,
} from '../../services/businessLearningPaths.service'
import type { BusinessAssignmentComponentProps } from './types'

export function LearningPathPreview({
  existingAssignments,
  learningPath,
  t,
  theme,
}: BusinessAssignmentComponentProps & {
  existingAssignments: BusinessLearningPathAssignment[]
  learningPath: BusinessLearningPath
}) {
  return (
    <div className="min-h-0 overflow-y-auto px-6 py-5 sm:px-8">
      <div className="rounded-[1.75rem] border p-5" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.actionSurface, color: theme.primaryColor }}>
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: theme.accentColor }}>
              {t('assignLearningPath.previewTitle')}
            </p>
            <h3 className="mt-2 text-lg font-black" style={{ color: theme.textColor }}>{learningPath.title}</h3>
            <p className="mt-2 text-sm" style={{ color: theme.subtextColor }}>
              {learningPath.description || t('learningPathsPage.cards.noDescription')}
            </p>
          </div>
        </div>
        <LearningPathStats assignmentCount={existingAssignments.length} itemCount={learningPath.item_count} t={t} theme={theme} />
        <LearningPathSequence learningPath={learningPath} t={t} theme={theme} />
      </div>
    </div>
  )
}

function LearningPathStats({
  assignmentCount,
  itemCount,
  t,
  theme,
}: BusinessAssignmentComponentProps & { assignmentCount: number; itemCount: number }) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      {[
        { label: t('learningPathsPage.stats.workshops'), value: itemCount },
        { label: t('learningPathsPage.stats.activeAssignments'), value: assignmentCount },
      ].map((stat) => (
        <div key={stat.label} className="rounded-2xl border p-4" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
          <p className="text-xs font-semibold" style={{ color: theme.subtextColor }}>{stat.label}</p>
          <p className="mt-2 text-2xl font-black" style={{ color: theme.textColor }}>{stat.value}</p>
        </div>
      ))}
    </div>
  )
}

function LearningPathSequence({
  learningPath,
  t,
  theme,
}: BusinessAssignmentComponentProps & { learningPath: BusinessLearningPath }) {
  return (
    <div className="mt-6">
      <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: theme.accentColor }}>
        {t('learningPathsPage.cards.sequence')}
      </p>
      <div className="mt-4 space-y-3">
        {learningPath.items.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-2xl border p-3" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black" style={{ backgroundColor: theme.actionSurface, color: theme.primaryColor }}>
              {item.position}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: theme.textColor }}>{item.course?.title || t('learningPathsPage.cards.noCourseTitle')}</p>
              <p className="text-xs" style={{ color: theme.subtextColor }}>{item.course?.category || t('learningPathsPage.cards.noCategory')}</p>
            </div>
          </div>
        ))}
        {learningPath.items.length > 5 ? (
          <p className="text-xs" style={{ color: theme.subtextColor }}>
            {t('assignLearningPath.moreItems', { count: learningPath.items.length - 5 })}
          </p>
        ) : null}
      </div>
    </div>
  )
}
