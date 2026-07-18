'use client'

import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import type { OrganizationAuthPalette } from '../organization-auth.styles'

interface DropdownOption {
  value: string
  label: string
}

interface OrganizationRegisterDropdownProps {
  id: string
  label: string
  options: DropdownOption[]
  placeholder: string
  value: string | null | undefined
  onChange: (value: string) => void
  palette: OrganizationAuthPalette
  error?: string
}

export function OrganizationRegisterDropdown({
  id,
  label,
  options,
  placeholder,
  value,
  onChange,
  palette,
  error,
}: OrganizationRegisterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen(true)
    }
    if (event.key === 'Escape') setIsOpen(false)
  }

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-wider mb-1.5"
        style={{ color: palette.textColor }}
      >
        {label}
      </label>
      <div className="relative">
        <button
          id={id}
          type="button"
          aria-controls={`${id}-options`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleTriggerKeyDown}
          className="flex h-[46px] w-full items-center justify-between gap-2 rounded-xl border px-4 text-sm transition-all duration-300"
          style={{
            backgroundColor: palette.inputBgColor,
            borderColor: isOpen
              ? palette.focusColor
              : error
                ? 'var(--color-error)'
                : selectedOption
                  ? `color-mix(in srgb, ${palette.primaryColor} 58%, ${palette.borderColor})`
                  : palette.borderColor,
            boxShadow: isOpen
              ? `0 0 0 3px color-mix(in srgb, ${palette.focusColor} 13%, transparent)`
              : 'none',
            color: selectedOption
              ? palette.textColor
              : `color-mix(in srgb, ${palette.textColor} 40%, transparent)`,
          }}
        >
          <span>{selectedOption?.label || placeholder}</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown
              className="w-4 h-4"
              style={{
                color: `color-mix(in srgb, ${palette.textColor} 50%, transparent)`,
              }}
            />
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              id={`${id}-options`}
              role="listbox"
              className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-64 overflow-y-auto rounded-xl border p-1 shadow-2xl backdrop-blur-xl scrollbar-thin"
              style={{
                backgroundColor: palette.cardBg,
                borderColor: `color-mix(in srgb, ${palette.textColor} 15%, transparent)`,
                boxShadow: `0 20px 48px -18px rgba(0,0,0,.7), 0 0 0 1px color-mix(in srgb, ${palette.primaryColor} 12%, transparent)`,
              }}
            >
              {options.map((option) => (
                <motion.button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={value === option.value}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor:
                      value === option.value
                        ? `color-mix(in srgb, ${palette.primaryColor} 20%, transparent)`
                        : 'transparent',
                    color:
                      value === option.value ? palette.focusColor : palette.textColor,
                  }}
                  whileHover={{ x: 2 }}
                >
                  <span>{option.label}</span>
                  {value === option.value ? <Check className="h-4 w-4" /> : null}
                </motion.button>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  )
}
