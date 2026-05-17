import { FAILURE_REASON_COPY } from './constants'
import type { DispatchFailure } from './types'

export function FailureList({ failures }: { failures: DispatchFailure[] | undefined }) {
  if (!failures || failures.length === 0) return null

  return (
    <div className="mt-2 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 p-2 text-xs">
      <p className="font-semibold text-[#ef4444] mb-1">
        {failures.length} {failures.length === 1 ? 'disparo fallo' : 'disparos fallaron'}:
      </p>
      <ul className="text-[#0A2540] dark:text-white/80 space-y-0.5">
        {failures.map(failure => (
          <li key={failure.jobId}>
            Job {failure.jobId.slice(0, 8)}{' '}
            <span className="text-[#ef4444]">
              {failure.reason ? (FAILURE_REASON_COPY[failure.reason] ?? failure.reason) : 'razon desconocida'}
            </span>
            {failure.detail && <span className="text-[#6C757D] dark:text-white/50"> - {failure.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
