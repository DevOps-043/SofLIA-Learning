"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NotificationBell } from "@/core/components/NotificationBell";

interface LearnPageHeaderProps {
  courseTitle: string;
  courseProgress: number;
  onBack: () => void;
  tourAction?: ReactNode;
  disableHeavyEffects?: boolean;
}

export function LearnPageHeader({
  courseTitle,
  courseProgress,
  onBack,
  tourAction,
  disableHeavyEffects = false,
}: LearnPageHeaderProps) {
  const { t } = useTranslation("learn");

  return (
    <motion.div
      data-tour-id="course-learn--header"
      initial={disableHeavyEffects ? false : { opacity: 0, y: -20 }}
      animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
      className="bg-white dark:bg-carbon-800 border-b border-gray-200 dark:border-gray-500/30 px-3 md:px-4 py-1.5 md:py-2 shrink-0 relative z-40"
    >
      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-gray-200/50 dark:hover:bg-primary/30 rounded-lg transition-colors shrink-0"
            aria-label={t("header.backButton")}
            title={t("header.backButton")}
          >
            <ArrowLeft className="w-4 h-4 text-gray-900 dark:text-white" />
          </button>
          <div className="min-w-0 flex-1">
            <h1
              className="text-sm md:text-base font-bold text-primary dark:text-white truncate"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
            >
              {courseTitle}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tourAction}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-32 lg:w-40 h-1.5 bg-gray-200 dark:bg-carbon-800 rounded-full overflow-hidden">
              <motion.div
                initial={disableHeavyEffects ? false : { width: 0 }}
                animate={{ width: `${courseProgress}%` }}
                transition={disableHeavyEffects ? undefined : { duration: 1 }}
                className="h-full bg-gradient-to-r from-primary via-primary to-accent rounded-full shadow-lg"
              />
            </div>
          </div>
          <NotificationBell />
          <span
            data-tour-id="course-learn--progress"
            className="text-xs text-primary dark:text-accent font-medium bg-primary/10 dark:bg-accent/15 px-2 py-0.5 rounded-full min-w-[2.5rem] text-center shrink-0"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
          >
            {courseProgress}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
