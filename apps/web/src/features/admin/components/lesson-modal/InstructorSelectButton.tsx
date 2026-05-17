import { motion } from 'framer-motion';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import type { RefObject } from 'react';
import type { InstructorOption } from './types';

interface InstructorSelectButtonProps {
  buttonRef: RefObject<HTMLButtonElement>;
  isOpen: boolean;
  onToggle: () => void;
  selectedInstructor?: InstructorOption;
}

export function InstructorSelectButton({
  buttonRef,
  isOpen,
  onToggle,
  selectedInstructor,
}: InstructorSelectButtonProps) {
  const iconClassName = isOpen ? 'text-[#00D4B3]' : 'text-[#6C757D] dark:text-white/60';

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      onClick={onToggle}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#0A0D12] border rounded-xl text-[#0A2540] dark:text-white transition-all duration-200 flex items-center justify-between ${isOpen ? 'border-[#00D4B3] ring-2 ring-[#00D4B3]/40' : 'border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/50'}`}
    >
      <div className="flex items-center gap-2.5">
        <UserCircleIcon className={`h-4 w-4 transition-colors ${iconClassName}`} />
        <span className="font-medium">{selectedInstructor ? selectedInstructor.name : 'Seleccionar instructor...'}</span>
      </div>
      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
        <ChevronDownIcon className={`h-4 w-4 transition-colors ${iconClassName}`} />
      </motion.div>
    </motion.button>
  );
}
