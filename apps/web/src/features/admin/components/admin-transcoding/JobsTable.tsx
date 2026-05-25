import type { TranscodingJobStatus } from '../../hooks/useTranscodingJobStatus'
import type { ReactNode } from 'react'
import { STATUS_META } from './constants'
import { JobRow } from './JobRow'
import type { JobsApiResponse } from './types'

interface JobsTableProps {
  data: JobsApiResponse | null
  error: string | null
  isLoading: boolean
  statusFilter: TranscodingJobStatus | 'all'
  onReprocessJob: (sourcePath: string, bucket: string, contentType: string) => void
  onStatusFilterChange: (status: TranscodingJobStatus | 'all') => void
}

export function JobsTable({
  data,
  error,
  isLoading,
  statusFilter,
  onReprocessJob,
  onStatusFilterChange,
}: JobsTableProps) {
  return (
    <>
      <StatusFilter statusFilter={statusFilter} onStatusFilterChange={onStatusFilterChange} />
      <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-gray-500 dark:text-white/60 text-xs uppercase tracking-wide">
              <tr>
                {['Video', 'Estado', 'Tamaño', 'Duracion', 'Creado', 'Acciones'].map(header => (
                  <th key={header} className="px-4 py-3 text-left font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              <JobsTableBody data={data} error={error} isLoading={isLoading} onReprocessJob={onReprocessJob} />
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function StatusFilter({ statusFilter, onStatusFilterChange }: Pick<JobsTableProps, 'statusFilter' | 'onStatusFilterChange'>) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs uppercase font-semibold text-gray-500 dark:text-white/60">Filtrar:</span>
      {(['all', ...Object.keys(STATUS_META)] as Array<TranscodingJobStatus | 'all'>).map(key => (
        <button key={key} type="button" onClick={() => onStatusFilterChange(key)} className={`text-xs px-3 py-1 rounded-full border transition ${statusFilter === key ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/70 hover:border-primary/40'}`}>
          {key === 'all' ? 'Todos' : STATUS_META[key].label}
        </button>
      ))}
    </div>
  )
}

function JobsTableBody({ data, error, isLoading, onReprocessJob }: Omit<JobsTableProps, 'statusFilter' | 'onStatusFilterChange'>) {
  if (isLoading && !data) return <TableMessage>Actualizando...</TableMessage>
  if (error) return <TableMessage tone="error">Error: {error}</TableMessage>
  if (!data || data.jobs.length === 0) return <TableMessage>No hay jobs para mostrar.</TableMessage>
  return <>{data.jobs.map(job => <JobRow key={job.id} job={job} onReprocessJob={onReprocessJob} />)}</>
}

function TableMessage({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'error' }) {
  return (
    <tr>
      <td colSpan={6} className={`px-4 py-8 text-center ${tone === 'error' ? 'text-error' : 'text-gray-500 dark:text-white/60'}`}>
        {children}
      </td>
    </tr>
  )
}
