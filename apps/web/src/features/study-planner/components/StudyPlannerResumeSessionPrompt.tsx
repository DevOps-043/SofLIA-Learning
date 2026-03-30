'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface StudyPlannerResumeSessionPromptProps {
  savedSessionDate: string | null;
  onDiscardSession: () => void;
  onResumeSession: () => void;
}

export function StudyPlannerResumeSessionPrompt({
  savedSessionDate,
  onDiscardSession,
  onResumeSession,
}: StudyPlannerResumeSessionPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-purple-500/30 dark:bg-[#0f172a] md:p-8">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-purple-500/10 blur-[50px] dark:bg-purple-500/20" />

        <h3 className="mb-3 flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
          <span className="text-2xl">Recuperar conversacion</span>
        </h3>

        <p className="mb-6 text-[15px] leading-relaxed text-gray-600 dark:text-slate-300">
          Hemos detectado una sesion anterior guardada el{' '}
          <span className="font-semibold text-purple-600 dark:text-purple-300">{savedSessionDate}</span>.
          <br />
          <br />
          Te gustaria restaurar el contexto y continuar donde lo dejaste, o prefieres empezar un nuevo plan desde cero?
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onDiscardSession}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
          >
            Empezar de nuevo
          </button>
          <button
            onClick={onResumeSession}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition-all hover:from-purple-500 hover:to-blue-500 active:scale-95"
          >
            <Zap size={16} className="fill-current" />
            Continuar sesion
          </button>
        </div>
      </div>
    </motion.div>
  );
}
