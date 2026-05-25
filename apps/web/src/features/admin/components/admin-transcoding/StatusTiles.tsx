import type { TranscodingJobStatus } from '../../hooks/useTranscodingJobStatus'
import { STATUS_META } from './constants'

interface StatusTilesProps {
  summary: Record<TranscodingJobStatus, number> | undefined
}

export function StatusTiles({ summary }: StatusTilesProps) {
  if (!summary) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
      {(Object.keys(STATUS_META) as TranscodingJobStatus[]).map(key => {
        const meta = STATUS_META[key]

        return (
          <div key={key} className={`rounded-xl border ${meta.border} ${meta.bg} p-4`}>
            <p className={`text-xs uppercase tracking-wide font-semibold ${meta.tone}`}>
              {meta.label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${meta.tone}`}>{summary[key]}</p>
          </div>
        )
      })}
    </div>
  )
}
