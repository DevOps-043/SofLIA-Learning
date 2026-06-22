'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMotionSafe } from '@/lib/utils/motion'
import type { PremiumInputProps } from './types'

export function PremiumInput({
  label,
  value,
  onChange,
  icon,
  type = 'text',
  placeholder,
  max,
  colors,
}: PremiumInputProps) {
  const [focused, setFocused] = useState(false)
  const { interfaceTransition } = useMotionSafe()
  const hasValue = value.length > 0

  return (
    <motion.div className="relative group" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={interfaceTransition}>
      <motion.div className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${colors.accent} 25.1%, transparent), transparent 50%, color-mix(in srgb, ${colors.accent} 12.5%, transparent))` }} animate={{ opacity: focused ? 1 : 0 }} />
      <div className="relative rounded-2xl overflow-hidden transition-all duration-300 ease-out" style={{ boxShadow: focused ? `0 0 30px color-mix(in srgb, ${colors.accent} 14.9%, transparent)` : 'none' }}>
        <div className="absolute inset-0 transition-all duration-300" style={{ backgroundColor: focused ? colors.bgSecondary : `color-mix(in srgb, ${colors.bgSecondary} 80%, transparent)` }} />
        <div className="absolute inset-0 rounded-2xl border-2 transition-all duration-300" style={{ borderColor: focused ? `color-mix(in srgb, ${colors.accent} 50.2%, transparent)` : colors.border }} />
        <div className="relative flex items-center">
          {icon ? (
            <div className="pl-5 flex-shrink-0 transition-transform duration-200" style={{ color: focused ? colors.accent : colors.textSecondary, transform: focused ? 'scale(1.1)' : 'scale(1)' }}>
              {icon}
            </div>
          ) : null}
          <div className="relative flex-1 py-5 px-4">
            <motion.label
              className="absolute left-4 pointer-events-none font-medium"
              initial={false}
              animate={{
                top: focused || hasValue ? '8px' : '50%',
                y: focused || hasValue ? 0 : '-50%',
                fontSize: focused || hasValue ? '11px' : '14px',
                color: focused ? colors.accent : colors.textSecondary,
                letterSpacing: focused || hasValue ? '0.5px' : '0',
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {label}
            </motion.label>
            <input
              type={type}
              value={value}
              onChange={event => onChange(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={focused ? placeholder : ''}
              max={max}
              className={`w-full bg-transparent text-base font-medium focus:outline-none ${(focused || hasValue) ? 'pt-4' : 'pt-0'}`}
              style={{ color: colors.text }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
