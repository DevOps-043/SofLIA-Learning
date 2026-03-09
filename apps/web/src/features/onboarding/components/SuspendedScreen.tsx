'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldX, LogOut, Mail, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SuspendedScreenProps {
  /** 'suspended' = org-level, 'banned' = global ban */
  type: 'suspended' | 'banned'
  organizationName?: string
  banReason?: string
}

const SUPPORT_EMAIL = 'soporte@SofLIA.com'

function buildEmailLinks(type: 'suspended' | 'banned', organizationName?: string) {
  const subject = type === 'banned'
    ? 'Solicitud de revisión - Cuenta bloqueada'
    : `Solicitud de revisión - Cuenta suspendida${organizationName ? ` en ${organizationName}` : ''}`

  const body = type === 'banned'
    ? 'Hola equipo de soporte,\n\nMi cuenta ha sido bloqueada y me gustaría solicitar una revisión.\n\nGracias.'
    : `Hola equipo de soporte,\n\nMi cuenta ha sido suspendida${organizationName ? ` en la organización "${organizationName}"` : ''} y me gustaría solicitar una revisión.\n\nGracias.`

  const encodedSubject = encodeURIComponent(subject)
  const encodedBody = encodeURIComponent(body)

  return [
    {
      name: 'Gmail',
      icon: (
        <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-5 h-5 object-contain" />
      ),
      color: 'from-red-500/20 to-orange-500/20 border-red-500/20 hover:border-red-400/40',
      url: `https://mail.google.com/mail/?view=cm&to=${SUPPORT_EMAIL}&su=${encodedSubject}&body=${encodedBody}`,
    },
    {
      name: 'Outlook / Hotmail',
      icon: (
        <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" alt="Outlook" className="w-5 h-5 object-contain" />
      ),
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/20 hover:border-blue-400/40',
      url: `https://outlook.live.com/mail/0/deeplink/compose?to=${SUPPORT_EMAIL}&subject=${encodedSubject}&body=${encodedBody}`,
    },
    {
      name: 'Yahoo Mail',
      icon: (
        <img src="https://upload.wikimedia.org/wikipedia/commons/3/3a/Yahoo%21_Mail_logo.svg" alt="Yahoo Mail" className="w-5 h-5 object-contain" />
      ),
      color: 'from-purple-500/20 to-violet-500/20 border-purple-500/20 hover:border-purple-400/40',
      url: `https://compose.mail.yahoo.com/?to=${SUPPORT_EMAIL}&subject=${encodedSubject}&body=${encodedBody}`,
    },
    {
      name: 'Otra app de correo',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2.5"/>
          <path d="M2 6.5L12 13L22 6.5"/>
        </svg>
      ),
      color: 'from-gray-500/20 to-gray-600/20 border-gray-500/20 hover:border-gray-400/40',
      url: `mailto:${SUPPORT_EMAIL}?subject=${encodedSubject}&body=${encodedBody}`,
    },
  ]
}

export function SuspendedScreen({ type, organizationName, banReason }: SuspendedScreenProps) {
  const router = useRouter()
  const [showEmailPicker, setShowEmailPicker] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // silently fail
    }
    router.push('/auth')
  }

  const isBanned = type === 'banned'
  const emailLinks = buildEmailLinks(type, organizationName)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl"
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
          {isBanned ? 'Cuenta Bloqueada' : 'Cuenta Suspendida'}
        </h1>

        {/* Message */}
        <p className="text-gray-300 mb-2 leading-relaxed">
          {isBanned
            ? 'Tu cuenta ha sido bloqueada por un administrador de la plataforma.'
            : `Tu acceso a la organización ${organizationName ? `"${organizationName}"` : ''} ha sido suspendido.`
          }
        </p>

        {banReason && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">
              <strong>Motivo:</strong> {banReason}
            </p>
          </div>
        )}

        <p className="text-gray-400 text-sm mb-8">
          {isBanned
            ? 'Si crees que esto es un error, contacta a soporte para más información.'
            : 'Si crees que esto es un error, contacta al administrador de tu organización.'
          }
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowEmailPicker(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium transition-all"
          >
            <Mail className="w-4 h-4" />
            Contactar Soporte
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>

        {/* Org indicator */}
        {organizationName && !isBanned && (
          <p className="mt-6 text-xs text-gray-500">
            Organización: <span className="text-gray-400">{organizationName}</span>
          </p>
        )}
      </motion.div>

      {/* Email Provider Picker Modal */}
      <AnimatePresence>
        {showEmailPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowEmailPicker(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-teal-400" />
                  Elige tu correo
                </h2>
                <button
                  onClick={() => setShowEmailPicker(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Email Options */}
              <div className="p-4 space-y-2">
                <p className="text-gray-400 text-sm mb-3 px-1">
                  Se abrirá tu correo con un mensaje predefinido para soporte.
                </p>

                {emailLinks.map((provider, index) => (
                  <motion.a
                    key={provider.name}
                    href={provider.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gradient-to-r ${provider.color} border text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98]`}
                    onClick={() => setTimeout(() => setShowEmailPicker(false), 300)}
                  >
                    <span className="w-7 flex items-center justify-center">{provider.icon}</span>
                    <span className="text-sm">{provider.name}</span>
                  </motion.a>
                ))}
              </div>

              {/* Footer hint */}
              <div className="px-6 py-3 border-t border-white/5">
                <p className="text-xs text-gray-500 text-center">
                  Destinatario: <span className="text-gray-400 font-mono">{SUPPORT_EMAIL}</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
