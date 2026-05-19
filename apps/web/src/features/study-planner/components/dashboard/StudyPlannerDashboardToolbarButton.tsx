'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { CalendarProvider } from './StudyPlannerDashboardToolbar.types';

export function renderCalendarIcon(connectedProvider: CalendarProvider) {
  if (connectedProvider === 'microsoft') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="var(--color-legacy-f25022)" d="M1 1h10v10H1z" />
        <path fill="var(--color-legacy-00a4ef)" d="M1 13h10v10H1z" />
        <path fill="var(--color-legacy-7fba00)" d="M13 1h10v10H13z" />
        <path fill="var(--color-legacy-ffb900)" d="M13 13h10v10H13z" />
      </svg>
    );
  }

  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="var(--color-legacy-4285f4)" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="var(--color-legacy-34a853)" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="var(--color-legacy-fbbc05)" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="var(--color-legacy-ea4335)" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function getCalendarLabel(
  connectedProvider: CalendarProvider,
  isCalendarConnected: boolean,
): string {
  if (!isCalendarConnected || !connectedProvider) {
    return 'Conectar calendario';
  }

  return connectedProvider === 'google' ? 'Google conectado' : 'Microsoft conectado';
}

export function ActionButton(props: {
  active?: boolean;
  buttonId?: string;
  disabled?: boolean;
  hoverKey: string;
  hoveredButton: string | null;
  icon: ReactNode;
  label: string;
  onClick: () => void | Promise<void>;
  setHoveredButton: (value: string | null) => void;
  variant?: 'default' | 'primary' | 'danger';
}) {
  const isHovered = props.hoveredButton === props.hoverKey;
  const variantClassName = props.variant === 'primary'
    ? 'bg-primary text-white hover:bg-primary border-primary'
    : props.variant === 'danger'
      ? 'bg-red-500 text-white hover:bg-red-600 border-red-600'
      : props.active
        ? 'bg-success/10 text-success hover:bg-success/20 border-success/30'
        : 'bg-white text-gray-500 hover:bg-gray-200 border-gray-200 dark:bg-carbon-800 dark:text-gray-400 dark:hover:bg-primary/20 dark:border-gray-500/30';

  return (
    <div className="relative">
      <motion.button
        id={props.buttonId}
        layout
        disabled={props.disabled}
        onClick={props.onClick}
        onMouseEnter={() => props.setHoveredButton(props.hoverKey)}
        onMouseLeave={() => props.setHoveredButton(null)}
        whileTap={{ scale: 0.95 }}
        className={`rounded-lg border transition-colors flex items-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed ${variantClassName}`}
      >
        <motion.div
          className="p-2.5 flex-shrink-0 flex items-center justify-center"
          animate={isHovered && !props.disabled ? { scale: [1, 1.1, 1] } : {}}
          transition={{
            duration: 0.5,
            repeat: isHovered && !props.disabled ? Infinity : 0,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        >
          {props.icon}
        </motion.div>
        <AnimatePresence>
          {isHovered && !props.disabled && (
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
            >
              {props.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
