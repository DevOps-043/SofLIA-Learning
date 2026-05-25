import { useEffect, useRef, useState } from 'react';
import type { InstructorOption } from './types';

export function useInstructorSelect(value: string, instructors: InstructorOption[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedInstructor = instructors.find((instructor) => instructor.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen && buttonRef.current) {
      document.addEventListener('mousedown', handleClickOutside);
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY + 8,
        width: rect.width,
      });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return {
    buttonRef,
    dropdownPosition,
    isOpen,
    selectedInstructor,
    selectRef,
    setIsOpen,
  };
}
