'use client'

import { EnvelopeIcon } from '@heroicons/react/24/outline'

interface AdminCreateCompanyOwnerFieldsProps {
  ownerEmail: string
  ownerPosition: string
  onEmailChange: (value: string) => void
  onPositionChange: (value: string) => void
}

export function AdminCreateCompanyOwnerFields({
  ownerEmail,
  ownerPosition,
  onEmailChange,
  onPositionChange,
}: AdminCreateCompanyOwnerFieldsProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 ml-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          Correo electrónico del propietario <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <EnvelopeIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
          <input
            type="email"
            value={ownerEmail}
            onChange={(event) => onEmailChange(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-100 py-3.5 pl-12 pr-4 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-accent/50 focus:ring-1 focus:ring-accent/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
            placeholder="propietario@empresa.com"
          />
        </div>
      </div>
      <div>
        <label className="mb-2 ml-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          Cargo / Posición{' '}
          <span className="text-xs text-gray-500 dark:text-gray-600">(Opcional)</span>
        </label>
        <input
          type="text"
          value={ownerPosition}
          onChange={(event) => onPositionChange(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3.5 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20"
          placeholder="Ej: CEO, Director General, Gerente"
        />
      </div>
    </div>
  )
}
