'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'

interface Option {
  value: string
  label: string
  icon?: React.ReactNode
}

interface PremiumSelectProps {
  value: string
  onChange?: (value: string) => void
  onValueChange?: (value: string) => void
  options: Option[]
  placeholder?: string
  icon?: React.ReactNode
  className?: string
  emptyMessage?: string
}

export function PremiumSelect({
  value,
  onChange,
  onValueChange,
  options,
  placeholder = 'Seleccionar...',
  icon,
  className = '',
  emptyMessage = 'Sin opciones'
}: PremiumSelectProps) {
  const theme = useBusinessPanelTheme()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find(opt => opt.value === value)

  const handleValueChange = onValueChange || onChange || (() => { })
  const hasActiveSelection = value !== 'all' && value !== options[0]?.value

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={`relative min-w-[160px] ${className}`}>
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.98 }}
        className="w-full px-4 py-3.5 rounded-xl border-2 flex items-center justify-between gap-3 transition-all duration-300 group"
        style={{
          backgroundColor: theme.inputBg,
          borderColor: hasActiveSelection ? theme.primaryColor : theme.borderColor,
          color: theme.textColor,
          boxShadow: hasActiveSelection ? `0 0 0 1px color-mix(in srgb, ${theme.primaryColor} 18.8%, transparent)` : 'none'
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <span
              className="flex-shrink-0 transition-colors duration-200"
              style={{ color: hasActiveSelection ? theme.primaryColor : theme.mutedTextColor }}
            >
              {icon}
            </span>
          )}

          <span
            className="text-sm font-medium truncate"
            style={{ color: selectedOption ? theme.textColor : theme.mutedTextColor }}
          >
            {selectedOption?.label || placeholder}
          </span>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown
            className="w-4 h-4 transition-colors duration-200"
            style={{ color: theme.mutedTextColor }}
          />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden backdrop-blur-xl"
            style={{
              backgroundColor: theme.panelBg,
              borderColor: theme.borderColor,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              zIndex: 9999
            }}
          >
            <div
              className="py-2 max-h-64 overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: `${theme.borderColor} transparent`
              }}
            >
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-center" style={{ color: theme.mutedTextColor }}>
                  {emptyMessage}
                </div>
              ) : (
                options.map((option, index) => {
                  const isSelected = option.value === value

                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => {
                        handleValueChange(option.value)
                        setIsOpen(false)
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-all duration-150"
                      style={{
                        backgroundColor: isSelected ? `color-mix(in srgb, ${theme.primaryColor} 12.5%, transparent)` : 'transparent',
                        color: isSelected ? theme.textColor : theme.subtextColor
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = theme.hoverBg
                          e.currentTarget.style.color = theme.textColor
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = theme.subtextColor
                        }
                      }}
                    >
                      {option.icon && (
                        <span
                          className="flex-shrink-0"
                          style={{ color: isSelected ? theme.primaryColor : theme.mutedTextColor }}
                        >
                          {option.icon}
                        </span>
                      )}

                      <span className="flex-1 font-medium">{option.label}</span>

                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          <Check className="w-4 h-4" style={{ color: theme.primaryColor }} />
                        </motion.span>
                      )}
                    </motion.button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
