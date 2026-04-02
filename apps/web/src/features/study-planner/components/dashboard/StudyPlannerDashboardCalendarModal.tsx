'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Loader2, X } from 'lucide-react';

type CalendarProvider = 'google' | 'microsoft' | null;

interface StudyPlannerDashboardCalendarModalProps {
  calendarError: string | null;
  connectedProvider: CalendarProvider;
  isConnecting: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConnect: (provider: 'google' | 'microsoft') => void;
  onDisconnect: () => void;
  connectingProvider: CalendarProvider;
}

function CalendarProviderCard(props: {
  connectedProvider: CalendarProvider;
  connectingProvider: CalendarProvider;
  name: 'google' | 'microsoft';
  isConnecting: boolean;
  onConnect: (provider: 'google' | 'microsoft') => void;
  onDisconnect: () => void;
}) {
  const isConnected = props.connectedProvider === props.name;

  return (
    <div
      className={`relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all ${
        isConnected
          ? 'bg-[#10B981]/10 dark:bg-[#10B981]/20 border-2 border-[#10B981]/30 shadow-sm'
          : 'bg-white dark:bg-[#1E2329] border-2 border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#0A2540] dark:hover:border-[#00D4B3]'
      }`}
    >
      {isConnected && (
        <button
          onClick={props.onDisconnect}
          className="absolute top-2 right-2 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors group"
          title={`Desconectar ${props.name === 'google' ? 'Google Calendar' : 'Microsoft Calendar'}`}
        >
          <X className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300" />
        </button>
      )}

      <motion.button
        onClick={() => {
          if (!isConnected) {
            props.onConnect(props.name);
          }
        }}
        disabled={props.isConnecting || isConnected}
        whileHover={!isConnected && !props.isConnecting ? { scale: 1.02 } : {}}
        whileTap={{ scale: 0.98 }}
        className="flex flex-col items-center gap-3 w-full disabled:cursor-default"
      >
        {props.connectingProvider === props.name ? (
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        ) : (
          <div className="w-8 h-8 flex items-center justify-center">
            {props.name === 'google' ? (
              <svg viewBox="0 0 24 24" className="w-8 h-8">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-8 h-8">
                <path fill="#F25022" d="M1 1h10v10H1z" />
                <path fill="#00A4EF" d="M1 13h10v10H1z" />
                <path fill="#7FBA00" d="M13 1h10v10H13z" />
                <path fill="#FFB900" d="M13 13h10v10H13z" />
              </svg>
            )}
          </div>
        )}

        <span
          className={`text-xs font-medium ${
            isConnected ? 'text-[#10B981] dark:text-[#10B981]' : 'text-[#0A2540] dark:text-white'
          }`}
        >
          {props.name === 'google' ? 'Google Calendar' : 'Microsoft'}
        </span>

        {isConnected && (
          <span className="text-xs text-[#10B981] dark:text-[#10B981] font-medium">
            Conectado
          </span>
        )}
      </motion.button>
    </div>
  );
}

export function StudyPlannerDashboardCalendarModal({
  calendarError,
  connectedProvider,
  isConnecting,
  isOpen,
  onClose,
  onConnect,
  onDisconnect,
  connectingProvider,
}: StudyPlannerDashboardCalendarModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-white dark:bg-[#1E2329] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E9ECEF] dark:border-[#6C757D]/30">
              <div className="flex items-center justify-between p-5 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                <h2 className="text-lg font-semibold text-[#0A2540] dark:text-white">
                  Conectar Calendario
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#6C757D] dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-xs text-[#6C757D] dark:text-gray-400 text-center mb-4">
                  {connectedProvider ? 'Gestiona tus calendarios conectados:' : 'Selecciona tu proveedor de calendario:'}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <CalendarProviderCard
                    connectedProvider={connectedProvider}
                    connectingProvider={connectingProvider}
                    isConnecting={isConnecting}
                    name="google"
                    onConnect={onConnect}
                    onDisconnect={onDisconnect}
                  />
                  <CalendarProviderCard
                    connectedProvider={connectedProvider}
                    connectingProvider={connectingProvider}
                    isConnecting={isConnecting}
                    name="microsoft"
                    onConnect={onConnect}
                    onDisconnect={onDisconnect}
                  />
                </div>

                {!connectedProvider && (
                  <p className="text-xs text-center text-[#6C757D] dark:text-gray-400 mt-4">
                    Conecta tu calendario para sincronizar tus eventos
                  </p>
                )}

                {calendarError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">{calendarError}</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
