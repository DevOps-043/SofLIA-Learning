'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface ClearConfirmModalProps {
  show: boolean
  normalMessagesCount: number
  onCancel: () => void
  onConfirm: () => void
}

export function ClearConfirmModal({ show, normalMessagesCount, onCancel, onConfirm }: ClearConfirmModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[var(--color-legacy-1a1a1a)] rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-200 dark:border-white/10"
          >
            <div className="bg-gradient-to-r from-primary to-accent p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Limpiar Contexto</h3>
                  <p className="text-white/80 text-sm">PRL-1.0 Mini activo</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Tienes <span className="font-semibold text-accent">{normalMessagesCount} mensajes</span> guardados en el contexto persistente.
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
                ¿Deseas borrar toda la conversación y el contexto guardado?
              </p>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all shadow-lg shadow-red-500/25"
              >
                Borrar Todo
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
