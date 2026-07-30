import { motion } from 'framer-motion';
import { PremiumLoadingScreen } from '@/core/components/PremiumLoadingScreen/PremiumLoadingScreen';
import type { SaveMessage } from '../types';

export function AccountSettingsLoading() {
  return (
    <PremiumLoadingScreen
      description="Sincronizando tus preferencias de cuenta."
      label="Cargando configuración"
    />
  );
}

export function AccountSettingsSaveMessage({ saveMessage }: { saveMessage: SaveMessage | null }) {
  if (!saveMessage) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`mb-6 p-4 rounded-lg ${
        saveMessage.type === 'success'
          ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
          : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
      }`}
    >
      {saveMessage.text}
    </motion.div>
  );
}
