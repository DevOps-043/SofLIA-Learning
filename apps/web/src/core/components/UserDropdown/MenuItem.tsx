import { motion } from 'framer-motion'
import { cn } from '@/shared/utils/cn'
import type { MenuItemProps } from './types'

export function MenuItem({ icon: Icon, label, onClick, rightElement, highlight }: MenuItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2 mx-0.5 rounded-xl transition-all group text-sm',
        highlight
          ? 'text-[#00D4B3] hover:bg-[#00D4B3]/10 font-semibold'
          : 'text-gray-700 dark:text-[#C8CDD5] hover:bg-black/5 dark:hover:bg-white/5 font-medium',
      )}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon
        className={cn(
          'w-[18px] h-[18px] flex-shrink-0',
          highlight ? 'text-[#00D4B3]' : 'text-[#8B95A5] group-hover:text-[#00D4B3]',
        )}
      />
      <span className="flex-1 text-left">{label}</span>
      {rightElement}
    </motion.button>
  )
}
