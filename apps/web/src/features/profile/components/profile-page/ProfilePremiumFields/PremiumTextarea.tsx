'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMotionSafe } from '@/lib/utils/motion'
import type { PremiumTextareaProps } from './types'

export function PremiumTextarea({
  label,
  value,
  onChange,
  maxLength = 500,
  rows = 4,
  colors,
}: PremiumTextareaProps) {
  const [focused, setFocused] = useState(false)
  const { interfaceTransition } = useMotionSafe()
  const charCount = value.length
  const isNearLimit = charCount > maxLength * 0.8

  return (
    <motion.div className="relative group" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={interfaceTransition}>
      <motion.div className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${colors.accent}40, transparent 50%, ${colors.accent}20)` }} animate={{ opacity: focused ? 1 : 0 }} />
      <div className="relative rounded-2xl overflow-hidden transition-all duration-300" style={{ boxShadow: focused ? `0 0 30px ${colors.accent}26` : 'none' }}>
        <div className="absolute inset-0" style={{ backgroundColor: focused ? colors.bgSecondary : `${colors.bgSecondary}cc` }} />
        <div className="absolute inset-0 rounded-2xl border-2 transition-colors duration-300" style={{ borderColor: focused ? `${colors.accent}80` : colors.border }} />
        <div className="relative p-5">
          <motion.label className="block mb-3 font-medium text-xs tracking-wide" animate={{ color: focused ? colors.accent : colors.textSecondary }}>
            {label}
          </motion.label>
          <textarea
            value={value}
            onChange={event => onChange(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={rows}
            maxLength={maxLength}
            className="w-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed"
            style={{ color: colors.text }}
          />
          <div className="flex justify-end mt-3">
            <span className="text-xs" style={{ color: isNearLimit ? colors.warning : colors.textSecondary }}>
              {charCount}/{maxLength}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
