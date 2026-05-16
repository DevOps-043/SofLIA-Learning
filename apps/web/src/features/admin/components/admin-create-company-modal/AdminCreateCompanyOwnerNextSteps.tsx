'use client'

import { SparklesIcon } from '@heroicons/react/24/outline'

const NEXT_STEPS = [
  'Se creará la organización con la configuración especificada',
  'El propietario recibirá un email con un enlace para registrarse',
  'La invitación expira en 7 días',
  'Podrás ver el estado de la invitación en el panel de administración',
]

export function AdminCreateCompanyOwnerNextSteps() {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-100 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start gap-3">
        <SparklesIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-2">
            <strong className="text-gray-900 dark:text-white">¿Qué sucederá después?</strong>
          </p>
          <ul className="space-y-1 text-xs">
            {NEXT_STEPS.map((step) => (
              <li key={step}>• {step}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
