"use client";

import { useTranslation } from "react-i18next";
import { useLiaCourse } from "../../context/LiaCourseContext";

export function LiaMobileButton() {
  const { t } = useTranslation('learn');
  const { isOpen, toggleLia, isInteractionBlocked, setLiaToastMessage } = useLiaCourse();

  return (
    <button
      onClick={isInteractionBlocked ? () => setLiaToastMessage(t('lia.warningDisabledActivities')) : toggleLia}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative ${
        isInteractionBlocked
          ? "opacity-45 grayscale cursor-not-allowed text-gray-400 dark:text-white/40"
          : isOpen
            ? "bg-primary/10 dark:bg-accent/15 text-primary dark:text-accent"
            : "text-gray-500 dark:text-white/60 hover:bg-gray-200/50 dark:hover:bg-primary/30"
      }`}
    >
      <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-current">
        <img src="/lia-avatar.webp" alt="SofLIA" className="w-full h-full object-cover" />
      </div>
      <span className="text-xs font-medium">SofLIA</span>
      {!isInteractionBlocked && (
        <div className="absolute top-1 right-2 w-2 h-2 bg-success rounded-full border border-white dark:border-carbon-800" />
      )}
    </button>
  );
}
