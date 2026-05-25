'use client'

import { colors } from '../shared'

interface InvitationItem {
  id: string
  email: string
  role: string
  created_at: string
  expires_at: string
}

export function InvitationsTable({
  invitations,
  resendingId,
  revokingId,
  onResend,
  onRevoke,
}: {
  invitations: InvitationItem[]
  resendingId: string | null
  revokingId: string | null
  onResend: (id: string) => void
  onRevoke: (id: string) => void
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-xs uppercase" style={{ color: colors.grayMedium }}>
          <th className="pb-3 font-medium">Email</th>
          <th className="pb-3 font-medium">Rol</th>
          <th className="pb-3 font-medium">Enviada</th>
          <th className="pb-3 font-medium">Expira</th>
          <th className="pb-3 text-right font-medium">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y" style={{ borderColor: `color-mix(in srgb, ${colors.grayMedium} 6.3%, transparent)` }}>
        {invitations.map((invitation) => (
          <tr key={invitation.id} className="group">
            <td className="py-3"><p className="text-sm font-medium text-gray-900 dark:text-white">{invitation.email}</p></td>
            <td className="py-3">
              <span className="rounded-lg bg-accent/20 px-2.5 py-1 text-xs font-medium uppercase text-accent">
                {invitation.role}
              </span>
            </td>
            <td className="py-3 text-sm text-gray-500">{new Date(invitation.created_at).toLocaleDateString('es-MX')}</td>
            <td className="py-3 text-sm text-gray-500">{new Date(invitation.expires_at).toLocaleDateString('es-MX')}</td>
            <td className="py-3">
              <div className="flex items-center justify-end gap-2 text-xs">
                <UsersActionButton
                  disabled={resendingId === invitation.id}
                  label={resendingId === invitation.id ? 'Reenviando...' : 'Reenviar'}
                  tone="orange"
                  onClick={() => onResend(invitation.id)}
                />
                <UsersActionButton
                  disabled={revokingId === invitation.id}
                  label={revokingId === invitation.id ? 'Eliminando...' : 'Eliminar'}
                  tone="red"
                  onClick={() => onRevoke(invitation.id)}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function UsersActionButton({
  disabled,
  label,
  tone,
  onClick,
}: {
  disabled: boolean
  label: string
  tone: 'orange' | 'red'
  onClick: () => void
}) {
  const classes =
    tone === 'orange'
      ? 'border-orange-500/50 text-orange-500 hover:bg-orange-500'
      : 'border-red-500/50 text-red-500 hover:bg-red-500'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-1.5 transition-all hover:text-white disabled:opacity-50 ${classes}`}
    >
      {label}
    </button>
  )
}
