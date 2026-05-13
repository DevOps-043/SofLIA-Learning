'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { UserIcon, AcademicCapIcon, ShieldCheckIcon, ChevronDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { SOFLIA_ADMIN_COLORS } from '../../constants/admin-color-tokens'

interface RoleSelectProps {
  value: string
  onChange: (value: string) => void
}

export function RoleSelect({ value, onChange }: RoleSelectProps) {
  const { t } = useTranslation('admin')
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const selectRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const roles = [
    { value: 'Usuario', label: 'Usuario', icon: UserIcon, color: SOFLIA_ADMIN_COLORS.success },
    { value: 'Instructor', label: 'Instructor', icon: AcademicCapIcon, color: SOFLIA_ADMIN_COLORS.warning },
    { value: 'Administrador', label: 'Administrador', icon: ShieldCheckIcon, color: SOFLIA_ADMIN_COLORS.primary }
  ]

  const selectedRole = roles.find(r => r.value === value) || roles[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setDropdownPosition({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX, width: rect.width })
      }
    }
    return () => { document.removeEventListener('mousedown', handleClickOutside) }
  }, [isOpen])

  return (
    <div className="group" ref={selectRef}>
      <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
        {t('users.demographics.role')} *
      </label>
      <div className="relative">
        <motion.button
          ref={buttonRef} type="button" onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          className={`w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#0A0D12] border rounded-xl text-[#0A2540] dark:text-white transition-all duration-200 flex items-center justify-between ${
            isOpen ? 'border-[#00D4B3] ring-2 ring-[#00D4B3]/40' : 'border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheckIcon className={`h-4 w-4 transition-colors ${isOpen ? 'text-[#00D4B3]' : 'text-[#6C757D] dark:text-white/60'}`} />
            <span className="font-medium">{t(`users.roles.${selectedRole.value}`)}</span>
          </div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDownIcon className={`h-4 w-4 transition-colors ${isOpen ? 'text-[#00D4B3]' : 'text-[#6C757D] dark:text-white/60'}`} />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[55]" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed z-[60] bg-white dark:bg-[#1E2329] rounded-xl shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden"
                style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px`, width: `${dropdownPosition.width}px` }}
              >
                <div className="p-1.5">
                  {roles.map((role, index) => {
                    const RoleIcon = role.icon
                    const isSelected = role.value === value
                    return (
                      <motion.button
                        key={role.value} type="button"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 4, backgroundColor: isSelected ? undefined : 'rgba(0, 212, 179, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { onChange(role.value); setIsOpen(false) }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                          isSelected ? 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#00D4B3]' : 'text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#00D4B3]/20' : 'bg-[#E9ECEF] dark:bg-[#0A0D12]'}`}>
                            <RoleIcon className={`h-4 w-4 ${isSelected ? 'text-[#00D4B3]' : 'text-[#6C757D] dark:text-white/60'}`} />
                          </div>
                          <span className="font-medium">{t(`users.roles.${role.value}`)}</span>
                        </div>
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                            <CheckCircleIcon className="h-5 w-5 text-[#00D4B3]" />
                          </motion.div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
