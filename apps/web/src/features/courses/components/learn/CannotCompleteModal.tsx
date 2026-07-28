"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CannotCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CannotCompleteModal({
  isOpen,
  onClose,
}: CannotCompleteModalProps) {
  const { t } = useTranslation("learn");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(event) => event.stopPropagation()}
            className="relative bg-white dark:bg-carbon-800/95 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-500/30 shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-warning to-warning flex items-center justify-center shadow-lg shadow-warning/25">
                <HelpCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <h3
              className="text-2xl font-bold text-primary dark:text-white text-center mb-2"
              style={{ fontFamily: "var(--font-system-ui)", fontWeight: 700 }}
            >
              {t("modals.cannotComplete.title")}
            </h3>
            <p
              className="text-gray-500 dark:text-white/80 text-center mb-6"
              style={{ fontFamily: "var(--font-system-ui)", fontWeight: 400 }}
            >
              {t("modals.cannotComplete.message")}
            </p>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-primary hover:bg-primary text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-primary/25"
              style={{ fontFamily: "var(--font-system-ui)", fontWeight: 500 }}
            >
              {t("modals.cannotComplete.understand")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
