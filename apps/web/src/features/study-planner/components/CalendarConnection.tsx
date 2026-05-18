'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  Check,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  CalendarConnectionProviderButton,
  type CalendarConnectionProvider,
} from './CalendarConnectionProviderButton';

interface CalendarConnectionProps {
  isConnected: boolean;
  provider?: CalendarConnectionProvider;
  onConnect?: (provider: CalendarConnectionProvider) => void;
  onDisconnect?: () => void;
  onAnalyze?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const getProviderName = (provider?: CalendarConnectionProvider) =>
  provider === 'google' ? 'Google Calendar' : 'Microsoft Calendar';

export function CalendarConnection({
  isConnected,
  provider,
  onDisconnect,
  onAnalyze,
  isLoading = false,
  error = null,
}: CalendarConnectionProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [connectingProvider, setConnectingProvider] =
    useState<CalendarConnectionProvider | null>(null);

  const handleConnect = async (selectedProvider: CalendarConnectionProvider) => {
    setConnectingProvider(selectedProvider);

    try {
      const response = await fetch('/api/study-planner/calendar/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider }),
      });

      if (!response.ok) {
        throw new Error('Error al iniciar la conexion');
      }

      const data = await response.json();
      if (data.success && data.data?.authUrl) {
        window.location.href = data.data.authUrl;
      }
    } catch (err) {
      techDebtLogger.error('Error conectando calendario:', err);
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/study-planner/calendar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      if (response.ok) {
        onDisconnect?.();
      }
    } catch (err) {
      techDebtLogger.error('Error desconectando calendario:', err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calendarConnected = params.get('calendar_connected');
    const calendarError = params.get('calendar_error');

    if (calendarConnected || calendarError) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (calendarError) {
      techDebtLogger.error('Error de calendario:', calendarError);
    }
  }, []);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {isConnected ? (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-800/30 rounded-lg">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Calendario conectado
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {getProviderName(provider)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onAnalyze && (
                  <motion.button
                    onClick={onAnalyze}
                    disabled={isLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Analizar
                  </motion.button>
                )}

                <motion.button
                  onClick={handleDisconnect}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800/30 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : showOptions ? (
          <motion.div
            key="options"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              Selecciona tu proveedor de calendario:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <CalendarConnectionProviderButton
                provider="google"
                label="Google Calendar"
                isConnecting={connectingProvider === 'google'}
                isDisabled={connectingProvider !== null}
                onConnect={handleConnect}
              />
              <CalendarConnectionProviderButton
                provider="microsoft"
                label="Microsoft"
                isConnecting={connectingProvider === 'microsoft'}
                isDisabled={connectingProvider !== null}
                onConnect={handleConnect}
              />
            </div>

            <button
              onClick={() => setShowOptions(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-2"
            >
              Cancelar
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="connect"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <motion.button
              onClick={() => setShowOptions(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25"
            >
              <Calendar className="w-5 h-5" />
              Conectar Calendario
            </motion.button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Conecta tu calendario para analizar tu disponibilidad real
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg"
        >
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </motion.div>
      )}
    </div>
  );
}

export default CalendarConnection;
