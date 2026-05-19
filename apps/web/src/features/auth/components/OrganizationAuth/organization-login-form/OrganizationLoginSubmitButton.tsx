import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import type { OrganizationAuthPalette } from './types'

export function OrganizationLoginSubmitButton(props: {
  isPending: boolean
  palette: OrganizationAuthPalette
}) {
  const { t } = useTranslation('common')

  return (
    <motion.div className="pt-2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
      <motion.button type="submit" disabled={props.isPending} aria-disabled={props.isPending} className="w-full relative overflow-hidden group rounded-xl py-3.5 px-5 font-semibold text-sm text-white transition-all duration-300 border-0" style={{ backgroundColor: props.palette.primaryColor, boxShadow: `0 4px 14px -2px color-mix(in srgb, ${props.palette.primaryColor} 25.1%, transparent)` }} whileHover={{ scale: 1.01, boxShadow: `0 6px 20px -2px color-mix(in srgb, ${props.palette.primaryColor} 31.4%, transparent)` }} whileTap={{ scale: 0.99 }}>
        <span className="relative z-10 flex items-center justify-center gap-2">
          {props.isPending ? (
            <>
              <motion.div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              <span className="text-xs">{t('auth.org.signingIn')}</span>
            </>
          ) : (
            <span>{t('auth.login.signIn')}</span>
          )}
        </span>
      </motion.button>
    </motion.div>
  )
}
