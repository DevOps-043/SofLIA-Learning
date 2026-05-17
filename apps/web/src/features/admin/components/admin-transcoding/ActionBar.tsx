import { ArrowPathIcon, PlayCircleIcon } from '@heroicons/react/24/outline'

interface ActionBarProps {
  isScanning: boolean
  isDraining: boolean
  onScan: () => void
  onDrain: () => void
  onRefresh: () => void
}

export function ActionBar({ isScanning, isDraining, onScan, onDrain, onRefresh }: ActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <button
        type="button"
        onClick={onScan}
        disabled={isScanning}
        className="inline-flex items-center gap-2 rounded-xl bg-[#0A2540] hover:bg-[#0A2540]/90 text-white px-4 py-2 text-sm font-medium transition disabled:opacity-50"
      >
        {isScanning ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <PlayCircleIcon className="h-4 w-4" />}
        Escanear y encolar pendientes
      </button>
      <button
        type="button"
        onClick={onDrain}
        disabled={isDraining}
        className="inline-flex items-center gap-2 rounded-xl border border-[#0A2540] text-[#0A2540] dark:border-white/20 dark:text-white px-4 py-2 text-sm font-medium transition disabled:opacity-50 hover:bg-[#0A2540]/5 dark:hover:bg-white/5"
      >
        <ArrowPathIcon className={`h-4 w-4 ${isDraining ? 'animate-spin' : ''}`} />
        Procesar siguientes 10 en cola
      </button>
      <button
        type="button"
        onClick={() => onRefresh()}
        className="ml-auto text-xs text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white"
      >
        Refrescar ahora
      </button>
    </div>
  )
}
