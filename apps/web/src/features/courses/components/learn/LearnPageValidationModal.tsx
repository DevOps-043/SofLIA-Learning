"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Info, XCircle } from "lucide-react";

interface LearnPageValidationModalProps {
  isOpen: boolean;
  type: string;
  title: string;
  message: string;
  details?: string | null;
  onClose: () => void;
}

export function LearnPageValidationModal({
  isOpen,
  type,
  title,
  message,
  details,
  onClose,
}: LearnPageValidationModalProps) {
  const isActivityOrQuiz = type === "activity" || type === "quiz";
  const isVideo = type === "video";

  const iconBg = isActivityOrQuiz
    ? "bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/25"
    : isVideo
    ? "bg-gradient-to-br from-primary to-accent shadow-primary/25"
    : "bg-gradient-to-br from-warning to-warning shadow-warning/25";

  const Icon = isActivityOrQuiz ? AlertCircle : isVideo ? Info : XCircle;

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
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white dark:bg-carbon-800/95 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-500/30 shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${iconBg}`}>
                <Icon className="w-10 h-10 text-white" />
              </div>
            </div>
            <h3
              className="text-2xl font-bold text-primary dark:text-white text-center mb-2"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
            >
              {title}
            </h3>
            <p
              className="text-gray-500 dark:text-white/80 text-center mb-4"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
            >
              {message}
            </p>
            {details && (
              <div className="mb-6 p-3 bg-gray-200/30 dark:bg-carbon-900 rounded-lg border border-gray-200 dark:border-gray-500/30">
                <p
                  className="text-primary dark:text-white text-sm text-center font-medium"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
                >
                  {details}
                </p>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-primary hover:bg-primary text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-primary/25"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
            >
              Entendido
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
