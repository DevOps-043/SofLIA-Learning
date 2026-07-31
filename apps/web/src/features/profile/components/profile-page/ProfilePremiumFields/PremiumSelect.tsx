'use client'

import { useState } from 'react'
import * as Select from '@radix-ui/react-select'
import { motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { useMotionSafe } from '@/lib/utils/motion'
import type { PremiumSelectProps } from './types'
import styles from '../ProfileExperience.module.css'

const EMPTY_SELECT_VALUE = '__empty__'

export function PremiumSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  colors,
}: PremiumSelectProps) {
  const [open, setOpen] = useState(false)
  const { interfaceTransition } = useMotionSafe()

  const isLight = Boolean(colors?.isLightMode)
  const surfaceBg = isLight ? '#FFFFFF' : '#1A212B'
  const textColor = isLight ? '#1E293B' : '#F8FAFC'
  const borderColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.14)'
  const shadowStyle = isLight
    ? '0 1.25rem 3.5rem rgba(2, 12, 23, 0.15)'
    : '0 1.25rem 3.5rem rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={styles.field}
      data-color-mode={isLight ? 'light' : 'dark'}
      initial={{ opacity: 0, y: 12 }}
      transition={interfaceTransition}
    >
      <Select.Root
        value={value || EMPTY_SELECT_VALUE}
        onValueChange={nextValue => onChange(nextValue === EMPTY_SELECT_VALUE ? '' : nextValue)}
        open={open}
        onOpenChange={setOpen}
      >
        <Select.Trigger className={styles.selectTrigger}>
          <span className={styles.selectLabel}>{label}</span>
          <span className={styles.selectValue}>
            <Select.Value placeholder={placeholder} />
          </span>
          <Select.Icon asChild>
            <ChevronDown className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={8}
            className={styles.selectContent}
            data-color-mode={isLight ? 'light' : 'dark'}
            style={{
              minWidth: 'var(--radix-select-trigger-width)',
              backgroundColor: surfaceBg,
              color: textColor,
              borderColor,
              boxShadow: shadowStyle,
            }}
          >
            <Select.Viewport>
              <Select.Item value={EMPTY_SELECT_VALUE} className={styles.selectItem}>
                <Select.ItemText>{placeholder}</Select.ItemText>
              </Select.Item>
              {options.map(option => (
                <Select.Item key={option.value} value={option.value} className={styles.selectItem}>
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className={styles.selectIndicator}>
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </motion.div>
  )
}
