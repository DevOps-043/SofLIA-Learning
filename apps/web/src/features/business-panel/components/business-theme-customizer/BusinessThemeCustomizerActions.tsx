'use client';

import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader2, RotateCcw, Save } from 'lucide-react';

interface BusinessThemeCustomizerActionsProps {
  saveSuccess: string | null;
  saveError: string | null;
  isSaving: boolean;
  onDiscard: () => void;
  onReset: () => void;
  onSave: () => Promise<void>;
}

export function BusinessThemeCustomizerActions({
  saveSuccess,
  saveError,
  isSaving,
  onDiscard,
  onReset,
  onSave,
}: BusinessThemeCustomizerActionsProps) {
  return (
    <>
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-400">{saveSuccess}</p>
        </motion.div>
      )}

      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400">{saveError}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row justify-between gap-4"
      >
        <div className="flex gap-3">
          <motion.button
            onClick={onDiscard}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#a78bfa',
            }}
          >
            Descartar
          </motion.button>
          <motion.button
            onClick={onReset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer
          </motion.button>
        </div>
        <motion.button
          onClick={() => void onSave()}
          disabled={isSaving}
          whileHover={{ scale: isSaving ? 1 : 1.02 }}
          whileTap={{ scale: isSaving ? 1 : 0.98 }}
          className="relative overflow-hidden px-8 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            boxShadow: '0 8px 30px rgba(139, 92, 246, 0.4)',
          }}
        >
          <motion.div
            className="absolute inset-0 w-full"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            }}
          />
          <div className="relative flex items-center gap-2.5">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </div>
        </motion.button>
      </motion.div>
    </>
  );
}
