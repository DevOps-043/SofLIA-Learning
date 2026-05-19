"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Trash2 } from "lucide-react";

type DeleteNoteConfirmModalProps = {
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function DeleteNoteConfirmModal({
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteNoteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10010] flex items-center justify-center p-4 overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(event) => event.stopPropagation()}
            className="relative bg-white dark:bg-carbon-800/95 backdrop-blur-md rounded-2xl border border-red-500/20 dark:border-red-500/30 shadow-2xl max-w-sm w-full p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-4 border border-red-200 dark:border-red-500/20">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>

              <h3
                className="text-xl font-bold text-primary dark:text-white mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Eliminar nota
              </h3>

              <p
                className="text-gray-500 dark:text-white/60 text-sm mb-6"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Esta accion no se puede deshacer. La nota se eliminara
                permanentemente de tu estudio.
              </p>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    "Si, eliminar nota"
                  )}
                </button>

                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="w-full py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white/80 font-medium rounded-xl transition-all"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
