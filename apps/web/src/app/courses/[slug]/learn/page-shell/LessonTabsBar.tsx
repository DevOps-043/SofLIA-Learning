import { Activity, MessageCircle, Play } from 'lucide-react';
import { COURSE_LEARN_TOUR_TARGET_IDS } from '@/core/constants/tourTargets';
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic';

const TAB_ICONS = { Play, Activity, MessageCircle } as const;

interface LessonTabsBarProps {
  activeTab: LearnPageLogicResult['activeTab'];
  handleTabChange: LearnPageLogicResult['handleTabChange'];
  isMobile: boolean;
  tabs: LearnPageLogicResult['tabs'];
}

export function LessonTabsBar({
  activeTab,
  handleTabChange,
  isMobile,
  tabs,
}: LessonTabsBarProps) {
  return (
    <div
      className="bg-white dark:bg-[#1E2329] border-b border-[#E9ECEF] dark:border-[#6C757D]/30 flex gap-1 md:gap-2 p-2 md:p-3 rounded-t-xl h-[56px] items-center overflow-x-auto scrollbar-hide scroll-smooth"
      id={COURSE_LEARN_TOUR_TARGET_IDS.tools}
      style={{
        scrollPaddingLeft: '0.5rem',
        scrollPaddingRight: '0.5rem',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div className="flex gap-1 md:gap-2 items-center min-w-max">
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.icon as keyof typeof TAB_ICONS];
          const isActive = activeTab === tab.id;
          const shouldHideText = !isActive && isMobile;

          return (
            <button
              className={`flex items-center rounded-xl transition-all duration-200 relative group shrink-0 ${
                shouldHideText ? 'px-2 py-2 hover:px-3 hover:gap-2' : 'px-3 md:px-4 py-2 gap-1 md:gap-2 min-w-fit'
              } ${
                isActive
                  ? 'bg-[#0A2540] dark:bg-[#00D4B3] text-white dark:text-[#0A2540] shadow-lg shadow-[#0A2540]/25 dark:shadow-[#00D4B3]/25'
                  : 'text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-[#00D4B3] hover:bg-[#E9ECEF]/50 dark:hover:bg-[#00D4B3]/10'
              }`}
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: isActive ? 600 : 500,
                scrollSnapAlign: 'start',
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span
                className={`text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out ${
                  shouldHideText ? 'max-w-0 opacity-0 overflow-hidden group-hover:max-w-[200px] group-hover:opacity-100' : ''
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
