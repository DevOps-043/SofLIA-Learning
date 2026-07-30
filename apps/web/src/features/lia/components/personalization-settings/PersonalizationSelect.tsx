'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import styles from './PersonalizationSettings.module.css';

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
    <div ref={containerRef} className={styles.selectWrap}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={styles.selectTrigger}
        aria-expanded={isOpen}
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown
          className={styles.selectChevron}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {isOpen && (
        <div className={styles.selectMenu}>
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
                className={`${styles.selectOption} ${isSelected ? styles.selectOptionSelected : ''}`}
              >
                <div className={styles.selectOptionCopy}>
                  <span className={styles.selectOptionTitle}>
                    {option.label}
                  </span>
                  {option.description && (
                    <span className={styles.selectOptionDescription}>
                      {option.description}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <Check className={styles.selectCheck} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
