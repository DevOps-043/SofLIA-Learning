"use client";

import { motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { COURSE_LEARN_TOUR_TARGET_IDS } from "../../../../core/constants/tourTargets";
import { LiaMobileButton } from "./LiaMobileButton";

interface LearnPageMobileNavProps {
  isVisible: boolean;
  isLeftPanelOpen: boolean;
  hasPreviousLesson: boolean;
  hasNextLesson: boolean;
  onOpenMaterial: () => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  disableHeavyEffects?: boolean;
}

export function LearnPageMobileNav({
  isVisible,
  isLeftPanelOpen,
  hasPreviousLesson,
  hasNextLesson,
  onOpenMaterial,
  onNavigatePrevious,
  onNavigateNext,
  disableHeavyEffects = false,
}: LearnPageMobileNavProps) {
  const { t } = useTranslation("learn");

  if (!isVisible) return null;

  return (
    <motion.div
      initial={disableHeavyEffects ? false : { y: 100, opacity: 0 }}
      animate={disableHeavyEffects ? undefined : { y: 0, opacity: 1 }}
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-[#1E2329]/95 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 ${disableHeavyEffects ? '' : 'backdrop-blur-lg shadow-2xl'}`}
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
        height: "calc(70px + max(env(safe-area-inset-bottom), 8px))",
      }}
    >
      <div className="flex items-center justify-around px-4 py-3">
        <button
          id={COURSE_LEARN_TOUR_TARGET_IDS.mobileMaterialButton}
          onClick={onOpenMaterial}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
            isLeftPanelOpen
              ? "bg-[#0A2540]/10 dark:bg-[#00D4B3]/15 text-[#0A2540] dark:text-[#00D4B3]"
              : "text-[#6C757D] dark:text-white/60 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30"
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-medium">{t("mobileNav.material")}</span>
        </button>

        {hasPreviousLesson && (
          <button
            onClick={onNavigatePrevious}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-[#6C757D] dark:text-white/60 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-xs font-medium">{t("navigation.previous")}</span>
          </button>
        )}

        {hasNextLesson && (
          <button
            onClick={onNavigateNext}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-[#6C757D] dark:text-white/60 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
            <span className="text-xs font-medium">{t("navigation.next")}</span>
          </button>
        )}

        <LiaMobileButton />
      </div>
    </motion.div>
  );
}
