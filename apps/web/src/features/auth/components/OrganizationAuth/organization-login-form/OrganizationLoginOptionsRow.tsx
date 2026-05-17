import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { OrganizationLoginOptionsProps } from './types'

export function OrganizationLoginOptionsRow(props: OrganizationLoginOptionsProps) {
  const { t } = useTranslation('common')

  return (
    <motion.div className="w-full flex items-center justify-between pt-1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
      <motion.label className="flex items-center gap-2.5 cursor-pointer group" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <div className="relative flex items-center justify-center">
          <input type="checkbox" {...props.register('rememberMe')} className="sr-only" />
          <motion.div className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 overflow-hidden" style={{ borderColor: props.rememberMe ? props.palette.primaryColor : props.palette.borderColor, backgroundColor: props.rememberMe ? props.palette.primaryColor : 'transparent' }} animate={{ scale: props.rememberMe ? 1.1 : 1 }} transition={{ duration: 0.2 }}>
            <AnimatePresence>
              {props.rememberMe && (
                <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ duration: 0.2, type: 'spring' }}>
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        <span className="text-xs font-medium transition-colors select-none" style={{ color: props.palette.textColor, opacity: props.rememberMe ? 1 : 0.7 }}>
          {t('auth.login.rememberMe')}
        </span>
      </motion.label>
      <button type="button" onClick={() => props.router.push('/auth/forgot-password')} className="text-xs font-medium transition-colors hover:opacity-80" style={{ color: props.palette.primaryColor }}>
        {t('auth.login.forgotPassword')}
      </button>
    </motion.div>
  )
}
