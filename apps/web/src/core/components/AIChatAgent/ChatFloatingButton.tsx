'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bug, ChevronUp } from 'lucide-react';

interface ChatFloatingButtonProps {
  bottomPosition: string | number
  assistantAvatar: string
  assistantName: string
  hasUnreadMessages: boolean
  areButtonsExpanded: boolean
  setAreButtonsExpanded: (v: boolean) => void
  setIsReportOpen: (v: boolean) => void
  reportProblemLabel: string
  handleToggle: (e: React.MouseEvent) => void
}

export function ChatFloatingButton({
  bottomPosition,
  assistantAvatar,
  assistantName,
  hasUnreadMessages,
  areButtonsExpanded,
  setAreButtonsExpanded,
  setIsReportOpen,
  reportProblemLabel,
  handleToggle,
}: ChatFloatingButtonProps) {
  return (
    <div
      className="fixed right-6 z-40 flex flex-col gap-2 items-end bottom-6 md:bottom-6"
      style={{ bottom: bottomPosition }}
    >
      <AnimatePresence>
        {areButtonsExpanded && (
          <motion.div
            key="expanded-buttons"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2 overflow-hidden"
          >
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setIsReportOpen(true);
                setAreButtonsExpanded(false);
              }}
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-orange-500 shadow-lg hover:shadow-red-500/50 transition-all cursor-pointer flex items-center justify-center group relative"
              title={reportProblemLabel}
            >
              <Bug className="w-6 h-6 text-white" />
              <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Reportar problema
                <div className="absolute top-1/2 -translate-y-1/2 right-[-6px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-gray-900" />
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          setAreButtonsExpanded(!areButtonsExpanded);
        }}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        className="cursor-pointer flex items-center justify-center group relative p-1"
        title={areButtonsExpanded ? 'Ocultar opciones' : 'Mostrar opciones'}
      >
        <motion.div animate={{ rotate: areButtonsExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        </motion.div>
        <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {areButtonsExpanded ? 'Ocultar opciones' : 'Mostrar opciones'}
          <div className="absolute top-1/2 -translate-y-1/2 right-[-6px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-gray-900" />
        </div>
      </motion.button>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
      >
        <motion.button
          onClick={(e) => {
            handleToggle(e);
            setAreButtonsExpanded(false);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-16 h-16 rounded-full bg-gradient-to-r from-[#00D4B3] via-[#00D4B3] to-[#00b89a] shadow-2xl hover:shadow-[#00D4B3]/50 transition-all cursor-pointer border-2 border-[#00D4B3]"
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00D4B3] via-[#00D4B3] to-[#00b89a]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-full">
            <img src={assistantAvatar} alt={assistantName} className="w-full h-full object-cover" />
          </div>
          {hasUnreadMessages && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
            />
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
