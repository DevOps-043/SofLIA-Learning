import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import type { InstructorOption } from './types';

interface InstructorSelectDropdownProps {
  dropdownPosition: {
    left: number;
    top: number;
    width: number;
  };
  instructors: InstructorOption[];
  isOpen: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  value: string;
}

export function InstructorSelectDropdown({
  dropdownPosition,
  instructors,
  isOpen,
  onChange,
  onClose,
  value,
}: InstructorSelectDropdownProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[55]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed z-[60] bg-white dark:bg-[#1E2329] rounded-xl shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden max-h-[300px] overflow-y-auto"
            style={{ left: `${dropdownPosition.left}px`, top: `${dropdownPosition.top}px`, width: `${dropdownPosition.width}px` }}
          >
            <div className="p-1.5">
              {instructors.length === 0 ? (
                <div className="px-4 py-3 text-sm text-[#6C757D] dark:text-white/60 text-center">No hay instructores disponibles</div>
              ) : (
                instructors.map((instructor, index) => (
                  <InstructorOptionButton
                    key={instructor.id}
                    index={index}
                    instructor={instructor}
                    isSelected={instructor.id === value}
                    onClick={() => {
                      onChange(instructor.id);
                      onClose();
                    }}
                  />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function InstructorOptionButton({ index, instructor, isSelected, onClick }: { index: number; instructor: InstructorOption; isSelected: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ backgroundColor: isSelected ? undefined : 'rgba(0, 212, 179, 0.1)', x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${isSelected ? 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#00D4B3]' : 'text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/30'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#00D4B3]/20' : 'bg-[#E9ECEF] dark:bg-[#0A0D12]'}`}>
          <UserCircleIcon className={`h-4 w-4 ${isSelected ? 'text-[#00D4B3]' : 'text-[#6C757D] dark:text-white/60'}`} />
        </div>
        <span className="font-medium">{instructor.name}</span>
      </div>
      {isSelected && <CheckCircleIcon className="h-5 w-5 text-[#00D4B3]" />}
    </motion.button>
  );
}
