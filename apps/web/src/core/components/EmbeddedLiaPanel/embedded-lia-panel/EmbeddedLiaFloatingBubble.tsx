'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface EmbeddedLiaFloatingBubbleProps {
  assistantName: string;
  assistantAvatar: string;
  hasMessages: boolean;
  isVisible: boolean;
  onOpen: () => void;
}

export function EmbeddedLiaFloatingBubble({
  assistantName,
  assistantAvatar,
  hasMessages,
  isVisible,
  onOpen,
}: EmbeddedLiaFloatingBubbleProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={onOpen}
          className="fixed right-4 bottom-4 z-[100] w-16 h-16 rounded-full shadow-2xl hover:shadow-primary/50 dark:hover:shadow-accent/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group overflow-hidden ring-4 ring-primary/20 dark:ring-accent/30"
          title={`Abrir ${assistantName}`}
        >
          <div className="relative w-full h-full">
            <img src={assistantAvatar} alt={assistantName} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
          </div>
          {hasMessages && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 z-10"
            >
              <div className="w-full h-full bg-red-500 rounded-full animate-ping opacity-75" />
            </motion.div>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
