'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMotionSafe } from '@/lib/utils/motion'
import type { PremiumPasswordProps } from './types'
import styles from '../ProfileExperience.module.css'

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

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={styles.field}
      data-color-mode={colors.isLightMode ? 'light' : 'dark'}
      initial={{ opacity: 0, y: 12 }}
      transition={interfaceTransition}
    >
      <div className={`${styles.fieldShell} ${focused ? styles.fieldShellActive : ''} ${error ? styles.fieldShellError : ''}`}>
        <div className={styles.fieldRow}>
          <div className={`${styles.fieldBody} ${styles.fieldBodyNoIcon}`}>
            <label className={styles.fieldLabel}>{label}</label>
            <input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={event => onChange(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className={styles.fieldControl}
              aria-label={label}
            />
          </div>
          <button type="button" onClick={onToggle} className={styles.passwordToggle}>
            {show ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>
      {error ? (
        <p className={styles.fieldError}>
          {error}
        </p>
      ) : null}
    </motion.div>
  )
}
