'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Sparkles, Trash2, Route } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  Course,
  AssignedCourse,
  UserAssignment,
  OrganizationLearningPathAssignment,
  UserLearningPathAssignment,
  UnifiedOrgItem,
  UnifiedUserItem,
} from './courses-section.types'
import { colors } from './courses-section.types'
import type { ContentDefaultTarget } from './ContentDefaultModal'

// Shared style tokens (dual light/dark, consistent with the admin panel)
const CARD_SURFACE = 'border-gray-200 bg-white dark:border-white/5 dark:bg-carbon-900'
const DIVIDER = 'border-gray-100 dark:border-white/5'
const TITLE_TEXT = 'text-gray-900 dark:text-white'
const MUTED_TEXT = 'text-gray-500 dark:text-white/60'

// ---- Course Card for Org tab ----
function CourseCard({ course, date, onRemove }: { course: Course; date: string; onRemove: () => void }) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [pendingRevoke, setPendingRevoke] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative rounded-[2rem] overflow-hidden border transition-all hover:shadow-2xl hover:shadow-accent/5 flex flex-col h-full ${CARD_SURFACE}`}
    >
      <div className="aspect-video relative overflow-hidden bg-gray-900/80">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} className="w-full h-full object-cover grayscale-[0.2] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20"><BookOpen className="w-10 h-10 text-white" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 right-4 flex gap-2">
          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-md text-white border border-white/10">{course.level}</span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: colors.accent }}>{course.category}</p>
        <h5 className={`text-base font-bold leading-tight line-clamp-2 mb-4 ${TITLE_TEXT}`}>{course.title}</h5>

        <div className={`mt-auto space-y-4 pt-4 border-t ${DIVIDER}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={`w-3.5 h-3.5 ${MUTED_TEXT}`} />
              <span className={`text-[11px] font-medium ${MUTED_TEXT}`}>{t('coursesSection.acquired')} {new Date(date).toLocaleDateString()}</span>
            </div>
          </div>
          {pendingRevoke ? (
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-xs text-red-500 dark:text-red-400 mb-2">{t('coursesSection.confirmRevokeOrg')}</p>
              <div className="flex gap-2">
                <button onClick={() => setPendingRevoke(false)} className="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 transition-all">{tc('actions.cancel')}</button>
                <button onClick={() => { setPendingRevoke(false); onRemove() }} className="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-500/30 transition-all">{tc('actions.confirm')}</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setPendingRevoke(true)}
              className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all opacity-60 hover:opacity-100"
            >
              {t('coursesSection.revoke')}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ---- Org Courses Grid ----
interface OrgCoursesGridProps {
  activeHierarchy: AssignedCourse[]
  onRemove: (courseId: string) => void
}

export function OrgCoursesGrid({ activeHierarchy, onRemove }: OrgCoursesGridProps) {
  const { t } = useTranslation('admin')
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activeHierarchy.length === 0 ? (
        <div className="col-span-full py-20 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center border-gray-200 dark:border-white/10">
          <BookOpen className="w-12 h-12 mb-4 text-gray-300 dark:text-white/10" />
          <p className={`text-sm text-center px-10 ${MUTED_TEXT}`}>{t('coursesSection.noOrgCourses')}</p>
        </div>
      ) : (
        activeHierarchy.map(ah => (
          <CourseCard key={ah.id} course={ah.courses} date={ah.assigned_at} onRemove={() => onRemove(ah.course_id)} />
        ))
      )}
    </div>
  )
}

interface OrgLearningPathsGridProps {
  assignments: OrganizationLearningPathAssignment[]
  onRemove: (assignmentId: string) => void
}

export function OrgLearningPathsGrid({ assignments, onRemove }: OrgLearningPathsGridProps) {
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null)
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {assignments.length === 0 ? (
        <div className="col-span-full py-16 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center border-gray-200 dark:border-white/10">
          <Route className="w-12 h-12 mb-4 text-gray-300 dark:text-white/10" />
          <p className={`text-sm text-center px-10 ${MUTED_TEXT}`}>
            {t('coursesSection.noOrgLearningPaths')}
          </p>
        </div>
      ) : (
        assignments.map(assignment => (
          <motion.div
            key={assignment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-[2rem] border p-6 flex flex-col ${CARD_SURFACE}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: colors.accent }}>{t('coursesSection.learningPath')}</p>
                <h5 className={`text-lg font-bold ${TITLE_TEXT}`}>
                  {assignment.learning_path?.title || t('coursesSection.untitledPath')}
                </h5>
                <p className={`text-sm mt-2 ${MUTED_TEXT}`}>
                  {assignment.learning_path?.description || t('coursesSection.noDescription')}
                </p>
              </div>
              <Route className="w-5 h-5" style={{ color: colors.accent }} />
            </div>

            <div className={`mt-6 pt-6 border-t flex items-center justify-between ${DIVIDER}`}>
              <div className={`text-[11px] ${MUTED_TEXT}`}>
                {t('coursesSection.workshopsCount', { count: assignment.learning_path?.item_count || 0 })} · {t('coursesSection.assignedOn', { date: new Date(assignment.assigned_at).toLocaleDateString() })}
              </div>
              {pendingRevokeId === assignment.id ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPendingRevokeId(null)}
                    className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/5 transition-all"
                  >
                    {tc('actions.cancel')}
                  </button>
                  <button
                    onClick={() => { setPendingRevokeId(null); onRemove(assignment.id) }}
                    className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
                  >
                    {tc('actions.confirm')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPendingRevokeId(assignment.id)}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
                >
                  {t('coursesSection.revokePath')}
                </button>
              )}
            </div>
          </motion.div>
        ))
      )}
    </div>
  )
}

// ---- User Assignments Table ----
interface UserAssignmentsTableProps {
  activeUserAssignments: UserAssignment[]
  onRemove: (assignmentId: string) => void
}

export function UserAssignmentsTable({ activeUserAssignments, onRemove }: UserAssignmentsTableProps) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null)

  return (
    <div className={`overflow-hidden rounded-3xl border ${CARD_SURFACE}`}>
      <table className="w-full text-left">
        <thead className="bg-gray-50 dark:bg-white/[0.02]">
          <tr>
            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider ${MUTED_TEXT}`}>{t('coursesSection.user')}</th>
            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider ${MUTED_TEXT}`}>{t('coursesSection.course')}</th>
            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-center ${MUTED_TEXT}`}>{t('coursesSection.progress')}</th>
            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-right ${MUTED_TEXT}`}>{t('coursesSection.actionsHeader')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
          {activeUserAssignments.length === 0 ? (
            <tr>
              <td colSpan={4} className={`px-6 py-20 text-center text-sm ${MUTED_TEXT}`}>{t('coursesSection.noUserAssignments')}</td>
            </tr>
          ) : (
            activeUserAssignments.map(ua => (
              <tr key={ua.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold ${TITLE_TEXT}`}>
                      {ua.users.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${TITLE_TEXT}`}>{ua.users.display_name || `${ua.users.first_name || ''} ${ua.users.last_name || ''}`.trim()}</p>
                      <p className={`text-[10px] ${MUTED_TEXT}`}>{ua.users.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className={`text-sm line-clamp-1 ${TITLE_TEXT}`}>{ua.courses.title}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                    <div className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${ua.completion_percentage}%`, backgroundColor: colors.accent }} />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: colors.accent }}>{ua.completion_percentage}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {pendingRevokeId === ua.id ? (
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs text-red-500 dark:text-red-400 mr-1">{t('coursesSection.confirmRevokeUser')}</span>
                      <button onClick={() => setPendingRevokeId(null)} className="px-2 py-1 text-xs border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 rounded transition-colors">{tc('actions.cancel')}</button>
                      <button onClick={() => { setPendingRevokeId(null); onRemove(ua.id) }} className="px-2 py-1 text-xs bg-red-500/20 text-red-500 dark:text-red-400 rounded hover:bg-red-500/30 transition-colors">{tc('actions.confirm')}</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPendingRevokeId(ua.id)}
                      className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 dark:text-red-400 opacity-60 hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ---- Unified Org Grid ----

function SetDefaultButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 border border-primary/30 text-primary hover:bg-primary/5 dark:border-accent/30 dark:text-accent dark:hover:bg-accent/10 transition-all"
    >
      <Sparkles className="w-3 h-3" />
      Poner por defecto
    </button>
  )
}

function UnifiedOrgCard({
  item,
  onRemoveCourse,
  onRemovePath,
  onSetDefault,
}: {
  item: UnifiedOrgItem
  onRemoveCourse: (courseId: string) => void
  onRemovePath: (assignmentId: string) => void
  onSetDefault?: (target: ContentDefaultTarget) => void
}) {
  const [pendingRevoke, setPendingRevoke] = useState(false)
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  if (item.kind === 'course') {
    const { data } = item
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`group relative rounded-[2rem] overflow-hidden border transition-all hover:shadow-2xl hover:shadow-accent/5 flex flex-col h-full ${CARD_SURFACE}`}
      >
        <div className="aspect-video relative overflow-hidden bg-gray-900/80">
          {data.courses.thumbnail_url ? (
            <img src={data.courses.thumbnail_url} className="w-full h-full object-cover grayscale-[0.2] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20"><BookOpen className="w-10 h-10 text-white" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-4 left-4">
            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10"
              style={{ color: colors.accent }}>
              <BookOpen className="w-2.5 h-2.5" />
              Curso
            </span>
          </div>
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-md text-white border border-white/10">{data.courses.level}</span>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: colors.accent }}>{data.courses.category}</p>
          <h5 className={`text-base font-bold leading-tight line-clamp-2 mb-4 ${TITLE_TEXT}`}>{data.courses.title}</h5>

          <div className={`mt-auto space-y-4 pt-4 border-t ${DIVIDER}`}>
            <div className="flex items-center gap-2">
              <Clock className={`w-3.5 h-3.5 ${MUTED_TEXT}`} />
              <span className={`text-[11px] font-medium ${MUTED_TEXT}`}>
                {t('coursesSection.acquired')} {new Date(data.assigned_at).toLocaleDateString()}
              </span>
            </div>
            {onSetDefault && !pendingRevoke && (
              <SetDefaultButton onClick={() => onSetDefault({ kind: 'course', id: data.course_id, title: data.courses.title })} />
            )}
            {pendingRevoke ? (
              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-xs text-red-500 dark:text-red-400 mb-2">{t('coursesSection.confirmRevokeOrg')}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPendingRevoke(false)} className="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 transition-all">{tc('actions.cancel')}</button>
                  <button onClick={() => { setPendingRevoke(false); onRemoveCourse(data.course_id) }} className="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-500/30 transition-all">{tc('actions.confirm')}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setPendingRevoke(true)} className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all opacity-60 hover:opacity-100">
                {t('coursesSection.revoke')}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  // LP card — gradient header replaces thumbnail
  const { data } = item
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative rounded-[2rem] overflow-hidden border transition-all hover:shadow-2xl flex flex-col h-full ${CARD_SURFACE}`}
    >
      <div
        className="aspect-video relative flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${colors.purple} 45%, var(--color-primary)), color-mix(in srgb, ${colors.accent} 25%, var(--color-primary)))` }}
      >
        <Route className="w-14 h-14 opacity-30 transition-all duration-700 group-hover:scale-110 group-hover:opacity-50 text-white" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute top-4 left-4">
          <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 bg-black/50 backdrop-blur-md border border-white/10 text-white">
            <Route className="w-2.5 h-2.5" />
            Ruta
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-md text-white border border-white/10">
            {data.learning_path?.item_count || 0} módulos
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: colors.purple }}>
          Ruta de Aprendizaje
        </p>
        <h5 className={`text-base font-bold leading-tight line-clamp-2 mb-2 ${TITLE_TEXT}`}>
          {data.learning_path?.title || t('coursesSection.untitledPath')}
        </h5>
        {data.learning_path?.description && (
          <p className={`text-sm line-clamp-2 mb-2 ${MUTED_TEXT}`}>
            {data.learning_path.description}
          </p>
        )}

        <div className={`mt-auto space-y-4 pt-4 border-t ${DIVIDER}`}>
          <div className="flex items-center gap-2">
            <Clock className={`w-3.5 h-3.5 ${MUTED_TEXT}`} />
            <span className={`text-[11px] font-medium ${MUTED_TEXT}`}>
              {t('coursesSection.assignedOn', { date: new Date(data.assigned_at).toLocaleDateString() })}
            </span>
          </div>
          {onSetDefault && !pendingRevoke && (
            <SetDefaultButton onClick={() => onSetDefault({ kind: 'path', id: data.learning_path_id, title: data.learning_path?.title || t('coursesSection.untitledPath') })} />
          )}
          {pendingRevoke ? (
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-xs text-red-500 dark:text-red-400 mb-2">{t('coursesSection.confirmRevokeOrg')}</p>
              <div className="flex gap-2">
                <button onClick={() => setPendingRevoke(false)} className="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 transition-all">{tc('actions.cancel')}</button>
                <button onClick={() => { setPendingRevoke(false); onRemovePath(data.id) }} className="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-500/30 transition-all">{tc('actions.confirm')}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setPendingRevoke(true)} className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all opacity-60 hover:opacity-100">
              {t('coursesSection.revokePath')}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface UnifiedOrgGridProps {
  items: UnifiedOrgItem[]
  onRemoveCourse: (courseId: string) => void
  onRemovePath: (assignmentId: string) => void
  onSetDefault?: (target: ContentDefaultTarget) => void
}

export function UnifiedOrgGrid({ items, onRemoveCourse, onRemovePath, onSetDefault }: UnifiedOrgGridProps) {
  const { t } = useTranslation('admin')
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.length === 0 ? (
        <div className="col-span-full py-20 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center border-gray-200 dark:border-white/10">
          <div className="flex gap-4 mb-4 text-gray-300 dark:text-white/10">
            <BookOpen className="w-8 h-8" />
            <Route className="w-8 h-8" />
          </div>
          <p className={`text-sm text-center px-10 ${MUTED_TEXT}`}>
            {t('coursesSection.noOrgCourses')}
          </p>
        </div>
      ) : (
        items.map(item => (
          <UnifiedOrgCard
            key={item.kind === 'course' ? `course-${item.data.id}` : `path-${item.data.id}`}
            item={item}
            onRemoveCourse={onRemoveCourse}
            onRemovePath={onRemovePath}
            onSetDefault={onSetDefault}
          />
        ))
      )}
    </div>
  )
}

// ---- Unified User Assignments Table ----

interface UnifiedUserAssignmentsTableProps {
  items: UnifiedUserItem[]
  onRemoveCourse: (assignmentId: string) => void
}

export function UnifiedUserAssignmentsTable({ items, onRemoveCourse }: UnifiedUserAssignmentsTableProps) {
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null)
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  return (
    <div className={`overflow-hidden rounded-3xl border ${CARD_SURFACE}`}>
      <table className="w-full text-left">
        <thead className="bg-gray-50 dark:bg-white/[0.02]">
          <tr>
            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider ${MUTED_TEXT}`}>{t('coursesSection.user')}</th>
            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider ${MUTED_TEXT}`}>Contenido</th>
            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider ${MUTED_TEXT}`}>Tipo</th>
            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-center ${MUTED_TEXT}`}>{t('coursesSection.progress')}</th>
            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-right ${MUTED_TEXT}`}>{t('coursesSection.actionsHeader')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className={`px-6 py-20 text-center text-sm ${MUTED_TEXT}`}>
                {t('coursesSection.noUserAssignments')}
              </td>
            </tr>
          ) : (
            items.map(item => {
              const id = item.data.id
              const user = item.kind === 'course' ? item.data.users : item.data.user
              const title = item.kind === 'course'
                ? item.data.courses.title
                : (item.data.learning_path?.title || t('coursesSection.untitledPath'))

              return (
                <tr key={`${item.kind}-${id}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold ${TITLE_TEXT}`}>
                        {(user?.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${TITLE_TEXT}`}>
                          {user?.display_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || '—'}
                        </p>
                        <p className={`text-[10px] ${MUTED_TEXT}`}>{user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm line-clamp-1 ${TITLE_TEXT}`}>{title}</p>
                    {item.kind === 'path' && (
                      <p className={`text-[10px] ${MUTED_TEXT}`}>
                        {t('coursesSection.workshopsCount', { count: item.data.learning_path?.item_count || 0 })}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {item.kind === 'course' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                        style={{ backgroundColor: `color-mix(in srgb, ${colors.accent} 12%, transparent)`, color: colors.accent, borderColor: `color-mix(in srgb, ${colors.accent} 25%, transparent)` }}>
                        <BookOpen className="w-2.5 h-2.5" />
                        Curso
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                        style={{ backgroundColor: `color-mix(in srgb, ${colors.purple} 12%, transparent)`, color: colors.purple, borderColor: `color-mix(in srgb, ${colors.purple} 25%, transparent)` }}>
                        <Route className="w-2.5 h-2.5" />
                        Ruta
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                      {item.kind === 'course' ? (
                        <>
                          <div className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full" style={{ width: `${item.data.completion_percentage}%`, backgroundColor: colors.accent }} />
                          </div>
                          <span className="text-[10px] font-bold" style={{ color: colors.accent }}>{item.data.completion_percentage}%</span>
                        </>
                      ) : (
                        <span className={`text-[10px] font-semibold ${MUTED_TEXT}`}>—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item.kind === 'course' ? (
                      pendingRevokeId === id ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-red-500 dark:text-red-400 mr-1">{t('coursesSection.confirmRevokeUser')}</span>
                          <button onClick={() => setPendingRevokeId(null)} className="px-2 py-1 text-xs border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 rounded transition-colors">{tc('actions.cancel')}</button>
                          <button onClick={() => { setPendingRevokeId(null); onRemoveCourse(id) }} className="px-2 py-1 text-xs bg-red-500/20 text-red-500 dark:text-red-400 rounded hover:bg-red-500/30 transition-colors">{tc('actions.confirm')}</button>
                        </div>
                      ) : (
                        <button onClick={() => setPendingRevokeId(id)} className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 dark:text-red-400 opacity-60 hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    ) : (
                      <span className={`text-xs font-semibold ${MUTED_TEXT}`}>
                        {t('coursesSection.learningPathAssignmentsManagedByCompany', 'Gestionado por empresa')}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

interface UserLearningPathAssignmentsTableProps {
  assignments: UserLearningPathAssignment[]
  onRemove?: (assignmentId: string) => void
}

export function UserLearningPathAssignmentsTable({
  assignments,
  onRemove,
}: UserLearningPathAssignmentsTableProps) {
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null)
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  return (
    <div className={`overflow-hidden rounded-3xl border ${CARD_SURFACE}`}>
      <table className="w-full text-left">
        <thead className="bg-gray-50 dark:bg-white/[0.02]">
          <tr>
            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider ${MUTED_TEXT}`}>{t('coursesSection.user')}</th>
            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider ${MUTED_TEXT}`}>{t('coursesSection.learningPath')}</th>
            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-right ${MUTED_TEXT}`}>{t('coursesSection.actionsHeader')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
          {assignments.length === 0 ? (
            <tr>
              <td colSpan={3} className={`px-6 py-16 text-center text-sm ${MUTED_TEXT}`}>
                {t('coursesSection.noUserLearningPaths')}
              </td>
            </tr>
          ) : (
            assignments.map(assignment => (
              <tr key={assignment.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold ${TITLE_TEXT}`}>
                      {(assignment.user?.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${TITLE_TEXT}`}>
                        {assignment.user?.display_name || `${assignment.user?.first_name || ''} ${assignment.user?.last_name || ''}`.trim()}
                      </p>
                      <p className={`text-[10px] ${MUTED_TEXT}`}>{assignment.user?.email || 'Sin email'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className={`text-sm line-clamp-1 ${TITLE_TEXT}`}>
                    {assignment.learning_path?.title || t('coursesSection.untitledPath')}
                  </p>
                  <p className={`text-[10px] ${MUTED_TEXT}`}>
                    {t('coursesSection.workshopsCount', { count: assignment.learning_path?.item_count || 0 })}
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  {onRemove && pendingRevokeId === assignment.id ? (
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setPendingRevokeId(null)} className="px-2 py-1 text-xs border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 rounded transition-colors">{tc('actions.cancel')}</button>
                      <button onClick={() => { setPendingRevokeId(null); onRemove(assignment.id) }} className="px-2 py-1 text-xs bg-red-500/20 text-red-500 dark:text-red-400 rounded hover:bg-red-500/30 transition-colors">{tc('actions.confirm')}</button>
                    </div>
                  ) : onRemove ? (
                    <button
                      onClick={() => setPendingRevokeId(assignment.id)}
                      className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 dark:text-red-400 opacity-60 hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className={`text-xs font-semibold ${MUTED_TEXT}`}>
                      {t('coursesSection.learningPathAssignmentsManagedByCompany', 'Gestionado por empresa')}
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
