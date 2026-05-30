"use client";

import { motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, StickyNote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LiaMobileButton } from "./LiaMobileButton";

interface LearnPageMobileNavProps {
  isVisible: boolean;
  isLeftPanelOpen: boolean;
  hasPreviousLesson: boolean;
  hasNextLesson: boolean;
  onOpenMaterial: () => void;
  onCreateNote: () => void;
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
  onCreateNote,
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
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-carbon-800/95 border-t border-gray-200 dark:border-gray-500/30 ${disableHeavyEffects ? '' : 'backdrop-blur-lg shadow-2xl'}`}
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
        height: "calc(70px + max(env(safe-area-inset-bottom), 8px))",
      }}
    >
      <div className="grid grid-cols-5 items-center gap-1 px-2 py-3">
        <button
          onClick={onOpenMaterial}
          className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all ${
            isLeftPanelOpen
              ? "bg-primary/10 dark:bg-accent/15 text-primary dark:text-accent"
              : "text-gray-500 dark:text-white/60 hover:bg-gray-200/50 dark:hover:bg-primary/30"
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-medium">{t("mobileNav.material")}</span>
        </button>

        <button
          onClick={onCreateNote}
          className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-primary transition-all hover:bg-primary/10 dark:text-accent dark:hover:bg-accent/15"
          aria-label={t("mobileNav.quickNote")}
          title={t("mobileNav.quickNote")}
        >
          <StickyNote className="h-5 w-5" />
          <span className="max-w-full truncate text-xs font-medium">{t("mobileNav.note")}</span>
        </button>

        {hasPreviousLesson ? (
          <button
            onClick={onNavigatePrevious}
            className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-gray-500 transition-all hover:bg-gray-200/50 dark:text-white/60 dark:hover:bg-primary/30"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="max-w-full truncate text-xs font-medium">{t("navigation.previous")}</span>
          </button>
        ) : <div aria-hidden="true" />}

        {hasNextLesson ? (
          <button
            onClick={onNavigateNext}
            className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-gray-500 transition-all hover:bg-gray-200/50 dark:text-white/60 dark:hover:bg-primary/30"
          >
            <ChevronRight className="w-5 h-5" />
            <span className="max-w-full truncate text-xs font-medium">{t("navigation.next")}</span>
          </button>
        ) : <div aria-hidden="true" />}

        <LiaMobileButton />
      </div>
    </motion.div>
  );
}
