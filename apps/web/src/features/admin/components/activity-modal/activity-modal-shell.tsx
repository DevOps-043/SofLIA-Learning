import type { FormEvent, ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

import type { AdminActivity } from '../../services/adminActivities.service'
import type { TabKey } from './types'

interface ActivityModalShellProps {
  activeTab: TabKey
  activity?: AdminActivity | null
  children: ReactNode
  error: string | null
  loading: boolean
  onClose: () => void
  onSubmit: (event: FormEvent) => void
  setActiveTab: (tab: TabKey) => void
  visibleTabs: Array<{ id: TabKey; label: string }>
}

export function ActivityModalShell({
  activeTab,
  activity,
  children,
  error,
  loading,
  onClose,
  onSubmit,
  setActiveTab,
  visibleTabs,
}: ActivityModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 bg-primary px-6 py-4 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">
              {activity ? 'Editar actividad' : 'Crear actividad'}
            </h3>
            <p className="text-sm text-white/70">Configura contenido, interaccion y validacion.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="flex gap-2 border-b border-gray-200 px-6 py-3 dark:border-white/10">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'bg-accent/15 text-primary dark:text-white'
                    : 'text-gray-600 dark:text-white/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            ) : null}
            {children}
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-white/10 dark:bg-gray-900">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 dark:border-white/10 dark:text-white/70">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? 'Guardando...' : 'Guardar actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
