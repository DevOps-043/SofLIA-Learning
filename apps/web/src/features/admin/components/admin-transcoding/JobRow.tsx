import type { JobsApiResponse } from './types'
import { formatElapsed, formatSize } from './formatters'
import { JobStatusBadge } from './JobStatusBadge'

type TranscodingJobRow = JobsApiResponse['jobs'][number]

interface JobRowProps {
  job: TranscodingJobRow
  onReprocessJob: (sourcePath: string, bucket: string, contentType: string) => void
}

export function JobRow({ job, onReprocessJob }: JobRowProps) {
  return (
    <tr className="hover:bg-[#F8FAFC] dark:hover:bg-white/5">
      <td className="px-4 py-3 max-w-md">
        <p className="text-[#0A2540] dark:text-white text-xs truncate" title={job.source_path}>
          {job.source_path}
        </p>
        {job.error_message && (
          <p className="text-[#ef4444] text-xs mt-1 break-words">{job.error_message}</p>
        )}
      </td>
      <td className="px-4 py-3"><JobStatusBadge status={job.status} /></td>
      <td className="px-4 py-3 text-xs text-[#6C757D] dark:text-white/60">
        {formatSize(job.size_bytes)}
      </td>
      <td className="px-4 py-3 text-xs text-[#6C757D] dark:text-white/60">
        {formatElapsed(job.started_at, job.completed_at)}
      </td>
      <td className="px-4 py-3 text-xs text-[#6C757D] dark:text-white/60">
        {new Date(job.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
      </td>
      <td className="px-4 py-3 text-right">
        {(job.status === 'failed' || job.status === 'completed') && (
          <button
            type="button"
            onClick={() => onReprocessJob(job.source_path, job.bucket, job.content_type)}
            className="text-xs text-[#0A2540] dark:text-[#00D4B3] hover:underline"
          >
            Reprocesar
          </button>
        )}
      </td>
    </tr>
  )
}
