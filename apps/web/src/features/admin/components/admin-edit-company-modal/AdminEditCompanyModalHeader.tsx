'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'

export function AdminEditCompanyModalHeader({ companyName, onClose }: { companyName: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 px-8 py-6 shrink-0">
      <div><h2 className="text-2xl font-bold text-white">Editar Empresa</h2><p className="mt-1 text-sm text-gray-400">Configuracion y preferencias de {companyName}</p></div>
      <button onClick={onClose} className="rounded-xl p-2.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
    </div>
  )
}
