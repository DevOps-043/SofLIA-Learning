import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { FieldError } from './FieldError'
import type { OrganizationLoginFieldProps } from './types'

export function OrganizationLoginEmailField(props: OrganizationLoginFieldProps) {
  const { t } = useTranslation('common')
  const focused = props.focusedField === 'emailOrUsername'

  return (
    <motion.div className="space-y-1.5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
      <label htmlFor="emailOrUsername" className="block text-xs font-medium uppercase tracking-wider mb-1.5 transition-all duration-200" style={{ color: focused ? props.palette.focusColor : props.palette.textColor, opacity: focused ? 1 : 0.7 }}>
        {t('auth.login.emailOrUsernameLabel')}
      </label>
      <motion.div data-auth-control className="relative rounded-xl border transition-all duration-300 overflow-hidden" style={{ backgroundColor: props.palette.inputBgColor, borderColor: focused ? props.palette.focusColor : props.errors.emailOrUsername ? 'var(--color-error)' : props.palette.borderColor, borderWidth: focused ? '2px' : '1px', boxShadow: focused ? `0 0 0 3px color-mix(in srgb, ${props.palette.focusColor} 12.5%, transparent), 0 4px 12px -2px rgba(0, 0, 0, 0.2)` : 'none' }} animate={{ scale: focused ? 1.005 : 1 }} transition={{ duration: 0.2 }}>
        {focused && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: props.palette.focusColor }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3 }} />}
        <div className="flex items-center px-4 py-3">
          <Mail className="w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200" style={{ color: focused ? props.palette.focusColor : `color-mix(in srgb, ${props.palette.textColor} 31.4%, transparent)` }} />
          <input id="emailOrUsername" type="text" placeholder={t('auth.org.emailOrUsernamePlaceholder')} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} disabled={props.isPending} {...props.register('emailOrUsername')} onFocus={() => props.setFocusedField('emailOrUsername')} onBlur={() => props.setFocusedField(null)} className="flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal disabled:cursor-not-allowed disabled:opacity-70" style={{ color: props.palette.textColor }} />
        </div>
      </motion.div>
      <FieldError message={props.errors.emailOrUsername?.message} />
    </motion.div>
  )
}
