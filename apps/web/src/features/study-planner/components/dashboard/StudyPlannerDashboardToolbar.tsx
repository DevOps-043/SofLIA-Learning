'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';

type CalendarProvider = 'google' | 'microsoft' | null;

interface StudyPlannerDashboardToolbarProps {
  connectedProvider: CalendarProvider;
  hasConfiguredCalendars: boolean;
  hoveredButton: string | null;
  isCalendarConnected: boolean;
  isDeletingPlan: boolean;
  isRecreatingPlan: boolean;
  onDeletePlan: () => void;
  onGoBack: () => void | Promise<void>;
  onOpenCalendarConfig: () => void;
  onOpenCalendarModal: () => void;
  onRecreatePlan: () => void;
  onRestartTour: () => void;
  setHoveredButton: (value: string | null) => void;
}

function renderCalendarIcon(connectedProvider: CalendarProvider) {
  if (connectedProvider === 'microsoft') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#00A4EF" d="M1 13h10v10H1z" />
        <path fill="#7FBA00" d="M13 1h10v10H13z" />
        <path fill="#FFB900" d="M13 13h10v10H13z" />
      </svg>
    );
  }

  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function getCalendarLabel(
  connectedProvider: CalendarProvider,
  isCalendarConnected: boolean,
): string {
  if (!isCalendarConnected || !connectedProvider) {
    return 'Conectar calendario';
  }

  return connectedProvider === 'google' ? 'Google conectado' : 'Microsoft conectado';
}

function ActionButton(props: {
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
    ? 'bg-[#0A2540] text-white hover:bg-[#0d2f4d] border-[#0A2540]'
    : props.variant === 'danger'
      ? 'bg-red-500 text-white hover:bg-red-600 border-red-600'
      : props.active
        ? 'bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 border-[#10B981]/30'
        : 'bg-white text-[#6C757D] hover:bg-[#E9ECEF] border-[#E9ECEF] dark:bg-[#1E2329] dark:text-gray-400 dark:hover:bg-[#0A2540]/20 dark:border-[#6C757D]/30';

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

export function StudyPlannerDashboardToolbar({
  connectedProvider,
  hasConfiguredCalendars,
  hoveredButton,
  isCalendarConnected,
  isDeletingPlan,
  isRecreatingPlan,
  onDeletePlan,
  onGoBack,
  onOpenCalendarConfig,
  onOpenCalendarModal,
  onRecreatePlan,
  onRestartTour,
  setHoveredButton,
}: StudyPlannerDashboardToolbarProps) {
  const isCalendarConfigDisabled = !connectedProvider;

  return (
    <div className="flex items-center justify-start gap-3 px-6 pt-6 pb-2">
      <ActionButton
        buttonId="dashboard-back-button"
        hoverKey="dashboard"
        hoveredButton={hoveredButton}
        icon={<ArrowLeft className="w-5 h-5" />}
        label="Ir al Dashboard"
        onClick={onGoBack}
        setHoveredButton={setHoveredButton}
      />

      <div className="relative">
        <motion.button
          layout
          onClick={onRestartTour}
          onMouseEnter={() => setHoveredButton('tour')}
          onMouseLeave={() => setHoveredButton(null)}
          whileTap={{ scale: 0.95 }}
          className="rounded-lg bg-white dark:bg-[#1E2329] text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 border border-[#E9ECEF] dark:border-[#6C757D]/30 transition-colors flex items-center overflow-hidden"
          title="Ver Tour"
        >
          <motion.div
            className="p-2.5 flex-shrink-0 flex items-center justify-center"
            animate={hoveredButton === 'tour' ? {
              scale: [1, 1.1, 1],
              rotate: [0, -10, 10, 0],
            } : {}}
            transition={{
              duration: 0.5,
              repeat: hoveredButton === 'tour' ? Infinity : 0,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          >
            <Zap className="w-5 h-5" />
          </motion.div>
          <AnimatePresence>
            {hoveredButton === 'tour' && (
              <motion.span
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
              >
                Ver Tour
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="relative calendar-menu-container">
        <motion.button
          id="dashboard-connect-calendar-button"
          layout
          onClick={onOpenCalendarModal}
          onMouseEnter={() => setHoveredButton('calendar')}
          onMouseLeave={() => setHoveredButton(null)}
          whileTap={{ scale: 0.95 }}
          className={`rounded-lg transition-colors flex items-center overflow-hidden ${
            isCalendarConnected
              ? 'bg-[#10B981]/10 dark:bg-[#10B981]/20 text-[#10B981] dark:text-[#10B981] hover:bg-[#10B981]/20 dark:hover:bg-[#10B981]/30 border border-[#10B981]/30 dark:border-[#10B981]/40'
              : 'bg-white dark:bg-[#1E2329] text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 border border-[#E9ECEF] dark:border-[#6C757D]/30'
          }`}
        >
          <motion.div
            className="p-2.5 flex-shrink-0 flex items-center justify-center"
            animate={hoveredButton === 'calendar' ? {
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            } : {}}
            transition={{
              duration: 0.5,
              repeat: hoveredButton === 'calendar' ? Infinity : 0,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          >
            {renderCalendarIcon(connectedProvider)}
          </motion.div>
          <AnimatePresence>
            {hoveredButton === 'calendar' && (
              <motion.span
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
              >
                {getCalendarLabel(connectedProvider, isCalendarConnected)}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="relative">
        <motion.button
          layout
          onClick={onOpenCalendarConfig}
          disabled={isCalendarConfigDisabled}
          onMouseEnter={() => setHoveredButton('calConfig')}
          onMouseLeave={() => setHoveredButton(null)}
          whileTap={{ scale: 0.95 }}
          className={`rounded-lg transition-colors flex items-center overflow-hidden ${
            isCalendarConfigDisabled
              ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 border border-gray-200 dark:border-gray-700 cursor-not-allowed'
              : 'bg-white dark:bg-[#1E2329] text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 border border-[#E9ECEF] dark:border-[#6C757D]/30'
          }`}
          title="Configuracion de calendarios"
        >
          <motion.div
            className="p-2.5 flex-shrink-0 flex items-center justify-center"
            animate={hoveredButton === 'calConfig' ? {
              scale: [1, 1.1, 1],
              rotate: [0, 90, 0],
            } : {}}
            transition={{
              duration: 0.6,
              repeat: hoveredButton === 'calConfig' ? Infinity : 0,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          >
            <Settings className="w-5 h-5" />
          </motion.div>
          <AnimatePresence>
            {hoveredButton === 'calConfig' && connectedProvider && (
              <motion.span
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
              >
                Configuracion
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {connectedProvider && !hasConfiguredCalendars && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-75" />
            <span className="relative w-2 h-2 bg-white rounded-full" />
          </motion.span>
        )}
      </div>

      <ActionButton
        buttonId="dashboard-new-plan-button"
        disabled={isRecreatingPlan}
        hoverKey="recreate"
        hoveredButton={hoveredButton}
        icon={isRecreatingPlan ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
        label="Nuevo plan"
        onClick={onRecreatePlan}
        setHoveredButton={setHoveredButton}
        variant="primary"
      />

      <ActionButton
        buttonId="dashboard-delete-plan-button"
        disabled={isDeletingPlan}
        hoverKey="delete"
        hoveredButton={hoveredButton}
        icon={isDeletingPlan ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
        label="Eliminar plan"
        onClick={onDeletePlan}
        setHoveredButton={setHoveredButton}
        variant="danger"
      />
    </div>
  );
}
