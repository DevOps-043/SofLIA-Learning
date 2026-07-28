'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

export interface SelectOption {
  value: string | number;
  label: string;
  flag?: string; // Para mostrar banderas junto al texto
}

interface SelectFieldProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  searchable?: boolean;
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder = 'Selecciona una opción',
  label,
  required = false,
  disabled = false,
  error,
  className,
  searchable = false,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  // Filtrar opciones válidas (excluir valores vacíos y 0 que son placeholders)
  const validOptions = options.filter(opt => {
    const val = String(opt.value);
    return val !== '' && val !== '0';
  });

  const filteredOptions = searchable && search
    ? validOptions.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : validOptions;

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  return (
    <div data-auth-field className={cn('w-full', className)}>
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wider mb-1.5 text-text-secondary transition-all duration-200">
          {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
        </label>
      )}

      <Select.Root
        value={value !== undefined && value !== null && value !== '' && value !== 0 ? String(value) : undefined}
        onValueChange={(val) => {
          const option = options.find(opt => String(opt.value) === val);
          if (option) {
            onChange(option.value);
          }
        }}
        open={isOpen}
        onOpenChange={setIsOpen}
        disabled={disabled}
      >
        <Select.Trigger
          data-auth-control
          className={cn(
            'w-full px-4 py-3 bg-white dark:bg-carbon-800',
            'border border-gray-200 dark:border-gray-500/30',
            'rounded-xl text-primary dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-20 focus:border-accent',
            'transition-all duration-300',
            'hover:border-accent/50 dark:hover:border-accent/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-between gap-2',
            'text-sm font-normal',
            error && 'border-red-500 dark:border-red-500',
            isOpen && 'ring-2 ring-accent ring-opacity-20 border-accent shadow-lg shadow-accent/10'
          )}
        >
          <span className="flex items-center gap-2 flex-1 min-w-0">
            {selectedOption && selectedOption.value !== 0 && selectedOption.value !== '' && selectedOption.flag && (
              <span className="text-xl flex-shrink-0 w-6">{selectedOption.flag}</span>
            )}
            <Select.Value placeholder={placeholder} className="truncate" />
          </span>
          <Select.Icon asChild>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-gray-500 dark:text-white/50 flex-shrink-0 transition-transform duration-300',
                isOpen && 'rotate-180 text-accent'
              )}
            />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className={cn(
              'bg-white dark:bg-carbon-800',
              'rounded-xl shadow-2xl border border-gray-200 dark:border-gray-500/30',
              'z-50 min-w-[var(--radix-select-trigger-width)] max-h-[300px]',
              'overflow-hidden'
            )}
            position="popper"
            sideOffset={8}
          >
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="w-full"
                >
                  {searchable && (
                    <div className="sticky top-0 bg-inherit border-b border-gray-200 dark:border-slate-700 p-2 z-10">
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          'w-full px-3 py-2 rounded-lg',
                          'bg-gray-50 dark:bg-slate-900/50',
                          'border border-gray-200 dark:border-slate-700',
                          'text-gray-900 dark:text-white',
                          'placeholder:text-gray-400 dark:placeholder:text-slate-500',
                          'focus:outline-none focus:ring-2 focus:ring-primary/50',
                          'text-sm'
                        )}
                      />
                    </div>
                  )}

                  <Select.Viewport className="p-2 max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    {filteredOptions.length > 0 ? (
                      filteredOptions.map((option, index) => {
                        // Asegurar que el valor nunca sea una cadena vacía
                        const optionValue = String(option.value);
                        if (optionValue === '') {
                          return null;
                        }
                        return (
                          <Select.Item
                            key={optionValue}
                            value={optionValue}
                            className={cn(
                              'relative flex items-center gap-3 px-4 py-3 rounded-lg',
                              'text-primary dark:text-white',
                              'cursor-pointer select-none',
                              'focus:bg-accent/10 dark:focus:bg-accent/20',
                              'focus:outline-none',
                              'transition-colors duration-150',
                              'hover:bg-gray-200 dark:hover:bg-gray-700',
                              'text-sm font-normal',
                              String(value) === optionValue && 'bg-accent/10 dark:bg-accent/20'
                            )}
                          >
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.02 }}
                              className="flex items-center gap-3 flex-1 min-w-0"
                            >
                              {option.flag && (
                                <span className="text-xl flex-shrink-0 w-7 text-center leading-none">{option.flag}</span>
                              )}
                              <Select.ItemText asChild>
                                <span className="flex-1 truncate">{option.label}</span>
                              </Select.ItemText>
                            </motion.div>
                            <Select.ItemIndicator className="absolute right-4">
                              <Check className="w-4 h-4 text-primary" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        );
                      }).filter(Boolean)
                    ) : (
                      <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No se encontraron opciones
                      </div>
                    )}
                  </Select.Viewport>
                </motion.div>
              )}
            </AnimatePresence>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-sm text-red-500 dark:text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
