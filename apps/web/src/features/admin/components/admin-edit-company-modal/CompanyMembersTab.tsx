'use client'

import { motion } from 'framer-motion'
import type { AdminCompany } from '../../types/admin-companies.types'
import { colors } from './company-form.constants'

interface CompanyMembersTabProps {
  company: AdminCompany
}

type MemberUser = {
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  username: string | null
}

function getUserDisplayName(user?: MemberUser) {
  if (!user) return 'Usuario'
  if (user.display_name) return user.display_name
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
  if (user.first_name) return user.first_name
  if (user.username) return user.username
  return user.email.split('@')[0]
}

export function CompanyMembersTab({ company }: CompanyMembersTabProps) {
  const owner = company.members?.find(m => m.role === 'owner')
  const admins = company.members?.filter(m => m.role === 'admin') || []

  return (
    <motion.div
      key="members"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8 max-w-3xl"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: 'Activos', v: company.active_users, c: colors.success },
          { l: 'Invitados', v: company.invited_users, c: colors.warning },
          { l: 'Suspendidos', v: company.suspended_users, c: colors.error },
          { l: 'Total', v: company.total_users, c: 'var(--color-bg-light)' },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center group hover:bg-white/10 transition-colors">
            <span className="text-2xl font-bold" style={{ color: s.c }}>{s.v}</span>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium group-hover:text-white/70 transition-colors">{s.l}</span>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
          <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider">Administradores</h3>
          <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/80">{admins.length} Asignados</span>
        </div>
        <div className="space-y-3">
          {admins.map(admin => (
            <div key={admin.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4 hover:border-white/20 transition-all">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner" style={{ background: `color-mix(in srgb, ${colors.accent} 12.5%, transparent)`, color: colors.accent }}>
                {getUserDisplayName(admin.user).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{getUserDisplayName(admin.user)}</p>
                <p className="text-xs text-gray-500">{admin.user?.email}</p>
              </div>
              <span className="px-2 py-1 rounded text-[10px] bg-accent/10 text-accent uppercase font-bold tracking-wider">Admin</span>
            </div>
          ))}
          {admins.length === 0 && (
            <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-xl text-gray-500 text-sm hover:border-white/20 transition-colors">
              No hay administradores adicionales.
            </div>
          )}
        </div>
      </div>

      {owner && (
        <div className="pt-2">
          <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Propietario</h3>
          <div className="p-4 rounded-xl bg-gradient-to-r from-white/5 to-transparent border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg" style={{ background: `color-mix(in srgb, ${colors.warning} 12.5%, transparent)`, color: colors.warning }}>
              {getUserDisplayName(owner.user).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{getUserDisplayName(owner.user)}</p>
              <p className="text-xs text-gray-400">{owner.user?.email}</p>
            </div>
            <div className="ml-auto">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-warning/10 text-warning border border-warning/20">OWNER</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
