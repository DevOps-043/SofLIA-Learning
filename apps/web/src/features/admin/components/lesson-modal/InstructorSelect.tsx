'use client';

import type { InstructorOption } from './types';
import { InstructorSelectButton } from './InstructorSelectButton';
import { InstructorSelectDropdown } from './InstructorSelectDropdown';
import { useInstructorSelect } from './useInstructorSelect';

interface InstructorSelectProps {
  instructors: InstructorOption[];
  onChange: (value: string) => void;
  value: string;
}

export function InstructorSelect({ instructors, onChange, value }: InstructorSelectProps) {
  const selectState = useInstructorSelect(value, instructors);

  return (
    <div className="group" ref={selectState.selectRef}>
      <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
        Instructor *
      </label>
      <div className="relative">
        <InstructorSelectButton
          buttonRef={selectState.buttonRef}
          isOpen={selectState.isOpen}
          onToggle={() => selectState.setIsOpen(!selectState.isOpen)}
          selectedInstructor={selectState.selectedInstructor}
        />
        <InstructorSelectDropdown
          dropdownPosition={selectState.dropdownPosition}
          instructors={instructors}
          isOpen={selectState.isOpen}
          onChange={onChange}
          onClose={() => selectState.setIsOpen(false)}
          value={value}
        />
      </div>
    </div>
  );
}
