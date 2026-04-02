"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LearnPageHeaderProps {
  courseTitle: string;
  courseProgress: number;
  onBack: () => void;
}

export function LearnPageHeader({ courseTitle, courseProgress, onBack }: LearnPageHeaderProps) {
  const { t } = useTranslation("common");

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#1E2329] border-b border-[#E9ECEF] dark:border-[#6C757D]/30 px-3 md:px-4 py-1.5 md:py-2 shrink-0 relative z-40"
    >
      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 rounded-lg transition-colors shrink-0"
            aria-label={t("header.backButton")}
            title={t("header.backButton")}
          >
            <ArrowLeft className="w-4 h-4 text-gray-900 dark:text-white" />
          </button>
          <div className="min-w-0 flex-1">
            <h1
              className="text-sm md:text-base font-bold text-[#0A2540] dark:text-white truncate"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
            >
              {courseTitle}
            </h1>
            <p
              className="hidden md:block text-xs text-[#6C757D] dark:text-white/60"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
            >
              {t("header.workshop")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-2">
            <div className="w-32 lg:w-40 h-1.5 bg-[#E9ECEF] dark:bg-[#1E2329] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${courseProgress}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-[#0A2540] via-[#0A2540] to-[#00D4B3] rounded-full shadow-lg"
              />
            </div>
          </div>
          <span
            className="text-xs text-[#0A2540] dark:text-white font-medium bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 px-2 py-0.5 rounded-full min-w-[2.5rem] text-center shrink-0"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
          >
            {courseProgress}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
