'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Loader2, X } from 'lucide-react';

import { StudyPlannerCalendarProviderIcon } from './StudyPlannerCalendarProviderIcon';
import type { StudyPlannerCalendarProvider } from '../types/planner-ui.types';
import type { UserType } from '../types/user-context.types';

interface StudyPlannerCalendarModalProps {
  isOpen: boolean;
  userType: UserType | null;
  connectedCalendar: StudyPlannerCalendarProvider;
  isConnectingCalendar: boolean;
  onConnect: (provider: 'google' | 'microsoft') => void;
  onSkip: () => void;
  onOverlayClick: () => void;
  onCloseButtonClick: () => void;
}

interface ProviderButtonProps {
  provider: 'google' | 'microsoft';
  title: string;
  description: string;
  isConnecting: boolean;
  onConnect: (provider: 'google' | 'microsoft') => void;
}

function ProviderButton({ provider, title, description, isConnecting, onConnect }: ProviderButtonProps) {
  return (
    <div className="relative group">
      <motion.button
        onClick={() => onConnect(provider)}
        disabled={isConnecting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-500/30 dark:bg-primary/20 dark:hover:border-blue-500"
      >
        {isConnecting && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/50">
            <Loader2 className="h-6 w-6 animate-spin text-primary dark:text-white" />
          </div>
        )}

        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
          <StudyPlannerCalendarProviderIcon provider={provider} />
        </div>

        <div className="min-w-0 flex-1 text-left">
          <div className="mb-1 flex items-center gap-2">
            <p className="text-sm font-semibold text-primary dark:text-white">{title}</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </motion.button>
    </div>
  );
}

export function StudyPlannerCalendarModal({
  isOpen,
  userType,
  connectedCalendar,
  isConnectingCalendar,
  onConnect,
  onSkip,
  onOverlayClick,
  onCloseButtonClick,
}: StudyPlannerCalendarModalProps) {
  const isBlockingOverlayClose = userType === 'b2b' && !connectedCalendar;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onOverlayClick}
            style={{ cursor: isBlockingOverlayClose ? 'default' : 'pointer' }}
          />

          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-500/30 dark:bg-carbon-800"
          >
            <div className="mb-5 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-sm dark:border-accent/30 dark:bg-primary/20"
              >
                <Calendar className="h-8 w-8 text-primary dark:text-accent" />
              </motion.div>
              <h3 className="mb-2 text-xl font-bold text-primary dark:text-white">Conecta tu calendario</h3>
              <p className="mx-auto max-w-sm text-sm text-gray-500 dark:text-gray-400">
                {userType === 'b2b'
                  ? 'Como usuario empresarial, es necesario conectar tu calendario para adaptar el plan a tus horarios de trabajo y cumplir con los plazos asignados.'
                  : 'Analizo tu calendario para encontrar los mejores horarios para estudiar'}
              </p>
            </div>

            <div className="mb-6 space-y-4">
              <ProviderButton
                provider="google"
                title="Google Calendar"
                description="Conecta tu cuenta de Google"
                isConnecting={isConnectingCalendar}
                onConnect={onConnect}
              />
              <ProviderButton
                provider="microsoft"
                title="Microsoft Outlook"
                description="Conecta tu cuenta de Microsoft"
                isConnecting={isConnectingCalendar}
                onConnect={onConnect}
              />
            </div>

            <div className="pt-2 text-center">
              <motion.button
                onClick={onSkip}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-md px-4 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-200 hover:text-primary dark:text-gray-400 dark:hover:bg-primary/20 dark:hover:text-white"
              >
                Continuar sin calendario
              </motion.button>
            </div>

            <motion.button
              onClick={onCloseButtonClick}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="absolute right-4 top-4 rounded-lg p-2 text-gray-500 transition-all hover:bg-gray-200 hover:text-primary dark:text-gray-400 dark:hover:bg-primary/20 dark:hover:text-white"
              title={connectedCalendar ? 'Cerrar y continuar con calendario conectado' : 'Cerrar modal'}
              aria-label="Cerrar"
            >
              <X size={20} />
            </motion.button>

            <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
              <p className="text-center text-xs text-blue-400">Conectar tu calendario permite adaptar el plan a tus horarios reales</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
