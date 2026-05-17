import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { SaveMessage } from '../types';

export function AccountSettingsLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-accent mx-auto mb-4" />
        <p className="text-gray-900 dark:text-white">Cargando configuracion...</p>
      </div>
    </div>
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
