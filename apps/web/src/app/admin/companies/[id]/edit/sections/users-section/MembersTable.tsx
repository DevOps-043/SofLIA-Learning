'use client'

import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { CompanyMember } from '@/features/admin/hooks/useEditCompanyLogic'
import type { MembersTableProps } from './types'
import { colors } from '../shared'
import { getRoleBadge, getStatusBadge, getUserDisplayName } from './users-section.helpers'

export function MembersTable({ members, onDelete, onEdit }: MembersTableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-xs uppercase" style={{ color: colors.grayMedium }}>
          <th className="pb-3 font-medium">Usuario</th>
          <th className="pb-3 font-medium">Rol</th>
          <th className="pb-3 font-medium">Estado</th>
          <th className="pb-3 font-medium">Fecha ingreso</th>
          <th className="pb-3 text-right font-medium">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y" style={{ borderColor: `${colors.grayMedium}10` }}>
        {members.map((member) => (
          <MembersTableRow key={member.id} member={member} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </tbody>
    </table>
  )
}

function MembersTableRow({
  member,
  onDelete,
  onEdit,
}: {
  member: CompanyMember
  onDelete: (member: CompanyMember) => void
  onEdit: (member: CompanyMember) => void
}) {
  const roleBadge = getRoleBadge(member.role, colors)
  const statusBadge = getStatusBadge(member.status, colors)

  return (
    <tr className="group">
      <td className="py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: `${colors.accent}20` }}>
            {member.user?.profile_picture_url ? (
              <img src={member.user.profile_picture_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-medium" style={{ color: colors.accent }}>
                {getUserDisplayName(member.user).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{getUserDisplayName(member.user)}</p>
            <p className="text-xs" style={{ color: colors.grayMedium }}>{member.user?.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3"><UsersBadge color={roleBadge.color} label={roleBadge.label} /></td>
      <td className="py-3"><UsersBadge color={statusBadge.color} label={statusBadge.label} /></td>
      <td className="py-3">
        <span className="text-sm" style={{ color: colors.grayMedium }}>
          {member.joined_at ? new Date(member.joined_at).toLocaleDateString('es-MX') : '-'}
        </span>
      </td>
      <td className="py-3">
        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={() => onEdit(member)} className="rounded-lg p-1.5 transition-colors hover:bg-white/10">
            <PencilSquareIcon className="h-4 w-4" style={{ color: colors.grayMedium }} />
          </button>
          <button onClick={() => onDelete(member)} className="rounded-lg p-1.5 transition-colors hover:bg-white/10">
            <TrashIcon className="h-4 w-4" style={{ color: colors.error }} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function UsersBadge({ color, label }: { color: string; label: string }) {
  return (
    <span className="rounded-lg px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${color}20`, color }}>
      {label}
    </span>
  )
}
