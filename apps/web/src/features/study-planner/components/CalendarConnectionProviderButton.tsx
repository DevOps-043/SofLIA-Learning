import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export type CalendarConnectionProvider = 'google' | 'microsoft';

interface CalendarConnectionProviderButtonProps {
  provider: CalendarConnectionProvider;
  label: string;
  isConnecting: boolean;
  isDisabled: boolean;
  onConnect: (provider: CalendarConnectionProvider) => void;
}

function ProviderIcon({ provider }: { provider: CalendarConnectionProvider }) {
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path fill="var(--color-legacy-4285f4)" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="var(--color-legacy-34a853)" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="var(--color-legacy-fbbc05)" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="var(--color-legacy-ea4335)" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8">
      <path fill="var(--color-legacy-f25022)" d="M1 1h10v10H1z" />
      <path fill="var(--color-legacy-00a4ef)" d="M1 13h10v10H1z" />
      <path fill="var(--color-legacy-7fba00)" d="M13 1h10v10H13z" />
      <path fill="var(--color-legacy-ffb900)" d="M13 13h10v10H13z" />
    </svg>
  );
}

export function CalendarConnectionProviderButton({
  provider,
  label,
  isConnecting,
  isDisabled,
  onConnect,
}: CalendarConnectionProviderButtonProps) {
  return (
    <motion.button
      onClick={() => onConnect(provider)}
      disabled={isDisabled}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isConnecting ? (
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      ) : (
        <div className="w-8 h-8 flex items-center justify-center">
          <ProviderIcon provider={provider} />
        </div>
      )}
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
        {label}
      </span>
    </motion.button>
  );
}
