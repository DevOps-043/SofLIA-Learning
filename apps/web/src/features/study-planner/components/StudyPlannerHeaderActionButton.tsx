import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface HeaderActionButtonProps {
  buttonId?: string;
  label: string;
  hoverKey: string;
  isMobile: boolean;
  hoveredButton: string | null;
  disabled?: boolean;
  className: string;
  onClick: () => void;
  onHoverChange: (value: string | null) => void;
  children: ReactNode;
  badge?: ReactNode;
}

export function StudyPlannerHeaderActionButton({
  buttonId,
  label,
  hoverKey,
  isMobile,
  hoveredButton,
  disabled,
  className,
  onClick,
  onHoverChange,
  children,
  badge,
}: HeaderActionButtonProps) {
  return (
    <motion.button
      id={buttonId}
      layout
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !isMobile && onHoverChange(hoverKey)}
      onMouseLeave={() => !isMobile && onHoverChange(null)}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      {children}
      {badge}
      <AnimatePresence>
        {hoveredButton === hoverKey && !isMobile && (
          <motion.span
            initial={{ width: 0, opacity: 0, marginLeft: 0 }}
            animate={{ width: 'auto', opacity: 1, marginLeft: 8 }}
            exit={{ width: 0, opacity: 0, marginLeft: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="inline-block overflow-hidden whitespace-nowrap text-sm font-medium"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
