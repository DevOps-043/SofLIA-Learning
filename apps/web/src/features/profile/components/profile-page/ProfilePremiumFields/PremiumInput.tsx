'use client'

import { useId, useState } from 'react'
import { motion } from 'framer-motion'
import { useMotionSafe } from '@/lib/utils/motion'
import type { PremiumInputProps } from './types'
import styles from '../ProfileExperience.module.css'

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
  const inputId = useId()
  const { interfaceTransition } = useMotionSafe()

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={styles.field}
      data-color-mode={colors.isLightMode ? 'light' : 'dark'}
      initial={{ opacity: 0, y: 12 }}
      transition={interfaceTransition}
    >
      <div className={`${styles.fieldShell} ${focused ? styles.fieldShellActive : ''}`}>
        <div className={styles.fieldRow}>
          {icon ? (
            <span className={`${styles.fieldIcon} ${focused ? styles.fieldIconActive : ''}`}>
              {icon}
            </span>
          ) : null}
          <div className={`${styles.fieldBody} ${icon ? '' : styles.fieldBodyNoIcon}`}>
            <label className={styles.fieldLabel} htmlFor={inputId}>
              {label}
            </label>
            <input
              id={inputId}
              type={type}
              value={value}
              onChange={event => onChange(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={placeholder}
              max={max}
              className={styles.fieldControl}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
