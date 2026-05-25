'use client'

import { useState } from 'react'
import * as Select from '@radix-ui/react-select'
import { motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { useMotionSafe } from '@/lib/utils/motion'
import type { PremiumSelectProps } from './types'

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

  return (
    <motion.div className="relative group" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={interfaceTransition}>
      <motion.div className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${colors.accent} 25.1%, transparent), transparent 50%, color-mix(in srgb, ${colors.accent} 12.5%, transparent))` }} animate={{ opacity: open ? 1 : 0 }} />
      <Select.Root value={value || EMPTY_SELECT_VALUE} onValueChange={nextValue => onChange(nextValue === EMPTY_SELECT_VALUE ? '' : nextValue)} open={open} onOpenChange={setOpen}>
        <Select.Trigger
          className="relative flex min-h-[68px] w-full items-center rounded-2xl border-2 px-5 text-left transition-all duration-300 focus:outline-none"
          style={{
            backgroundColor: open ? colors.bgSecondary : `color-mix(in srgb, ${colors.bgSecondary} 80%, transparent)`,
            borderColor: open ? `color-mix(in srgb, ${colors.accent} 50.2%, transparent)` : colors.border,
            boxShadow: open ? `0 0 30px color-mix(in srgb, ${colors.accent} 14.9%, transparent)` : 'none',
            color: colors.text,
          }}
        >
          <span className="min-w-0 flex-1 pt-4">
            <span className="absolute left-5 top-3 text-[11px] font-medium tracking-wide" style={{ color: open ? colors.accent : colors.textSecondary }}>
              {label}
            </span>
            <Select.Value placeholder={placeholder} />
          </span>
          <Select.Icon asChild>
            <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" style={{ color: open ? colors.accent : colors.textSecondary }} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content position="popper" sideOffset={8} className="z-50 max-h-72 overflow-hidden rounded-2xl border p-2 shadow-2xl" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.text, minWidth: 'var(--radix-select-trigger-width)' }}>
            <Select.Viewport>
              <Select.Item value={EMPTY_SELECT_VALUE} className="relative flex cursor-pointer select-none items-center rounded-xl px-4 py-3 text-sm outline-none transition-colors data-[highlighted]:bg-black/5 dark:data-[highlighted]:bg-white/10">
                <Select.ItemText>{placeholder}</Select.ItemText>
              </Select.Item>
              {options.map(option => (
                <Select.Item key={option.value} value={option.value} className="relative flex cursor-pointer select-none items-center rounded-xl px-4 py-3 text-sm outline-none transition-colors data-[highlighted]:bg-black/5 dark:data-[highlighted]:bg-white/10">
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="absolute right-4" style={{ color: colors.accent }}>
                    <Check className="w-4 h-4" />
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
