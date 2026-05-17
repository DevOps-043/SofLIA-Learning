import { FailureList } from './FailureList'
import type { DrainResponse, ScanResponse } from './types'

interface ResultAlertsProps {
  scanResult: ScanResponse | null
  drainResult: DrainResponse | null
}

export function ResultAlerts({ scanResult, drainResult }: ResultAlertsProps) {
  return (
    <>
      {scanResult && (
        <div className={`mb-4 rounded-xl border p-3 text-sm ${
          scanResult.success ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]' : 'border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]'
        }`}>
          {scanResult.success ? (
            <p>
              Encontrados <strong>{scanResult.totalFound}</strong> videos, <strong>{scanResult.queued}</strong> encolados y <strong>{scanResult.invoked}</strong> disparados.
            </p>
          ) : <p>Error: {scanResult.error}</p>}
          <FailureList failures={scanResult.failures} />
        </div>
      )}
      {drainResult && <DrainAlert drainResult={drainResult} />}
    </>
  )
}

function DrainAlert({ drainResult }: { drainResult: DrainResponse }) {
  const className = drainResult.success
    ? drainResult.invoked > 0
      ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]'
      : 'border-[#0A2540]/20 dark:border-white/10 bg-[#0A2540]/5 dark:bg-white/5 text-[#0A2540] dark:text-white/80'
    : 'border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]'

  return (
    <div className={`mb-4 rounded-xl border p-3 text-sm ${className}`}>
      <p>
        {drainResult.success
          ? drainResult.invoked > 0
            ? `Disparados ${drainResult.invoked} nuevos jobs.`
            : drainResult.message ?? 'No se disparo ningun job nuevo.'
          : `Error: ${drainResult.error}`}
      </p>
      <FailureList failures={drainResult.failures} />
    </div>
  )
}
