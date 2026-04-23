import { LearnPageMobileNav } from '@/features/courses/components/learn';
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic';

interface CourseMobileNavigationProps {
  disableHeavyEffects: boolean;
  logic: LearnPageLogicResult;
}

export function CourseMobileNavigation({
  disableHeavyEffects,
  logic,
}: CourseMobileNavigationProps) {
  return (
    <LearnPageMobileNav
      disableHeavyEffects={disableHeavyEffects}
      hasNextLesson={!!logic.getNextLesson()}
      hasPreviousLesson={!!logic.getPreviousLesson()}
      isLeftPanelOpen={logic.isLeftPanelOpen}
      isVisible={logic.isMobileBottomNavVisible}
      onNavigateNext={logic.navigateToNextLesson}
      onNavigatePrevious={logic.navigateToPreviousLesson}
      onOpenMaterial={logic.openLeftPanel}
    />
  );
}
