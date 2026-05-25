import type { DiagnosticsResponse } from './types'

interface DiagnosticsBannerProps {
  diagnostics: DiagnosticsResponse | null
  isDiagnosing: boolean
  onRunDiagnostics: () => void
}

export function DiagnosticsBanner({
  diagnostics,
  isDiagnosing,
  onRunDiagnostics,
}: DiagnosticsBannerProps) {
  if (!diagnostics) return null

  const healthy = diagnostics.summary.healthy

  return (
    <div
      className={`mb-6 rounded-xl border p-4 ${
        healthy ? 'border-success/40 bg-success/5' : 'border-warning/50 bg-warning/10'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className={`text-sm font-semibold ${healthy ? 'text-success' : 'text-warning'}`}>
            {healthy ? 'Pipeline configurado correctamente' : 'Faltan piezas de configuracion'}
          </p>
          {!healthy && (
            <ul className="mt-2 text-xs text-primary dark:text-white/80 space-y-1 list-disc pl-5">
              {diagnostics.summary.problems.map(problem => <li key={problem}>{problem}</li>)}
            </ul>
          )}
          <DiagnosticsDetails diagnostics={diagnostics} />
        </div>
        <button
          type="button"
          onClick={() => onRunDiagnostics()}
          disabled={isDiagnosing}
          className="text-xs text-primary dark:text-white/80 hover:underline"
        >
          {isDiagnosing ? 'Verificando...' : 'Re-verificar'}
        </button>
      </div>
    </div>
  )
}

function DiagnosticsDetails({ diagnostics }: { diagnostics: DiagnosticsResponse }) {
  const probeError = diagnostics.bgFunctionProbe.error
  const probeStatus = diagnostics.bgFunctionProbe.status

  return (
    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500 dark:text-white/60">
      <div><span className="font-medium">Transcoding:</span> {diagnostics.transcodingEnabled ? 'activo' : 'desactivado'}</div>
      <div><span className="font-medium">Secret:</span> {diagnostics.hasTranscodingInternalSecret ? 'configurado' : 'falta'}</div>
      <div><span className="font-medium">URL:</span> {diagnostics.netlifyUrl ? diagnostics.netlifyUrlSource : 'falta'}</div>
      <div>
        <span className="font-medium">BG fn:</span>{' '}
        {diagnostics.bgFunctionProbe.reachable === true
          ? `alcanzable (HTTP ${probeStatus})`
          : diagnostics.bgFunctionProbe.reachable === false
            ? `no responde (${probeError ?? `HTTP ${probeStatus}`})`
            : '?'}
      </div>
    </div>
  )
}
