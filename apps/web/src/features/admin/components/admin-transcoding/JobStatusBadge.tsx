import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import type { TranscodingJobStatus } from '../../hooks/useTranscodingJobStatus'
import { STATUS_META } from './constants'

export function JobStatusBadge({ status }: { status: TranscodingJobStatus }) {
  const meta = STATUS_META[status]

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.tone}`}>
      {status === 'processing' && <ArrowPathIcon className="h-3 w-3 animate-spin" />}
      {status === 'completed' && <CheckCircleIcon className="h-3 w-3" />}
      {status === 'failed' && <ExclamationTriangleIcon className="h-3 w-3" />}
      {(status === 'queued' || status === 'skipped' || status === 'disabled') && (
        <ClockIcon className="h-3 w-3" />
      )}
      {meta.label}
    </span>
  )
}
