'use client'

import { ArrowPathIcon } from '@heroicons/react/24/outline'

export function AdminEditCompanyModalFooter(props: {
  isSaving: boolean
  primaryColor: string
  accentColor: string
  onClose: () => void
  onSave: () => void
}) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-white/5 bg-carbon-800 p-6 shrink-0">
      <button onClick={props.onClose} className="rounded-xl px-6 py-2.5 font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white">Cancelar</button>
      <button onClick={props.onSave} disabled={props.isSaving} className="flex items-center gap-2 rounded-xl px-8 py-2.5 font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${props.primaryColor}, ${props.accentColor})`, boxShadow: `0 4px 20px color-mix(in srgb, ${props.primaryColor} 25.1%, transparent)` }}>
        {props.isSaving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
        {props.isSaving ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </div>
  )
}
