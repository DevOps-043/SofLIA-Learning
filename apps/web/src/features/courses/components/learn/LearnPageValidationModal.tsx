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
    ? "bg-gradient-to-br from-[#0A2540] to-[#00D4B3] shadow-[#0A2540]/25"
    : "bg-gradient-to-br from-[#F59E0B] to-[#F59E0B] shadow-[#F59E0B]/25";

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
            className="relative bg-white dark:bg-[#1E2329]/95 backdrop-blur-md rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${iconBg}`}>
                <Icon className="w-10 h-10 text-white" />
              </div>
            </div>
            <h3
              className="text-2xl font-bold text-[#0A2540] dark:text-white text-center mb-2"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
            >
              {title}
            </h3>
            <p
              className="text-[#6C757D] dark:text-white/80 text-center mb-4"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
            >
              {message}
            </p>
            {details && (
              <div className="mb-6 p-3 bg-[#E9ECEF]/30 dark:bg-[#0F1419] rounded-lg border border-[#E9ECEF] dark:border-[#6C757D]/30">
                <p
                  className="text-[#0A2540] dark:text-white text-sm text-center font-medium"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
                >
                  {details}
                </p>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-[#0A2540]/25"
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
