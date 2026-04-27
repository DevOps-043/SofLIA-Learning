import { useState } from 'react'
import {
  ArrowsRightLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  MinusCircleIcon,
  PlayCircleIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import type { CourseDiff, DiffLesson, DiffModule, DiffStatus, FieldChange } from '../../../../lib/courseDiff'
import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminButton, AdminStatusBadge, AdminSurface } from '../ui'
import { AdminPendingCourseLessonDetails } from './AdminPendingCourseLessonContent'
import { getFieldLabel, truncateFieldValue } from './utils'

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

function getDiffTone(status: DiffStatus): Tone {
  switch (status) {
    case 'added':
      return 'success'
    case 'removed':
      return 'danger'
    case 'modified':
      return 'warning'
    default:
      return 'neutral'
  }
}

function getDiffIcon(status: DiffStatus) {
  if (status === 'added') {
    return PlusCircleIcon
  }

  if (status === 'removed') {
    return MinusCircleIcon
  }

  return ArrowsRightLeftIcon
}

function DiffBadge({ status }: { status: DiffStatus }) {
  const { t } = useTranslation('admin')

  if (status === 'unchanged') {
    return null
  }

  const Icon = getDiffIcon(status)

  return (
    <AdminStatusBadge tone={getDiffTone(status)}>
      <Icon className="h-3.5 w-3.5" />
      {t(`pendingCourseDetail.diff.status.${status}`)}
    </AdminStatusBadge>
  )
}

function FieldChangeRow({ change }: { change: FieldChange }) {
  const theme = useAdminTheme()

  return (
    <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-start sm:gap-2">
      <span className="min-w-[120px] shrink-0 font-semibold" style={{ color: theme.textMuted }}>
        {getFieldLabel(change.field)}:
      </span>
      <span className="line-through" style={{ color: theme.danger }}>
        {truncateFieldValue(change.oldValue)}
      </span>
      <span style={{ color: theme.textSubtle }}>-&gt;</span>
      <span className="font-semibold" style={{ color: theme.action }}>
        {truncateFieldValue(change.newValue)}
      </span>
    </div>
  )
}

function ChangesPanel({
  changes,
  title,
}: {
  changes: FieldChange[]
  title: string
}) {
  const theme = useAdminTheme()

  if (changes.length === 0) {
    return null
  }

  return (
    <div
      className="rounded-2xl border p-3"
      style={{ backgroundColor: theme.warningSurface, borderColor: theme.border }}
    >
      <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: theme.warning }}>
        {title}
      </p>
      <div className="space-y-1">
        {changes.map((change) => (
          <FieldChangeRow key={change.field} change={change} />
        ))}
      </div>
    </div>
  )
}

function DiffLessonItem({ diffLesson }: { diffLesson: DiffLesson }) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const tone = getDiffTone(diffLesson.status)
  const isRemoved = diffLesson.status === 'removed'
  const displayLesson = diffLesson.proposed ?? diffLesson.original
  const Icon = getDiffIcon(diffLesson.status)

  if (!displayLesson) {
    return null
  }

  return (
    <div className="border-b last:border-0" style={{ borderColor: theme.divider, opacity: isRemoved ? 0.68 : 1 }}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 p-4 text-left transition hover:opacity-85"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: tone === 'danger'
              ? theme.dangerSurface
              : tone === 'success'
                ? theme.successSurface
                : tone === 'warning'
                  ? theme.warningSurface
                  : theme.actionSurface,
            color: tone === 'danger'
              ? theme.danger
              : tone === 'success'
                ? theme.success
                : tone === 'warning'
                  ? theme.warning
                  : theme.action,
          }}
        >
          {diffLesson.status === 'unchanged' ? <PlayCircleIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="break-words font-semibold" style={{ color: isRemoved ? theme.textMuted : theme.text }}>
            {diffLesson.lesson_title}
          </h4>
          {diffLesson.original_title ? (
            <p className="text-xs italic" style={{ color: theme.textSubtle }}>
              {t('pendingCourseDetail.diff.before', { value: diffLesson.original_title })}
            </p>
          ) : null}
          <p className="text-xs" style={{ color: theme.textMuted }}>
            {t('pendingCourseDetail.diff.lessonMeta', {
              duration: displayLesson.duration_seconds ?? 0,
              provider: displayLesson.video_provider ?? t('pendingCourseDetail.diff.noProvider'),
            })}
          </p>
        </div>
        <DiffBadge status={diffLesson.status} />
      </button>

      {isExpanded && !isRemoved ? (
        <div className="space-y-4 border-t p-4" style={{ borderColor: theme.divider, backgroundColor: theme.surfaceSubtle }}>
          <ChangesPanel
            changes={diffLesson.changes}
            title={t('pendingCourseDetail.diff.lessonChanges')}
          />
          <AdminPendingCourseLessonDetails lesson={displayLesson as never} />
        </div>
      ) : null}
    </div>
  )
}

function DiffModuleItem({ diffModule }: { diffModule: DiffModule }) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const isRemoved = diffModule.status === 'removed'
  const tone = getDiffTone(diffModule.status)
  const borderColor = tone === 'danger'
    ? theme.danger
    : tone === 'success'
      ? theme.success
      : tone === 'warning'
        ? theme.warning
        : theme.border

  return (
    <AdminSurface
      className="overflow-hidden border-l-4"
      style={{ borderLeftColor: borderColor, opacity: isRemoved ? 0.72 : 1 }}
    >
      <div
        className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between"
        style={{ backgroundColor: theme.surfaceSubtle, borderColor: theme.divider }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <h3 className="break-words font-bold" style={{ color: isRemoved ? theme.textMuted : theme.text }}>
            {diffModule.module_title}
          </h3>
          <DiffBadge status={diffModule.status} />
        </div>
        {diffModule.original_title ? (
          <span className="text-xs italic" style={{ color: theme.textSubtle }}>
            {t('pendingCourseDetail.diff.before', { value: diffModule.original_title })}
          </span>
        ) : null}
      </div>

      <div className="px-5 py-3">
        <ChangesPanel
          changes={diffModule.changes}
          title={t('pendingCourseDetail.diff.moduleChanges')}
        />
      </div>

      <div>
        {diffModule.lessons.map((lesson, index) => (
          <DiffLessonItem key={`diff-lesson-${index}`} diffLesson={lesson} />
        ))}
      </div>
    </AdminSurface>
  )
}

interface AdminPendingCourseDiffProps {
  diff: CourseDiff
  showDiffView: boolean
  onToggle: () => void
}

export function AdminPendingCourseDiff({
  diff,
  onToggle,
  showDiffView,
}: AdminPendingCourseDiffProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const totalChanges =
    diff.summary.modulesAdded +
    diff.summary.modulesRemoved +
    diff.summary.modulesModified +
    diff.summary.lessonsAdded +
    diff.summary.lessonsRemoved +
    diff.summary.lessonsModified

  const summaryItems = [
    { count: diff.summary.modulesAdded, icon: PlusCircleIcon, key: 'modulesAdded', tone: 'success' as const },
    { count: diff.summary.modulesRemoved, icon: MinusCircleIcon, key: 'modulesRemoved', tone: 'danger' as const },
    { count: diff.summary.modulesModified, icon: ArrowsRightLeftIcon, key: 'modulesModified', tone: 'warning' as const },
    { count: diff.summary.lessonsAdded, icon: PlusCircleIcon, key: 'lessonsAdded', tone: 'success' as const },
    { count: diff.summary.lessonsRemoved, icon: MinusCircleIcon, key: 'lessonsRemoved', tone: 'danger' as const },
    { count: diff.summary.lessonsModified, icon: ArrowsRightLeftIcon, key: 'lessonsModified', tone: 'warning' as const },
  ].filter((item) => item.count > 0)

  return (
    <>
      <AdminSurface className="mb-6 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest" style={{ color: theme.text }}>
              <ArrowsRightLeftIcon className="h-5 w-5" />
              {t('pendingCourseDetail.diff.summaryTitle', { count: totalChanges })}
            </h3>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              {t('pendingCourseDetail.diff.summaryDescription')}
            </p>
          </div>
          <AdminButton
            onClick={onToggle}
            icon={showDiffView ? EyeSlashIcon : EyeIcon}
            variant="secondary"
          >
            {showDiffView ? t('pendingCourseDetail.diff.showFinal') : t('pendingCourseDetail.diff.showDiff')}
          </AdminButton>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {summaryItems.length > 0 ? (
            summaryItems.map(({ count, icon: Icon, key, tone }) => (
              <AdminStatusBadge key={key} tone={tone}>
                <Icon className="h-3.5 w-3.5" />
                {t(`pendingCourseDetail.diff.summary.${key}`, { count })}
              </AdminStatusBadge>
            ))
          ) : (
            <span className="text-sm" style={{ color: theme.textMuted }}>
              {t('pendingCourseDetail.diff.noStructuralChanges')}
            </span>
          )}
        </div>
      </AdminSurface>

      {showDiffView && diff.courseChanges.length > 0 ? (
        <AdminSurface className="mb-6 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest" style={{ color: theme.text }}>
            <ArrowsRightLeftIcon className="h-4 w-4" />
            {t('pendingCourseDetail.diff.courseChanges')}
          </h3>
          <ChangesPanel
            changes={diff.courseChanges}
            title={t('pendingCourseDetail.diff.generalDataChanges')}
          />
        </AdminSurface>
      ) : null}

      <div className="mb-8 space-y-4">
        {showDiffView
          ? diff.modules.map((module, index) => (
              <DiffModuleItem key={`diff-module-${index}`} diffModule={module} />
            ))
          : null}
      </div>
    </>
  )
}
