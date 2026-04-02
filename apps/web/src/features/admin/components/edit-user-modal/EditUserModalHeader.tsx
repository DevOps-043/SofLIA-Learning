'use client'

import { motion } from 'framer-motion'
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface EditUserModalHeaderProps {
  title: string
  onClose: () => void
}

export function EditUserModalHeader({
  title,
  onClose,
}: EditUserModalHeaderProps) {
  return (
    <div className="relative bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 dark:from-[#0A2540] dark:to-[#0A2540]/80 px-6 py-4 border-b border-[#0A2540]/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00D4B3]/20 flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-[#00D4B3]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Editar Usuario</h3>
            <p className="text-xs text-white/70">{title}</p>
          </div>
        </div>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
        >
          <XMarkIcon className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  )
}
