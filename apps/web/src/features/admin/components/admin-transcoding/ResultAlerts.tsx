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
          scanResult.success ? 'border-success/40 bg-success/10 text-success' : 'border-error/40 bg-error/10 text-error'
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
      ? 'border-success/40 bg-success/10 text-success'
      : 'border-primary/20 dark:border-white/10 bg-primary/5 dark:bg-white/5 text-primary dark:text-white/80'
    : 'border-error/40 bg-error/10 text-error'

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
