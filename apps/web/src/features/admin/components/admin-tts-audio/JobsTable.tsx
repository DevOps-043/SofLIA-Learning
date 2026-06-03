import { RotateCcw } from 'lucide-react';
import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';

import {
  LANGUAGE_KEYS,
  SOURCE_TYPE_KEYS,
  STATUS_KEYS,
  STATUS_STYLES,
} from './constants';
import type {
  JobsApiResponse,
  ReadingAudioJob,
  ReadingAudioJobStatus,
  ReadingAudioLanguage,
  ReadingAudioSourceType,
} from './types';

interface JobsTableProps {
  data: JobsApiResponse | null;
  isLoading: boolean;
  languageFilter: ReadingAudioLanguage | 'all';
  onLanguageFilterChange: (language: ReadingAudioLanguage | 'all') => void;
  onReprocessJob: (jobId: string) => void;
  onSourceTypeFilterChange: (sourceType: ReadingAudioSourceType | 'all') => void;
  onStatusFilterChange: (status: ReadingAudioJobStatus | 'all') => void;
  sourceTypeFilter: ReadingAudioSourceType | 'all';
  statusFilter: ReadingAudioJobStatus | 'all';
  t: TFunction<'admin'>;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function getPreview(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > 120 ? `${normalized.slice(0, 120)}...` : normalized;
}

export function JobsTable({
  data,
  isLoading,
  languageFilter,
  onLanguageFilterChange,
  onReprocessJob,
  onSourceTypeFilterChange,
  onStatusFilterChange,
  sourceTypeFilter,
  statusFilter,
  t,
}: JobsTableProps) {
  return (
    <>
      <TableFilters
        languageFilter={languageFilter}
        onLanguageFilterChange={onLanguageFilterChange}
        onSourceTypeFilterChange={onSourceTypeFilterChange}
        onStatusFilterChange={onStatusFilterChange}
        sourceTypeFilter={sourceTypeFilter}
        statusFilter={statusFilter}
        t={t}
      />
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-white/5 dark:text-white/60">
              <tr>
                {['source', 'status', 'language', 'segments', 'model', 'retries', 'updated', 'actions'].map((key) => (
                  <th key={key} className="px-4 py-3 text-left font-semibold">
                    {t(`ttsAudio.table.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              <JobsTableBody
                data={data}
                isLoading={isLoading}
                onReprocessJob={onReprocessJob}
                t={t}
              />
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function TableFilters({
  languageFilter,
  onLanguageFilterChange,
  onSourceTypeFilterChange,
  onStatusFilterChange,
  sourceTypeFilter,
  statusFilter,
  t,
}: Omit<JobsTableProps, 'data' | 'isLoading' | 'onReprocessJob'>) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <SelectFilter
        label={t('ttsAudio.filters.status')}
        value={statusFilter}
        onChange={(value) => onStatusFilterChange(value as ReadingAudioJobStatus | 'all')}
      >
        {(['all', ...STATUS_KEYS] as Array<ReadingAudioJobStatus | 'all'>).map((status) => (
          <option key={status} value={status}>
            {status === 'all' ? t('ttsAudio.common.all') : t(`ttsAudio.status.${status}`)}
          </option>
        ))}
      </SelectFilter>
      <SelectFilter
        label={t('ttsAudio.filters.sourceType')}
        value={sourceTypeFilter}
        onChange={(value) => onSourceTypeFilterChange(value as ReadingAudioSourceType | 'all')}
      >
        {SOURCE_TYPE_KEYS.map((sourceType) => (
          <option key={sourceType} value={sourceType}>
            {sourceType === 'all' ? t('ttsAudio.common.all') : t(`ttsAudio.sourceTypes.${sourceType}`)}
          </option>
        ))}
      </SelectFilter>
      <SelectFilter
        label={t('ttsAudio.filters.language')}
        value={languageFilter}
        onChange={(value) => onLanguageFilterChange(value as ReadingAudioLanguage | 'all')}
      >
        {LANGUAGE_KEYS.map((language) => (
          <option key={language} value={language}>
            {language === 'all' ? t('ttsAudio.common.all') : t(`ttsAudio.languages.${language}`)}
          </option>
        ))}
      </SelectFilter>
      <span className="text-xs text-gray-500 dark:text-white/50">
        {t('ttsAudio.table.autoRefresh')}
      </span>
    </div>
  );
}

function SelectFilter({
  children,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-white/60">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
      >
        {children}
      </select>
    </label>
  );
}

function JobsTableBody({
  data,
  isLoading,
  onReprocessJob,
  t,
}: Pick<JobsTableProps, 'data' | 'isLoading' | 'onReprocessJob' | 't'>) {
  if (isLoading && !data) return <TableMessage>{t('ttsAudio.table.loading')}</TableMessage>;
  if (!data || data.jobs.length === 0) return <TableMessage>{t('ttsAudio.table.empty')}</TableMessage>;

  return (
    <>
      {data.jobs.map((job) => (
        <JobRow key={job.id} job={job} onReprocessJob={onReprocessJob} t={t} />
      ))}
    </>
  );
}

function JobRow({
  job,
  onReprocessJob,
  t,
}: {
  job: ReadingAudioJob;
  onReprocessJob: (jobId: string) => void;
  t: TFunction<'admin'>;
}) {
  return (
    <tr className="bg-white align-top dark:bg-transparent">
      <td className="max-w-md px-4 py-3">
        <div className="font-medium text-gray-900 dark:text-white">
          {t(`ttsAudio.sourceTypes.${job.source_type}`)}
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-white/50">
          {getPreview(job.source_text)}
        </div>
        <div className="mt-1 font-mono text-[11px] text-gray-400 dark:text-white/30">
          {job.source_id}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[job.effective_status]}`}>
          {t(`ttsAudio.status.${job.effective_status}`)}
        </span>
        {job.error_message ? (
          <p className="mt-2 max-w-xs text-xs text-red-600 dark:text-red-300">{job.error_message}</p>
        ) : null}
      </td>
      <td className="px-4 py-3 text-gray-600 dark:text-white/70">
        {t(`ttsAudio.languages.${job.language}`)}
      </td>
      <td className="px-4 py-3 text-gray-600 dark:text-white/70">{job.segment_count}</td>
      <td className="px-4 py-3 text-gray-600 dark:text-white/70">
        <div className="max-w-44 truncate">{job.model}</div>
        <div className="text-xs text-gray-400 dark:text-white/40">
          {t('ttsAudio.table.promptVersion', { version: job.prompt_version })}
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600 dark:text-white/70">{job.retry_count}</td>
      <td className="px-4 py-3 text-gray-600 dark:text-white/70">{formatDate(job.updated_at)}</td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => onReprocessJob(job.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary/30 hover:text-primary dark:border-white/10 dark:text-white/70 dark:hover:text-accent"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t('ttsAudio.actions.reprocess')}
        </button>
      </td>
    </tr>
  );
}

function TableMessage({ children }: { children: ReactNode }) {
  return (
    <tr>
      <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-white/60">
        {children}
      </td>
    </tr>
  );
}
