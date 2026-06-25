"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface CourseCompletedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CourseCompletedModal({ isOpen, onClose }: CourseCompletedModalProps) {
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
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 dark:shadow-accent/25">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
              ¡Felicidades!
            </h3>
            <p className="text-gray-600 dark:text-slate-300 text-center mb-4">
              Has completado el curso exitosamente. ¡Buen trabajo!
            </p>
            <div
              className="rounded-xl border p-3 mb-6"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--learn-action) 10%, transparent)',
                borderColor: 'color-mix(in srgb, var(--learn-action) 20%, transparent)',
              }}
            >
              <p
                className="text-primary dark:text-white text-center text-sm"
                style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
              >
                🎓 A continuación, completa una breve encuesta para acceder a tu certificado
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 font-medium rounded-xl transition-all duration-200 shadow-lg hover:brightness-95"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, backgroundColor: 'var(--learn-action)', color: 'var(--learn-on-action)' }}
            >
              Aceptar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
