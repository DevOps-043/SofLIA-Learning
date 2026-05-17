'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMotionSafe } from '@/lib/utils/motion'
import type { PremiumPasswordProps } from './types'

export function PremiumPassword({
  label,
  value,
  onChange,
  show,
  onToggle,
  error,
  colors,
}: PremiumPasswordProps) {
  const [focused, setFocused] = useState(false)
  const { interfaceTransition } = useMotionSafe()
  const hasValue = value.length > 0
  const focusColor = error ? colors.error : colors.accent

  return (
    <motion.div className="relative group" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={interfaceTransition}>
      <motion.div className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${focusColor}40, transparent 50%, ${focusColor}20)` }} animate={{ opacity: focused ? 1 : 0 }} />
      <div className="relative rounded-2xl overflow-hidden transition-all duration-300 ease-out" style={{ boxShadow: focused ? `0 0 30px ${colors.accent}26` : 'none' }}>
        <div className="absolute inset-0 transition-all duration-300" style={{ backgroundColor: focused ? colors.bgSecondary : `${colors.bgSecondary}cc` }} />
        <div className="absolute inset-0 rounded-2xl border-2 transition-all duration-300" style={{ borderColor: error ? `${colors.error}60` : focused ? `${colors.accent}80` : colors.border }} />
        <div className="relative flex items-center">
          <div className="relative flex-1 py-5 px-4">
            <motion.label
              className="absolute left-4 pointer-events-none font-medium"
              initial={false}
              animate={{
                top: focused || hasValue ? '8px' : '50%',
                y: focused || hasValue ? 0 : '-50%',
                fontSize: focused || hasValue ? '11px' : '14px',
                color: error ? colors.error : focused ? colors.accent : colors.textSecondary,
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {label}
            </motion.label>
            <input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={event => onChange(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className={`w-full bg-transparent text-base font-medium focus:outline-none ${(focused || hasValue) ? 'pt-4' : 'pt-0'}`}
              style={{ color: colors.text }}
            />
          </div>
          <button type="button" onClick={onToggle} className="pr-5 text-sm font-medium" style={{ color: colors.textSecondary }}>
            {show ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>
      {error ? (
        <p className="mt-2 text-sm" style={{ color: colors.error }}>
          {error}
        </p>
      ) : null}
    </motion.div>
  )
}
