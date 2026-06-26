import { motion } from 'framer-motion'
import { cn } from '@/shared/utils/cn'
import type { MenuItemProps } from './types'

const ORG_ACCENT_COLOR = 'var(--org-accent-color, var(--color-accent))'

export function MenuItem({ icon: Icon, label, onClick, rightElement, highlight }: MenuItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3.5 py-1.5 mx-0.5 rounded-xl transition-all group text-sm',
        highlight
          ? 'hover:opacity-80 font-semibold'
          : 'text-gray-700 dark:text-[var(--color-legacy-c8cdd5)] hover:bg-black/5 dark:hover:bg-white/5 font-medium',
      )}
      style={highlight ? { color: ORG_ACCENT_COLOR } : undefined}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon
        className={cn(
          'w-[18px] h-[18px] flex-shrink-0',
          !highlight && 'text-[var(--color-legacy-8b95a5)]',
        )}
        style={highlight ? { color: ORG_ACCENT_COLOR } : undefined}
      />
      <span className="flex-1 text-left">{label}</span>
      {rightElement}
    </motion.button>
  )
}
