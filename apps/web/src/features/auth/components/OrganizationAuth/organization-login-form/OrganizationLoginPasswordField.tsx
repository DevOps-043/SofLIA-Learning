import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { FieldError } from './FieldError'
import type { OrganizationLoginFieldProps } from './types'

interface PasswordFieldProps extends OrganizationLoginFieldProps {
  setShowPassword: (show: boolean) => void
  showPassword: boolean
}

export function OrganizationLoginPasswordField(props: PasswordFieldProps) {
  const { t } = useTranslation('common')
  const focused = props.focusedField === 'password'

  return (
    <motion.div className="space-y-1.5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
      <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider mb-1.5 transition-all duration-200" style={{ color: focused ? props.palette.focusColor : props.palette.textColor, opacity: focused ? 1 : 0.7 }}>
        {t('auth.login.passwordLabel')}
      </label>
      <motion.div className="relative rounded-xl border transition-all duration-300 overflow-hidden" style={{ backgroundColor: props.palette.inputBgColor, borderColor: focused ? props.palette.focusColor : props.errors.password ? 'var(--color-error)' : props.palette.borderColor, borderWidth: focused ? '2px' : '1px', boxShadow: focused ? `0 0 0 3px color-mix(in srgb, ${props.palette.focusColor} 12.5%, transparent), 0 4px 12px -2px rgba(0, 0, 0, 0.2)` : 'none' }} animate={{ scale: focused ? 1.005 : 1 }} transition={{ duration: 0.2 }}>
        {focused && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: props.palette.focusColor }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3 }} />}
        <div className="flex items-center px-4 py-3">
          <Lock className="w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200" style={{ color: focused ? props.palette.focusColor : `color-mix(in srgb, ${props.palette.textColor} 31.4%, transparent)` }} />
          <input id="password" type={props.showPassword ? 'text' : 'password'} placeholder="********" autoComplete="current-password" disabled={props.isPending} {...props.register('password')} onFocus={() => props.setFocusedField('password')} onBlur={() => props.setFocusedField(null)} className="flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal tracking-widest disabled:cursor-not-allowed disabled:opacity-70" style={{ color: props.palette.textColor, letterSpacing: '0.15em' }} />
          <motion.button type="button" onClick={() => props.setShowPassword(!props.showPassword)} disabled={props.isPending} className="ml-2 p-1.5 rounded-lg transition-colors flex-shrink-0 hover:opacity-70" style={{ color: focused ? props.palette.focusColor : `color-mix(in srgb, ${props.palette.textColor} 31.4%, transparent)`, backgroundColor: focused ? `color-mix(in srgb, ${props.palette.focusColor} 8.2%, transparent)` : 'transparent' }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            {props.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </motion.button>
        </div>
      </motion.div>
      <FieldError message={props.errors.password?.message} />
    </motion.div>
  )
}
