'use client'

import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface AdminCreateCompanyModalFooterProps {
  accentColor: string
  isCreating: boolean
  isFormValid: boolean
  onClose: () => void
  onSubmit: () => void
  primaryColor: string
}

export function AdminCreateCompanyModalFooter({
  accentColor,
  isCreating,
  isFormValid,
  onClose,
  onSubmit,
  primaryColor,
}: AdminCreateCompanyModalFooterProps) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-carbon-900">
      <p className="text-xs text-gray-500">
        {isFormValid ? (
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircleIcon className="h-3.5 w-3.5" /> Listo para crear
          </span>
        ) : (
          <span className="text-gray-500">Completa nombre y email del propietario</span>
        )}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="rounded-xl px-6 py-2.5 font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
        >
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          disabled={isCreating || !isFormValid}
          className="flex items-center gap-2 rounded-xl px-8 py-2.5 font-bold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:scale-105 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            boxShadow: `0 4px 20px ${primaryColor}40`,
          }}
        >
          {isCreating ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
          {isCreating ? 'Creando...' : 'Crear Organización'}
        </button>
      </div>
    </div>
  )
}
