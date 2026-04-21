'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface StudyPlannerDashboardAssistantLauncherProps {
  hasMessages: boolean;
  onOpen: () => void;
}

export function StudyPlannerDashboardAssistantLauncher({
  hasMessages,
  onOpen,
}: StudyPlannerDashboardAssistantLauncherProps) {
  const { t } = useTranslation('common');

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      onClick={onOpen}
      className="group fixed right-4 bottom-4 z-50 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full shadow-2xl ring-4 ring-[#0A2540]/20 transition-all hover:scale-110 hover:shadow-[#0A2540]/50 active:scale-95 dark:ring-[#00D4B3]/30 dark:hover:shadow-[#00D4B3]/50"
      title={t('studyPlanner.dashboardAssistant.openAssistant')}
    >
      <div className="relative h-full w-full">
        <img
          src="/lia-avatar.png"
          alt="SofLIA"
          className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-110"
          width={64}
          height={64}
        />
      </div>
      {hasMessages && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 z-10 h-4 w-4 rounded-full border-2 border-white bg-red-500 dark:border-slate-900"
        >
          <div className="h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        </motion.div>
      )}
    </motion.button>
  );
}
