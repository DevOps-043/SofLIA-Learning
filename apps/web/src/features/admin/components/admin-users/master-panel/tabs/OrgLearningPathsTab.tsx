'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { useOrgLearningPathsTabLogic } from '../hooks/useOrgLearningPathsTabLogic'
import {
  ASSIGN_BUTTON_CLASS,
  EMPTY_STATE_CLASS,
  LIST_ROW_CLASS,
  REMOVE_ICON_BUTTON_CLASS,
  SECTION_TITLE_CLASS,
} from '../panel-ui'
import { OrgSelectorBar } from './OrgSelectorBar'

interface OrgLearningPathsTabProps extends ReturnType<typeof useOrgLearningPathsTabLogic> {
  orgOptions: Array<{ value: string; label: string }>
  selectedOrgId: string
  onOrgChange: (organizationId: string) => void
}

export function OrgLearningPathsTab(props: OrgLearningPathsTabProps) {
  const { t } = useTranslation('admin')

  if (props.orgOptions.length === 0) {
    return (
      <div className={EMPTY_STATE_CLASS}>
        <p className="text-sm text-gray-400">{t('users.stats.noOrganizations')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <OrgSelectorBar
        orgOptions={props.orgOptions}
        selectedOrgId={props.selectedOrgId}
        onChange={props.onOrgChange}
      />

      <div>
        <p className={SECTION_TITLE_CLASS}>
          {t('users.masterPanel.learningPaths.assignedTitle', { count: props.orgAssignments.length })}
        </p>
        {props.orgAssignments.length === 0 ? (
          <div className={EMPTY_STATE_CLASS}>
            <p className="text-sm text-gray-400">{t('users.masterPanel.learningPaths.empty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {props.orgAssignments.map((assignment) => (
                <motion.div
                  key={assignment.id}
                  layout
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className={LIST_ROW_CLASS}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {assignment.learningPathTitle}
                    </p>
                    {assignment.assignedAt ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(assignment.assignedAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => props.handleRevoke(assignment.id)}
                    aria-label={t('users.masterPanel.learningPaths.revoke')}
                    className={REMOVE_ICON_BUTTON_CLASS}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div>
        <p className={SECTION_TITLE_CLASS}>{t('users.masterPanel.learningPaths.catalogTitle')}</p>
        {props.isCatalogLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : props.availablePaths.length === 0 ? (
          <p className="py-3 text-center text-sm text-gray-400">
            {t('users.masterPanel.learningPaths.catalogEmpty')}
          </p>
        ) : (
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {props.availablePaths.map((path) => (
              <div key={path.learningPathId} className={LIST_ROW_CLASS}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {path.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('users.masterPanel.learningPaths.courseCount', { count: path.itemCount })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => props.handleAssign(path.learningPathId)}
                  disabled={Boolean(props.assigningPathId)}
                  className={ASSIGN_BUTTON_CLASS}
                >
                  {props.assigningPathId === path.learningPathId ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  {t('users.masterPanel.learningPaths.assign')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
