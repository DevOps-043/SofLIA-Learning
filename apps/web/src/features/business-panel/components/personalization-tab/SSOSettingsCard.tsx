'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import type { OrganizationData } from '../../hooks/useBusinessSettings'
import type { PersonalizationTabState } from './personalization.types'
import { GoogleLogo, MicrosoftLogo } from './SocialProviderLogo'
import { SocialLoginToggle } from './SocialLoginToggle'

export function SSOSettingsCard({
  organization,
  state,
}: {
  organization: OrganizationData
  state: PersonalizationTabState
}) {
  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="relative rounded-2xl p-6 border backdrop-blur-xl overflow-hidden group bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-slate-700/30">
      <div className="relative flex items-center gap-3 mb-6">
        <motion.div whileHover={{ rotate: 15, scale: 1.1 }} className="p-3 rounded-xl bg-purple-600">
          <Sparkles className="w-5 h-5 text-white" />
        </motion.div>
        <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">Inicio de Sesion Social (SSO)</h3><p className="text-sm text-gray-500 dark:text-gray-400">Permite a tus usuarios iniciar sesion con sus cuentas de Google o Microsoft</p></div>
      </div>
      <div className="space-y-4">
        <SocialLoginToggle description="Permitir inicio de sesion con Google" enabled={organization.google_login_enabled ?? false} icon={<GoogleLogo />} isUpdating={state.isUpdatingGoogle} name="Google" onToggle={() => state.handleToggleSSO('google', !organization.google_login_enabled)} />
        <SocialLoginToggle description="Permitir inicio de sesion con Microsoft" enabled={organization.microsoft_login_enabled ?? false} icon={<MicrosoftLogo />} isUpdating={state.isUpdatingMicrosoft} name="Microsoft" onToggle={() => state.handleToggleSSO('microsoft', !organization.microsoft_login_enabled)} />
      </div>
    </motion.div>
  )
}
