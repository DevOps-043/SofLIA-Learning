'use client'

import { useParams, useRouter } from 'next/navigation'
import { ShieldX, LogOut, Mail } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SuspendedPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params?.orgSlug as string

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // silently fail
    }
    router.push('/auth')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"
        >
          <ShieldX className="w-10 h-10 text-red-400" />
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-3">
          Cuenta Suspendida
        </h1>

        {/* Message */}
        <p className="text-gray-300 mb-2 leading-relaxed">
          Tu acceso a esta organización ha sido suspendido por un administrador.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Si crees que esto es un error, contacta al administrador de tu organización para más información.
        </p>

        {/* Actions */}
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

        {/* Org slug indicator */}
        <p className="mt-6 text-xs text-gray-500">
          Organización: <span className="text-gray-400 font-mono">{orgSlug}</span>
        </p>
      </motion.div>
    </div>
  )
}
