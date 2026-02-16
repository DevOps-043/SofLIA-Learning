'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

interface ApprovedRedirectProps {
  organizationSlug?: string
}

export function ApprovedRedirect({ organizationSlug }: ApprovedRedirectProps) {
  const router = useRouter()
  const { t } = useTranslation('common')

  useEffect(() => {
    // Clear auth cache so it picks up updated cargo_rol
    try {
      localStorage.removeItem('user-auth-cache')
    } catch { /* ignore */ }

    const timer = setTimeout(() => {
      if (organizationSlug) {
        router.push(`/${organizationSlug}/dashboard`)
      } else {
        // Fallback: reload to let login redirect handle it
        window.location.reload()
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [organizationSlug, router])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="w-10 h-10 text-green-400" />
      </motion.div>

      <h2 className="text-2xl font-bold text-white mb-3">
        {t('orgOnboarding.approved')}
      </h2>

      <p className="text-gray-400 leading-relaxed">
        {t('orgOnboarding.approvedDesc')}
      </p>
    </motion.div>
  )
}
