'use client'

import { useState } from 'react'
import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown, Clock3, ListTodo } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type {
  NotebookKnowledgeType,
  NotebookLifecycleStatus,
  NotebookNoteSource,
} from '../types'
import { cn } from '@/utils/cn'
import styles from './NotebookExperience.module.css'

export type NotebookMainView = 'timeline' | 'tasks'
export type NotebookSourceFilter = NotebookNoteSource | 'all'
export type NotebookKnowledgeFilter = NotebookKnowledgeType | 'all'
export type NotebookLifecycleFilter = NotebookLifecycleStatus | 'all'

const SOURCES: NotebookSourceFilter[] = [
  'all',
  'manual',
  'chat',
  'lesson_auto_note',
  'import',
  'course_compendium',
]

export function NotebookViewToolbar({
  view,
  onViewChange,
  source,
  onSourceChange,
  knowledgeType,
  onKnowledgeTypeChange,
  lifecycleStatus,
  onLifecycleStatusChange,
}: {
  view: NotebookMainView
  onViewChange: (view: NotebookMainView) => void
  source: NotebookSourceFilter
  onSourceChange: (source: NotebookSourceFilter) => void
  knowledgeType: NotebookKnowledgeFilter
  onKnowledgeTypeChange: (value: NotebookKnowledgeFilter) => void
  lifecycleStatus: NotebookLifecycleFilter
  onLifecycleStatusChange: (value: NotebookLifecycleFilter) => void
}) {
  const { t } = useTranslation('notebook')
  return (
    <div className={styles.viewToolbar}>
      <div className={styles.viewSwitch}>
        <ViewButton active={view === 'timeline'} onClick={() => onViewChange('timeline')} icon={<Clock3 className="h-4 w-4" />} label={t('views.timeline')} />
        <ViewButton active={view === 'tasks'} onClick={() => onViewChange('tasks')} icon={<ListTodo className="h-4 w-4" />} label={t('views.tasks')} />
      </div>
      {view === 'timeline' && (
        <div className={styles.filters}>
          <FilterSelect label={t('filters.sourceLabel')} value={source} onChange={(value) => onSourceChange(value as NotebookSourceFilter)} options={SOURCES.map((item) => ({ value: item, label: t(`source.${item}`) }))} />
          <FilterSelect label={t('filters.knowledgeLabel')} value={knowledgeType} onChange={(value) => onKnowledgeTypeChange(value as NotebookKnowledgeFilter)} options={['all', 'note', 'reflection', 'decision', 'qa', 'resource', 'evidence'].map((item) => ({ value: item, label: item === 'all' ? t('filters.all') : t(`enrichment.knowledgeType.${item}`) }))} />
          <FilterSelect label={t('filters.lifecycleLabel')} value={lifecycleStatus} onChange={(value) => onLifecycleStatusChange(value as NotebookLifecycleFilter)} options={['all', 'draft', 'enriched', 'reviewed', 'archived', 'shared', 'promoted'].map((item) => ({ value: item, label: t(`filters.lifecycle.${item}`) }))} />
        </div>
      )}
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null)

  return (
    <div ref={setPortalContainer} className={styles.filter}>
      <span className={styles.filterLabel}>{label}</span>
      <Select.Root
        value={value}
        onValueChange={onChange}
      >
        <Select.Trigger
          aria-label={label}
          className={styles.filterTrigger}
        >
          <Select.Value />
          <Select.Icon asChild>
            <ChevronDown aria-hidden="true" className={styles.filterChevron} />
          </Select.Icon>
        </Select.Trigger>

        {portalContainer && (
          <Select.Portal container={portalContainer}>
            <Select.Content
              position="popper"
              sideOffset={8}
              collisionPadding={12}
              className={styles.filterMenu}
            >
              <Select.Viewport className={styles.filterViewport}>
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className={styles.filterOption}
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                    <Select.ItemIndicator className={styles.filterIndicator}>
                      <Check aria-hidden="true" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        )}
      </Select.Root>
    </div>
  )
}

function ViewButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(styles.viewButton, active && styles.viewButtonActive)}
    >
      {icon}
      {label}
    </button>
  )
}
