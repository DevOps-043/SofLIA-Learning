'use client'

import { Clock3, ListTodo } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type {
  NotebookKnowledgeType,
  NotebookLifecycleStatus,
  NotebookNoteSource,
} from '../types'

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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex w-fit rounded-xl border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-white/[0.03]">
        <ViewButton active={view === 'timeline'} onClick={() => onViewChange('timeline')} icon={<Clock3 className="h-4 w-4" />} label={t('views.timeline')} />
        <ViewButton active={view === 'tasks'} onClick={() => onViewChange('tasks')} icon={<ListTodo className="h-4 w-4" />} label={t('views.tasks')} />
      </div>
      {view === 'timeline' && (
        <div className="flex max-w-full flex-wrap items-center gap-2">
          <FilterSelect label={t('filters.sourceLabel')} value={source} onChange={(value) => onSourceChange(value as NotebookSourceFilter)} options={SOURCES.map((item) => ({ value: item, label: t(`source.${item}`) }))} />
          <FilterSelect label={t('filters.knowledgeLabel')} value={knowledgeType} onChange={(value) => onKnowledgeTypeChange(value as NotebookKnowledgeFilter)} options={['all', 'note', 'reflection', 'decision', 'qa', 'resource', 'evidence'].map((item) => ({ value: item, label: item === 'all' ? t('filters.all') : t(`enrichment.knowledgeType.${item}`) }))} />
          <FilterSelect label={t('filters.lifecycleLabel')} value={lifecycleStatus} onChange={(value) => onLifecycleStatusChange(value as NotebookLifecycleFilter)} options={['all', 'draft', 'enriched', 'reviewed', 'archived', 'shared', 'promoted'].map((item) => ({ value: item, label: t(`filters.lifecycle.${item}`) }))} />
        </div>
      )}
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400"><span className="sr-only sm:not-sr-only">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-9 max-w-[170px] rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:border-white/10 dark:bg-gray-800 dark:text-gray-200">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}

function ViewButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${active ? 'bg-[var(--color-primary)] text-white dark:bg-[var(--color-accent)] dark:text-gray-900' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10'}`}>{icon}{label}</button>
}
