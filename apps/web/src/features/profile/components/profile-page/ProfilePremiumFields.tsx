'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { ProfileColorPalette } from '../../types/profile.types'

interface PremiumInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  icon?: JSX.Element | null
  type?: string
  placeholder?: string
  colors: ProfileColorPalette
}

export function PremiumInput({ label, value, onChange, icon, type = 'text', placeholder, colors }: PremiumInputProps) {
  const [focused, setFocused] = useState(false)
  const hasValue = value.length > 0

  return (
    <motion.div className="relative group" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${colors.accent}40, transparent 50%, ${colors.accent}20)` }}
        animate={{ opacity: focused ? 1 : 0 }}
      />

      <div className="relative rounded-2xl overflow-hidden transition-all duration-300 ease-out" style={{ boxShadow: focused ? `0 0 30px ${colors.accent}26` : 'none' }}>
        <div className="absolute inset-0 transition-all duration-300" style={{ backgroundColor: focused ? colors.bgSecondary : `${colors.bgSecondary}cc` }} />
        <div className="absolute inset-0 rounded-2xl border-2 transition-all duration-300" style={{ borderColor: focused ? `${colors.accent}80` : colors.border }} />

        <div className="relative flex items-center">
          {icon ? (
            <div
              className="pl-5 flex-shrink-0 transition-transform duration-200"
              style={{
                color: focused ? colors.accent : colors.textSecondary,
                transform: focused ? 'scale(1.1)' : 'scale(1)'
              }}
            >
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
                letterSpacing: focused || hasValue ? '0.5px' : '0'
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
              className={`w-full bg-transparent text-base font-medium focus:outline-none placeholder-white/20 ${(focused || hasValue) ? 'pt-4' : 'pt-0'}`}
              style={{ color: colors.text }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface PremiumTextareaProps {
  label: string
  value: string
  onChange: (value: string) => void
  maxLength?: number
  rows?: number
  colors: ProfileColorPalette
}

export function PremiumTextarea({
  label,
  value,
  onChange,
  maxLength = 500,
  rows = 4,
  colors
}: PremiumTextareaProps) {
  const [focused, setFocused] = useState(false)
  const charCount = value.length
  const isNearLimit = charCount > maxLength * 0.8

  return (
    <motion.div className="relative group" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${colors.accent}40, transparent 50%, ${colors.accent}20)` }}
        animate={{ opacity: focused ? 1 : 0 }}
      />

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

interface PremiumPasswordProps {
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggle: () => void
  error?: string
  colors: ProfileColorPalette
}

export function PremiumPassword({ label, value, onChange, show, onToggle, error, colors }: PremiumPasswordProps) {
  const [focused, setFocused] = useState(false)
  const hasValue = value.length > 0

  return (
    <motion.div className="relative group" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${(error ? colors.error : colors.accent)}40, transparent 50%, ${(error ? colors.error : colors.accent)}20)` }}
        animate={{ opacity: focused ? 1 : 0 }}
      />

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
                color: error ? colors.error : focused ? colors.accent : colors.textSecondary
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
