import { motion } from 'framer-motion'
import { cn } from '@/shared/utils/cn'
import type { MenuItemProps } from './types'
import styles from './UserDropdown.module.css'

export function MenuItem({ icon: Icon, label, onClick, rightElement, highlight }: MenuItemProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        styles.menuItem,
        highlight && styles.menuItemHighlight,
      )}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className={styles.menuItemIcon} />
      <span className={styles.menuItemLabel}>{label}</span>
      {rightElement}
    </motion.button>
  )
}
