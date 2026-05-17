'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { staggerItem } from '../../../../../shared/utils/animations';

interface BusinessFAQItemProps {
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  question: string;
}

export function BusinessFAQItem({
  answer,
  isOpen,
  onToggle,
  question,
}: BusinessFAQItemProps) {
  return (
    <motion.div variants={staggerItem} className="mb-4">
      <motion.button
        onClick={onToggle}
        className="group w-full rounded-md border border-glass-light bg-glass p-6 text-left transition-all duration-300 hover:border-primary/50"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="pr-8 text-lg font-semibold transition-colors group-hover:text-primary">
            {question}
          </h3>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="h-6 w-6 flex-shrink-0 text-primary" />
          </motion.div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="mt-4 leading-relaxed text-text-secondary">{answer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}
