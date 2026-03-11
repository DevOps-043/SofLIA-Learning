'use client'

import { useParams, useRouter } from 'next/navigation'
import { ShieldX, LogOut, Mail, Building2, ChevronRight, Shield, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { useOrganization } from '@/core/hooks/useOrganization'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Organization } from '@/core/stores/organizationStore'

export default function SuspendedPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params?.orgSlug as string
  const { organizations, setCurrentOrganization } = useOrganization()
  const { logout } = useAuth()

  // Other active orgs (excluding the suspended one)
  const otherOrgs = organizations.filter((o) => o.slug !== orgSlug)

  const handleLogout = async () => {
    await logout()
    router.push('/auth')
  }

  const handleSwitchOrg = (org: Organization) => {
    setCurrentOrganization(org)
    if (org.role === 'owner' || org.role === 'admin') {
      router.push(`/${org.slug}/business-panel/dashboard`)
    } else {
      router.push(`/${org.slug}/business-user/dashboard`)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Propietario'
      case 'admin': return 'Administrador'
      default: return 'Miembro'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full space-y-4"
      >
        {/* Main Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"
          >
            <ShieldX className="w-10 h-10 text-red-400" />
          </motion.div>

          <h1 className="text-2xl font-bold text-white mb-3">
            Acceso Suspendido
          </h1>
          <p className="text-gray-300 mb-2 leading-relaxed">
            Tu acceso a la organización{' '}
            <span className="text-white font-semibold font-mono">{orgSlug}</span>{' '}
            ha sido suspendido por un administrador.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Si crees que esto es un error, contacta al administrador de tu organización.
          </p>

          <div className="flex flex-col gap-3">
            <a
              href={`mailto:soporte@soflia.com?subject=Cuenta%20suspendida%20en%20${orgSlug}&body=Mi%20cuenta%20ha%20sido%20suspendida%20en%20la%20organizaci%C3%B3n%20${orgSlug}.%20Solicito%20revisi%C3%B3n.`}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium transition-all"
            >
              <Mail className="w-4 h-4" />
              Contactar Soporte
            </a>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium transition-all"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Other Organizations */}
        {otherOrgs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-[#00D4B3]" />
              <h2 className="text-sm font-semibold text-white">
                Cambiar a otra organización
              </h2>
            </div>

            <div className="space-y-2">
              {otherOrgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSwitchOrg(org)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all group text-left"
                >
                  {/* Org Logo */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: org.brandColorPrimary || '#0A2540' }}
                  >
                    {org.brandLogoUrl || org.logoUrl ? (
                      <img
                        src={org.brandLogoUrl || org.logoUrl || ''}
                        alt={org.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {org.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Org Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate group-hover:text-white/90">
                      {org.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {org.role === 'owner' || org.role === 'admin' ? (
                        <Shield className="w-3 h-3 text-blue-400" />
                      ) : (
                        <Users className="w-3 h-3 text-emerald-400" />
                      )}
                      <span className="text-xs text-gray-400">
                        {getRoleLabel(org.role)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[#00D4B3] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
