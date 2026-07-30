'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import { useMotionSafe } from '@/lib/utils/motion'
import type { PremiumTextareaProps } from './types'
import styles from '../ProfileExperience.module.css'

export function PremiumTextarea({
  label,
  value,
  onChange,
  maxLength = 500,
  rows = 4,
  colors,
}: PremiumTextareaProps) {
  const textareaId = useId()
  const { interfaceTransition } = useMotionSafe()
  const charCount = value.length
  const isNearLimit = charCount > maxLength * 0.8

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={styles.field}
      data-color-mode={colors.isLightMode ? 'light' : 'dark'}
      initial={{ opacity: 0, y: 12 }}
      transition={interfaceTransition}
    >
      <div className={styles.textAreaShell}>
          <label className={styles.textAreaLabel} htmlFor={textareaId}>{label}</label>
          <textarea
            id={textareaId}
            value={value}
            onChange={event => onChange(event.target.value)}
            rows={rows}
            maxLength={maxLength}
            className={styles.textArea}
          />
          <span
            className={styles.charCount}
            style={isNearLimit ? { color: colors.warning } : undefined}
          >
            {charCount}/{maxLength}
          </span>
      </div>
    </motion.div>
  )
}
