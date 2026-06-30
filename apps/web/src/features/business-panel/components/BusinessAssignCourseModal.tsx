'use client';

import { Building2, GitBranch, Search, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next';
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme';
import {
  BusinessAssignCourseConfig,
  BusinessAssignCourseError,
  BusinessAssignCourseFooter,
  BusinessAssignCourseFrame,
  BusinessAssignCourseHeader,
  BusinessAssignCourseUsersGrid,
  type BusinessAssignCourseModalProps,
  type BusinessAssignCourseModalState,
  useBusinessAssignCourseModal,
} from './business-assign-course-modal';
import type { AssignmentMode } from './business-assign-course-modal/types'
import type { BusinessLearningPathHierarchyNode } from '../services/businessLearningPaths.service'

export function BusinessAssignCourseModal({
  courseId,
  courseTitle,
  isOpen,
  onAssignComplete,
  onClose,
  orgSlug,
}: BusinessAssignCourseModalProps) {
  const { t } = useTranslation('business');
  const theme = useBusinessPanelTheme();
  const modal = useBusinessAssignCourseModal({
    courseId,
    courseTitle,
    isOpen,
    onAssignComplete,
    onClose,
    orgSlug,
    t,
  });

  if (!isOpen) return null;

  return (
    <BusinessAssignCourseFrame modal={modal} theme={theme}>
      <BusinessAssignCourseHeader courseTitle={courseTitle} modal={modal} t={t} theme={theme} />

      <div className="grid flex-1 min-h-0 overflow-hidden lg:grid-cols-[1.4fr,0.85fr]">

        {/* ── Left panel: mode selector + content ── */}
        <div className="flex min-h-0 flex-col border-r" style={{ borderColor: theme.borderColor }}>

          {/* Controls: mode tabs + mode-specific controls */}
          <div className="shrink-0 border-b px-6 py-5 sm:px-8 space-y-4" style={{ borderColor: theme.borderColor }}>
            <BusinessAssignCourseError modal={modal} theme={theme} />
            <CourseModeSelector
              assignmentMode={modal.assignmentMode}
              setAssignmentMode={modal.setAssignmentMode}
              t={t}
              theme={theme}
            />
            {modal.assignmentMode === 'users' && (
              <CourseUserControls modal={modal} t={t} theme={theme} />
            )}
            {modal.assignmentMode === 'all' && (
              <AllUsersHint activeUserCount={modal.activeUserCount} theme={theme} />
            )}
            {modal.assignmentMode === 'node' && (
              <CourseNodeControls
                hierarchyNodes={modal.hierarchyNodes}
                selectedNodeIds={modal.selectedNodeIds}
                includeDescendants={modal.includeDescendants}
                handleToggleNode={modal.handleToggleNode}
                setIncludeDescendants={modal.setIncludeDescendants}
                t={t}
                theme={theme}
              />
            )}
          </div>

          {/* Body: user grid (users mode) or bulk-mode preview */}
          <div
            className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8"
            style={{ scrollbarWidth: 'thin', scrollbarColor: `${theme.borderColor} transparent` }}
          >
            {modal.assignmentMode === 'users' ? (
              <BusinessAssignCourseUsersGrid modal={modal} t={t} theme={theme} />
            ) : (
              <BulkModePreview
                assignmentMode={modal.assignmentMode}
                activeUserCount={modal.activeUserCount}
                selectedNodeCount={modal.selectedNodeIds.size}
                theme={theme}
                t={t}
              />
            )}
          </div>
        </div>

        {/* ── Right panel: course summary + date config ── */}
        <div
          className="hidden lg:flex flex-col min-h-0 overflow-y-auto px-6 py-5 sm:px-8 gap-6"
          style={{ scrollbarWidth: 'thin', scrollbarColor: `${theme.borderColor} transparent` }}
        >
          <CourseSummaryCard
            courseTitle={courseTitle}
            alreadyAssignedCount={modal.alreadyAssignedUserIds.size}
            theme={theme}
            t={t}
          />
          <BusinessAssignCourseConfig modal={modal} t={t} theme={theme} />
        </div>
      </div>

      <BusinessAssignCourseFooter modal={modal} t={t} theme={theme} />
    </BusinessAssignCourseFrame>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

type Theme = ReturnType<typeof useBusinessPanelTheme>
type T = ReturnType<typeof useTranslation<'business'>>['t']

function CourseModeSelector({
  assignmentMode,
  setAssignmentMode,
  t,
  theme,
}: {
  assignmentMode: AssignmentMode
  setAssignmentMode: (mode: AssignmentMode) => void
  t: T
  theme: Theme
}) {
  const items: Array<{ mode: AssignmentMode; icon: typeof Users; label: string }> = [
    { mode: 'users', icon: Users, label: t('assignLearningPath.modes.users', { defaultValue: 'Usuarios' }) },
    { mode: 'all', icon: Building2, label: t('assignLearningPath.modes.all', { defaultValue: 'Todos' }) },
    { mode: 'node', icon: GitBranch, label: t('assignLearningPath.modes.node', { defaultValue: 'Estructura' }) },
  ]
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {items.map(({ mode, icon: Icon, label }) => {
        const isActive = assignmentMode === mode
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setAssignmentMode(mode)}
            className="flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-wider transition-all"
            style={{
              backgroundColor: isActive ? theme.actionSurface : theme.inputBg,
              borderColor: isActive ? theme.primaryColor : theme.borderColor,
              color: theme.textColor,
            }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

function CourseUserControls({
  modal,
  t,
  theme,
}: {
  modal: BusinessAssignCourseModalState
  t: T
  theme: Theme
}) {
  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.mutedTextColor }} />
          <input
            value={modal.searchTerm}
            onChange={(e) => modal.setSearchTerm(e.target.value)}
            placeholder={t('assignCourse.search.placeholder', { defaultValue: 'Buscar por nombre o email...' })}
            className="w-full rounded-2xl border py-3 pl-11 pr-4 text-sm outline-none transition"
            style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
          />
        </div>
        <button
          type="button"
          onClick={modal.handleSelectAllUsers}
          disabled={modal.availableUserCount === 0}
          className="rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: modal.allUsersSelected ? theme.actionSurface : theme.inputBg,
            borderColor: modal.allUsersSelected ? theme.primaryColor : theme.borderColor,
            color: theme.textColor,
          }}
        >
          {modal.allUsersSelected
            ? t('assignLearningPath.clearSelection', { defaultValue: 'Limpiar selección' })
            : t('assignLearningPath.selectAll', { defaultValue: 'Seleccionar todos' })}
        </button>
      </div>
      <div className="flex flex-wrap gap-3 text-xs" style={{ color: theme.subtextColor }}>
        <span>{t('assignCourse.selected', { defaultValue: '{{count}} seleccionados', count: modal.selectedUserCount })}</span>
        <span>{t('assignCourse.available', { defaultValue: '{{count}} disponibles', count: modal.availableUserCount })}</span>
      </div>
    </>
  )
}

function AllUsersHint({ activeUserCount, theme }: { activeUserCount: number; theme: Theme }) {
  return (
    <div
      className="rounded-2xl border px-4 py-3 text-sm"
      style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.subtextColor }}
    >
      Se asignará el curso a todos los <strong style={{ color: theme.textColor }}>{activeUserCount}</strong> usuarios activos de la empresa.
    </div>
  )
}

function CourseNodeControls({
  hierarchyNodes,
  selectedNodeIds,
  includeDescendants,
  handleToggleNode,
  setIncludeDescendants,
  t,
  theme,
}: {
  hierarchyNodes: BusinessLearningPathHierarchyNode[]
  selectedNodeIds: Set<string>
  includeDescendants: boolean
  handleToggleNode: (nodeId: string) => void
  setIncludeDescendants: (v: boolean) => void
  t: T
  theme: Theme
}) {
  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center gap-3 text-sm select-none" style={{ color: theme.subtextColor }}>
        <input
          type="checkbox"
          checked={includeDescendants}
          onChange={(e) => setIncludeDescendants(e.target.checked)}
          className="rounded"
        />
        {t('assignLearningPath.includeDescendants', { defaultValue: 'Incluir subnodos (descendientes)' })}
      </label>
      <div
        className="grid max-h-48 gap-2 overflow-y-auto rounded-2xl border p-3"
        style={{ borderColor: theme.borderColor, scrollbarWidth: 'thin', scrollbarColor: `${theme.borderColor} transparent` }}
      >
        {hierarchyNodes.length === 0 ? (
          <p className="px-2 py-3 text-sm" style={{ color: theme.subtextColor }}>
            {t('assignLearningPath.noNodes', { defaultValue: 'No hay nodos de estructura disponibles.' })}
          </p>
        ) : (
          hierarchyNodes.map((node) => (
            <NodeButton
              key={node.id}
              node={node}
              isSelected={selectedNodeIds.has(node.id)}
              handleToggleNode={handleToggleNode}
              theme={theme}
            />
          ))
        )}
      </div>
    </div>
  )
}

function NodeButton({
  node,
  isSelected,
  handleToggleNode,
  theme,
}: {
  node: BusinessLearningPathHierarchyNode
  isSelected: boolean
  handleToggleNode: (nodeId: string) => void
  theme: Theme
}) {
  return (
    <button
      type="button"
      onClick={() => handleToggleNode(node.id)}
      className="flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-all"
      style={{
        marginLeft: node.depth * 12,
        backgroundColor: isSelected ? theme.actionSurface : theme.cardBg,
        borderColor: isSelected ? theme.primaryColor : theme.borderColor,
        color: theme.textColor,
      }}
    >
      <span className="truncate">{node.name}</span>
      <span className="ml-2 shrink-0 text-[10px] uppercase" style={{ color: theme.subtextColor }}>{node.type}</span>
    </button>
  )
}

function BulkModePreview({
  assignmentMode,
  activeUserCount,
  selectedNodeCount,
  theme,
  t,
}: {
  assignmentMode: AssignmentMode
  activeUserCount: number
  selectedNodeCount: number
  theme: Theme
  t: T
}) {
  const text =
    assignmentMode === 'all'
      ? t('assignLearningPath.bulkPreviewAll', { defaultValue: 'Se asignará a {{count}} usuarios activos de la empresa.', count: activeUserCount })
      : t('assignLearningPath.bulkPreviewNode', { defaultValue: '{{count}} nodo(s) seleccionado(s). El curso se asignará a todos sus miembros activos.', count: selectedNodeCount })

  return (
    <div
      className="rounded-3xl border border-dashed px-6 py-12 text-center text-sm"
      style={{ borderColor: theme.borderColor, color: theme.subtextColor }}
    >
      {text}
    </div>
  )
}

function CourseSummaryCard({
  courseTitle,
  alreadyAssignedCount,
  theme,
  t,
}: {
  courseTitle: string
  alreadyAssignedCount: number
  theme: Theme
  t: T
}) {
  return (
    <div className="rounded-[1.75rem] border p-5" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: theme.actionSurface, color: theme.primaryColor }}
        >
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: theme.accentColor }}>
            {t('assignCourse.summary.title', { defaultValue: 'Resumen del curso' })}
          </p>
          <h3 className="mt-2 text-base font-black leading-snug" style={{ color: theme.textColor }}>{courseTitle}</h3>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border p-4" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
        <p className="text-xs font-semibold" style={{ color: theme.subtextColor }}>
          {t('assignCourse.summary.alreadyAssigned', { defaultValue: 'Ya asignados' })}
        </p>
        <p className="mt-2 text-2xl font-black" style={{ color: theme.textColor }}>{alreadyAssignedCount}</p>
      </div>
    </div>
  )
}
