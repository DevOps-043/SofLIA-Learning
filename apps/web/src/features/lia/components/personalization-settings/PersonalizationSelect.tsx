'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const ORG_ACCENT = 'var(--org-accent-color, var(--color-accent))';

interface SelectOption {
  description?: string;
  label: string;
  value: string;
}

interface PersonalizationSelectProps {
  onChange: (value: string) => void;
  options: SelectOption[];
  value: string;
}

export function PersonalizationSelect({ onChange, options, value }: PersonalizationSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-500/30 bg-white dark:bg-carbon-900 text-primary dark:text-white flex items-center justify-between gap-3 transition-all duration-200 focus:outline-none"
        style={isOpen ? { borderColor: ORG_ACCENT, boxShadow: `0 0 0 2px color-mix(in srgb, ${ORG_ACCENT} 20%, transparent)` } : undefined}
      >
        <span className="text-sm">{selectedOption?.label}</span>
        <ChevronDown
          className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
          style={{
            color: ORG_ACCENT,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-gray-200 dark:border-gray-500/30 bg-white dark:bg-carbon-900 overflow-hidden shadow-xl z-[999999]"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-sm flex items-center justify-between gap-3 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-white/5"
                style={isSelected ? { backgroundColor: `color-mix(in srgb, ${ORG_ACCENT} 12%, transparent)` } : undefined}
              >
                <div className="flex flex-col min-w-0">
                  <span
                    className="font-medium"
                    style={{ color: isSelected ? ORG_ACCENT : undefined }}
                  >
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {option.description}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: ORG_ACCENT }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
