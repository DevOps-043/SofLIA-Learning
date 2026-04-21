'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  Plus,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  ActionButton,
  getCalendarLabel,
  renderCalendarIcon,
} from './StudyPlannerDashboardToolbarButton';
import type { CalendarProvider } from './StudyPlannerDashboardToolbar.types';


interface DashboardPlanListItem {
  dashboardDestination?: string;
  id: string;
  name: string;
  organizationId?: string;
  organizationRole?: string;
  organizationSlug?: string;
  primaryCourseTitle?: string;
  totalSessions: number;
  upcomingSessions: number;
}

interface StudyPlannerDashboardToolbarV2Props {
  availablePlans: DashboardPlanListItem[];
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
  onSelectPlan: (planId: string) => void;
  selectedPlanId: string | null;
  setHoveredButton: (value: string | null) => void;
}

export function StudyPlannerDashboardToolbarV2({
  availablePlans,
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
  onSelectPlan,
  selectedPlanId,
  setHoveredButton,
}: StudyPlannerDashboardToolbarV2Props) {
  const isCalendarConfigDisabled = !connectedProvider;

  return (
    <div className="flex flex-wrap items-center justify-start gap-3 px-6 pt-6 pb-2">
      <ActionButton
        buttonId="dashboard-back-button"
        hoverKey="dashboard"
        hoveredButton={hoveredButton}
        icon={<ArrowLeft className="w-5 h-5" />}
        label="Ir al Dashboard"
        onClick={onGoBack}
        setHoveredButton={setHoveredButton}
      />

      <div className="min-w-[240px] flex-1 max-w-[360px]">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#6C757D] dark:text-gray-400">
          Plan activo
        </label>
        <div className="relative">
          <select
            className="w-full appearance-none rounded-xl border border-[#E9ECEF] bg-white px-4 py-3 pr-10 text-sm font-medium text-[#0A2540] shadow-sm outline-none transition focus:border-[#0A2540]/40 dark:border-[#6C757D]/30 dark:bg-[#1E2329] dark:text-white"
            onChange={(event) => onSelectPlan(event.target.value)}
            value={selectedPlanId || ''}
          >
            {availablePlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.primaryCourseTitle ? `${plan.primaryCourseTitle} - ${plan.name}` : plan.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6C757D]" />
        </div>
      </div>

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
          <motion.div className="p-2.5 flex-shrink-0 flex items-center justify-center">
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

      <ActionButton
        disabled={isCalendarConfigDisabled}
        hoverKey="calConfig"
        hoveredButton={hoveredButton}
        icon={<Settings className="w-5 h-5" />}
        label="Configuracion"
        onClick={onOpenCalendarConfig}
        setHoveredButton={setHoveredButton}
      />

      {connectedProvider && !hasConfiguredCalendars && (
        <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs font-medium text-red-600">
          Configura calendarios
        </span>
      )}

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
        disabled={isDeletingPlan || !selectedPlanId}
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
