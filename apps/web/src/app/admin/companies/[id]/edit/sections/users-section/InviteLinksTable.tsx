'use client'

import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { colors } from '../shared'

interface InviteLinkItem {
  id: string
  name: string | null
  token: string
  current_uses: number
  max_uses: number | null
  is_active: boolean
}

export function InviteLinksTable({
  links,
  onCopy,
}: {
  links: InviteLinkItem[]
  onCopy: (token: string) => void
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-xs uppercase" style={{ color: colors.grayMedium }}>
          <th className="pb-3 font-medium">Nombre / Token</th>
          <th className="pb-3 text-center font-medium">Usos</th>
          <th className="pb-3 text-center font-medium">Límite</th>
          <th className="pb-3 text-center font-medium">Estado</th>
          <th className="pb-3 text-right font-medium">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y" style={{ borderColor: `${colors.grayMedium}10` }}>
        {links.map((link) => (
          <tr key={link.id} className="group">
            <td className="py-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{link.name || 'Sin nombre'}</p>
              <p className="text-xs font-mono" style={{ color: colors.grayMedium }}>{link.token}</p>
            </td>
            <td className="py-3 text-center text-sm">{link.current_uses}</td>
            <td className="py-3 text-center text-sm">{link.max_uses || '∞'}</td>
            <td className="py-3 text-center">
              <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${link.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {link.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td className="py-3">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onCopy(link.token)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
                  title="Copiar enlace"
                >
                  <DocumentTextIcon className="h-4 w-4" style={{ color: colors.grayMedium }} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
