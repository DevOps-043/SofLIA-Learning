'use client';

import { Building2, GitBranch, Search, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next';
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme';
import type { BusinessLearningPathHierarchyNode } from '../services/businessLearningPaths.service'
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
import modalStyles from './ContentModal.module.css'

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
      <div className={modalStyles.bodyGrid}>
        <div className={modalStyles.mainPanel}>
          <div className={modalStyles.controls}>
            <BusinessAssignCourseError modal={modal} theme={theme} />
            <CourseModeSelector
              assignmentMode={modal.assignmentMode}
              setAssignmentMode={modal.setAssignmentMode}
              t={t}
            />
            {modal.assignmentMode === 'users' ? <CourseUserControls modal={modal} t={t} /> : null}
            {modal.assignmentMode === 'all' ? <AllUsersHint activeUserCount={modal.activeUserCount} /> : null}
            {modal.assignmentMode === 'node' ? (
              <CourseNodeControls
                handleToggleNode={modal.handleToggleNode}
                hierarchyNodes={modal.hierarchyNodes}
                includeDescendants={modal.includeDescendants}
                selectedNodeIds={modal.selectedNodeIds}
                setIncludeDescendants={modal.setIncludeDescendants}
                t={t}
              />
            ) : null}
            <div className={modalStyles.mobileConfiguration}>
              <BusinessAssignCourseConfig modal={modal} t={t} theme={theme} />
            </div>
          </div>
          <div className={modalStyles.selectionBody}>
            {modal.assignmentMode === 'users' ? (
              <BusinessAssignCourseUsersGrid modal={modal} t={t} theme={theme} />
            ) : (
              <BulkModePreview
                activeUserCount={modal.activeUserCount}
                assignmentMode={modal.assignmentMode}
                selectedNodeCount={modal.selectedNodeIds.size}
                t={t}
              />
            )}
          </div>
        </div>
        <aside className={modalStyles.summaryPanel}>
          <CourseSummaryCard
            alreadyAssignedCount={modal.alreadyAssignedUserIds.size}
            courseTitle={courseTitle}
            t={t}
          />
          <BusinessAssignCourseConfig modal={modal} t={t} theme={theme} />
        </aside>
      </div>
      <BusinessAssignCourseFooter modal={modal} t={t} theme={theme} />
    </BusinessAssignCourseFrame>
  );
}

type T = ReturnType<typeof useTranslation<'business'>>['t']

function CourseModeSelector({
  assignmentMode,
  setAssignmentMode,
  t,
}: {
  assignmentMode: AssignmentMode
  setAssignmentMode: (mode: AssignmentMode) => void
  t: T
}) {
  const items: Array<{ mode: AssignmentMode; icon: typeof Users; label: string }> = [
    { mode: 'users', icon: Users, label: t('assignLearningPath.modes.users', { defaultValue: 'Usuarios' }) },
    { mode: 'all', icon: Building2, label: t('assignLearningPath.modes.all', { defaultValue: 'Toda la empresa' }) },
    { mode: 'node', icon: GitBranch, label: t('assignLearningPath.modes.node', { defaultValue: 'Estructura' }) },
  ]

  return (
    <div aria-label="Modo de asignación" className={modalStyles.modeTabs} role="tablist">
      {items.map(({ mode, icon: Icon, label }) => {
        const isActive = assignmentMode === mode
        return (
          <button
            aria-selected={isActive}
            className={`${modalStyles.modeTab} ${isActive ? modalStyles.modeTabActive : ''}`}
            key={mode}
            onClick={() => setAssignmentMode(mode)}
            role="tab"
            type="button"
          >
            <Icon aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

function CourseUserControls({ modal, t }: { modal: BusinessAssignCourseModalState; t: T }) {
  return (
    <>
      <div className={modalStyles.toolbar}>
        <div className={modalStyles.search}>
          <Search aria-hidden="true" />
          <input
            aria-label="Buscar usuario"
            className={modalStyles.input}
            onChange={(event) => modal.setSearchTerm(event.target.value)}
            placeholder={t('assignCourse.search.placeholder', { defaultValue: 'Buscar por nombre o email...' })}
            value={modal.searchTerm}
          />
        </div>
        <button
          className={modalStyles.secondaryButton}
          disabled={modal.availableUserCount === 0}
          onClick={modal.handleSelectAllUsers}
          type="button"
        >
          {modal.allUsersSelected
            ? t('assignLearningPath.clearSelection', { defaultValue: 'Limpiar selección' })
            : t('assignLearningPath.selectAll', { defaultValue: 'Seleccionar visibles' })}
        </button>
      </div>
      <div className={modalStyles.selectionMeta}>
        <span>{t('assignCourse.selected', { defaultValue: '{{count}} seleccionados', count: modal.selectedUserCount })}</span>
        <span>{t('assignCourse.available', { defaultValue: '{{count}} disponibles', count: modal.availableUserCount })}</span>
      </div>
    </>
  )
}

function AllUsersHint({ activeUserCount }: { activeUserCount: number }) {
  return (
    <div className={modalStyles.notice}>
      Se asignará el curso a los <strong>{activeUserCount}</strong> integrantes activos de la empresa.
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
}: {
  hierarchyNodes: BusinessLearningPathHierarchyNode[]
  selectedNodeIds: Set<string>
  includeDescendants: boolean
  handleToggleNode: (nodeId: string) => void
  setIncludeDescendants: (value: boolean) => void
  t: T
}) {
  return (
    <div>
      <label className={modalStyles.checkbox}>
        <input
          checked={includeDescendants}
          onChange={(event) => setIncludeDescendants(event.target.checked)}
          type="checkbox"
        />
        {t('assignLearningPath.includeDescendants', { defaultValue: 'Incluir nodos descendientes' })}
      </label>
      <div className={modalStyles.nodeOptions}>
        {hierarchyNodes.length === 0 ? (
          <p className={modalStyles.notice}>
            {t('assignLearningPath.noNodes', { defaultValue: 'No hay nodos de estructura disponibles.' })}
          </p>
        ) : (
          hierarchyNodes.map((node) => (
            <button
              className={`${modalStyles.nodeButton} ${selectedNodeIds.has(node.id) ? modalStyles.nodeButtonActive : ''}`}
              key={node.id}
              onClick={() => handleToggleNode(node.id)}
              style={{ marginLeft: node.depth * 12 }}
              type="button"
            >
              <span>{node.name}</span>
              <span>{node.type}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function BulkModePreview({
  assignmentMode,
  activeUserCount,
  selectedNodeCount,
  t,
}: {
  assignmentMode: AssignmentMode
  activeUserCount: number
  selectedNodeCount: number
  t: T
}) {
  const text =
    assignmentMode === 'all'
      ? t('assignLearningPath.bulkPreviewAll', { defaultValue: 'Se asignará a {{count}} usuarios activos de la empresa.', count: activeUserCount })
      : t('assignLearningPath.bulkPreviewNode', { defaultValue: '{{count}} nodo(s) seleccionado(s). El curso se asignará a todos sus miembros activos.', count: selectedNodeCount })

  return <div className={modalStyles.emptyNotice}>{text}</div>
}

function CourseSummaryCard({
  courseTitle,
  alreadyAssignedCount,
  t,
}: {
  courseTitle: string
  alreadyAssignedCount: number
  t: T
}) {
  return (
    <div className={modalStyles.summaryCard}>
      <div className={modalStyles.summaryHeader}>
        <div className={modalStyles.summaryIcon}><Users aria-hidden="true" /></div>
        <div>
          <p className={modalStyles.eyebrow}>
            {t('assignCourse.summary.title', { defaultValue: 'Resumen del curso' })}
          </p>
          <h3>{courseTitle}</h3>
        </div>
      </div>
      <div className={modalStyles.summaryStats}>
        <div className={modalStyles.summaryStat}>
          <span>{t('assignCourse.summary.alreadyAssigned', { defaultValue: 'Ya asignados' })}</span>
          <strong>{alreadyAssignedCount}</strong>
        </div>
        <div className={modalStyles.summaryStat}>
          <span>Disponibilidad</span>
          <strong>Activa</strong>
        </div>
      </div>
    </div>
  )
}
