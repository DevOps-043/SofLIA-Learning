'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'focusedField'> {
  id: string;
  label?: string;
  placeholder?: string;
  error?: string;
  icon?: LucideIcon;
  className?: string;
  focusedField?: string | null;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(({
  id,
  label,
  placeholder,
  error,
  icon: Icon,
  className = '',
  focusedField: _focusedField, // Renombrar para evitar que se pase al DOM
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [localFocused, setLocalFocused] = React.useState(false);
  const isFocused = _focusedField === id || localFocused;
  
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setLocalFocused(true);
    onFocus?.(e);
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setLocalFocused(false);
    onBlur?.(e);
  };

  // Filtrar explícitamente focusedField de props para evitar que se pase al DOM
  const inputProps = props;
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium mb-2 text-primary dark:text-white/90 transition-colors"
        >
          {label}
        </label>
      )}
      <motion.div
        className={`relative rounded-xl border transition-all duration-300 overflow-hidden ${
          isFocused
            ? 'bg-white dark:bg-carbon-800 border-accent shadow-lg shadow-accent/10'
            : error
              ? 'bg-white dark:bg-carbon-800 border-red-500 dark:border-red-500'
              : 'bg-white dark:bg-carbon-800 border-gray-200 dark:border-gray-500/30'
        } ${isFocused ? 'ring-2 ring-accent ring-opacity-20' : ''}`}
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center px-4 py-3.5">
          {Icon && (
            <Icon
              className={`w-5 h-5 flex-shrink-0 mr-3 transition-colors duration-200 ${
                isFocused
                  ? 'text-accent'
                  : error
                    ? 'text-red-500'
                    : 'text-gray-500 dark:text-white/50'
              }`}
            />
          )}
          <input
            ref={ref}
            id={id}
            placeholder={placeholder}
            className={`flex-1 w-full bg-transparent outline-none placeholder:opacity-50 transition-colors text-sm font-normal font-sans text-primary dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50 ${className}`}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...inputProps}
          />
        </div>
      </motion.div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

TextInput.displayName = 'TextInput'; // Importante para devtools
