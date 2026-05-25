'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';
import type {
  StudyPlannerDashboardToolbarProps,
} from './StudyPlannerDashboardToolbar.types';
import {
  ActionButton,
  getCalendarLabel,
  renderCalendarIcon,
} from './StudyPlannerDashboardToolbarButton';

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
              ? 'bg-success/10 dark:bg-success/20 text-success dark:text-success hover:bg-success/20 dark:hover:bg-success/30 border border-success/30 dark:border-success/40'
              : 'bg-white dark:bg-carbon-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-primary/20 border border-gray-200 dark:border-gray-500/30'
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
              : 'bg-white dark:bg-carbon-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-primary/20 border border-gray-200 dark:border-gray-500/30'
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
