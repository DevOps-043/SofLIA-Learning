'use client'

import { AcademicCapIcon, ChartBarIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { CompanyMember } from '@/features/admin/hooks/useEditCompanyLogic'
import type { MembersTableProps } from './types'
import { colors } from '../shared'
import { getRoleBadge, getStatusBadge, getUserDisplayName } from './users-section.helpers'

export function MembersTable({
  members,
  onDelete,
  onEditProfile,
  onViewStats,
  onManageAssignments,
  actionsDisabled,
}: MembersTableProps) {
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
      <tbody className="divide-y" style={{ borderColor: `color-mix(in srgb, ${colors.grayMedium} 6.3%, transparent)` }}>
        {members.map((member) => (
          <MembersTableRow
            key={member.id}
            member={member}
            onDelete={onDelete}
            onEditProfile={onEditProfile}
            onViewStats={onViewStats}
            onManageAssignments={onManageAssignments}
            actionsDisabled={actionsDisabled}
          />
        ))}
      </tbody>
    </table>
  )
}

function MembersTableRow({
  member,
  onDelete,
  onEditProfile,
  onViewStats,
  onManageAssignments,
  actionsDisabled,
}: {
  member: CompanyMember
  onDelete: (member: CompanyMember) => void
  onEditProfile: (member: CompanyMember) => void
  onViewStats: (member: CompanyMember) => void
  onManageAssignments: (member: CompanyMember) => void
  actionsDisabled?: boolean
}) {
  const roleBadge = getRoleBadge(member.role, colors)
  const statusBadge = getStatusBadge(member.status, colors)

  return (
    <tr className="group">
      <td className="py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${colors.accent} 12.5%, transparent)` }}>
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
          <button
            onClick={() => onViewStats(member)}
            disabled={actionsDisabled}
            title="Estadísticas"
            className="rounded-lg p-1.5 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChartBarIcon className="h-4 w-4" style={{ color: colors.grayMedium }} />
          </button>
          <button
            onClick={() => onEditProfile(member)}
            disabled={actionsDisabled}
            title="Editar perfil"
            className="rounded-lg p-1.5 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PencilSquareIcon className="h-4 w-4" style={{ color: colors.grayMedium }} />
          </button>
          <button
            onClick={() => onManageAssignments(member)}
            title="Asignaciones (rol, cursos y rutas)"
            className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
          >
            <AcademicCapIcon className="h-4 w-4" style={{ color: colors.grayMedium }} />
          </button>
          <button onClick={() => onDelete(member)} title="Eliminar" className="rounded-lg p-1.5 transition-colors hover:bg-white/10">
            <TrashIcon className="h-4 w-4" style={{ color: colors.error }} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function UsersBadge({ color, label }: { color: string; label: string }) {
  return (
    <span className="rounded-lg px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `color-mix(in srgb, ${color} 12.5%, transparent)`, color }}>
      {label}
    </span>
  )
}
