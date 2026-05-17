import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';
import { lessonModalTabs } from './service';
import type { LessonModalTab } from './types';

interface LessonModalTabsProps {
  activeTab: LessonModalTab;
  setActiveTab: (tab: LessonModalTab) => void;
  t: TFunction<'admin'>;
}

export function LessonModalTabs({ activeTab, setActiveTab, t }: LessonModalTabsProps) {
  return (
    <div className="scrollbar-hide flex items-center gap-1 overflow-x-auto border-b border-[#E9ECEF] bg-[#E9ECEF]/50 px-4 py-3 dark:border-[#6C757D]/30 dark:bg-[#0A0D12] sm:px-6">
      {lessonModalTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative flex min-w-[132px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 sm:min-w-0 ${isActive ? 'text-[#00D4B3] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20' : 'text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329]'}`}
          >
            <Icon className="h-4 w-4" />
            <span>{t(`workshops.editor.lessons.tabs.${tab.id}`)}</span>
            {isActive && <motion.div layoutId="activeTab" className="absolute inset-0 rounded-xl bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 -z-10" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />}
          </motion.button>
        );
      })}
    </div>
  );
}
