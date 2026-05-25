'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { RefObject } from 'react'
import type {
  DirectoryNavOption,
  PrefetchOnHover,
} from './mobile-bottom-nav.types'

interface DirectoryDropdownProps {
  dropdownRef: RefObject<HTMLDivElement>
  isOpen: boolean
  options: DirectoryNavOption[]
  prefetchOnHover: PrefetchOnHover
  onOptionClick: (route: string) => void
}

export function DirectoryDropdown({
  dropdownRef,
  isOpen,
  options,
  prefetchOnHover,
  onOptionClick,
}: DirectoryDropdownProps) {
  return (
    <div ref={dropdownRef} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden mb-2"
          >
            {options.map((option, index) => {
              const OptionIcon = option.icon

              return (
                <motion.button
                  key={option.id}
                  onClick={() => onOptionClick(option.route)}
                  {...prefetchOnHover(option.route)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full text-left first:border-b border-gray-200 dark:border-gray-700"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 2 }}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${option.gradient} flex items-center justify-center flex-shrink-0`}>
                    <OptionIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                      {option.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {option.description}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
