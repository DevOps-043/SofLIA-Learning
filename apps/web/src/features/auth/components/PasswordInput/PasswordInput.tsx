'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

// Define interface for custom colors passed from parent
export interface PasswordInputColors {
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
  focusColor?: string;
}

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'focusedField'> {
  id: string;
  placeholder?: string;
  error?: string;
  className?: string;
  focusedField?: string | null;
  customColors?: PasswordInputColors | null; // New prop for custom styling
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(({
  id,
  placeholder = '••••••••',
  error,
  className = '',
  focusedField: _focusedField,
  onFocus,
  onBlur,
  customColors,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [localFocused, setLocalFocused] = useState(false);
  const isFocused = _focusedField === id || localFocused;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setLocalFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setLocalFocused(false);
    onBlur?.(e);
  };

  const inputProps = props;

  // Use custom colors if provided
  const bgColor = customColors?.bgColor;
  const borderColor = customColors?.borderColor;
  const textColor = customColors?.textColor;
  const focusColor = customColors?.focusColor || 'var(--color-accent)';

  // If custom colors are used, we rely on inline styles for structure
  if (customColors) {
    return (
      <div className="w-full relative group">
        <motion.div
           className="relative rounded-xl border transition-all duration-300 overflow-hidden"
           style={{
             backgroundColor: bgColor,
             borderColor: isFocused ? focusColor : (error ? 'var(--color-error)' : borderColor),
             borderWidth: isFocused ? '2px' : '1px',
             boxShadow: isFocused ? `0 0 0 3px color-mix(in srgb, ${focusColor} 12.5%, transparent)` : 'none',
           }}
           animate={{
             scale: isFocused ? 1.005 : 1,
           }}
           transition={{ duration: 0.2 }}
        >
           <div className="flex items-center px-4 py-3">
            <Lock
              className="w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200"
              style={{
                color: isFocused ? focusColor : (error ? 'var(--color-error)' : `color-mix(in srgb, ${textColor} 31.4%, transparent)`)
              }}
            />
            <input
              ref={ref}
              id={id}
              type={showPassword ? 'text' : 'password'}
              placeholder={placeholder}
              className={`flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal tracking-widest ${className}`}
              style={{
                color: textColor,
                letterSpacing: '0.15em'
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...inputProps}
            />
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="ml-2 p-1.5 rounded-lg transition-colors flex-shrink-0 hover:opacity-70"
              style={{
                color: isFocused ? focusColor : `color-mix(in srgb, ${textColor} 31.4%, transparent)`,
                backgroundColor: isFocused ? `color-mix(in srgb, ${focusColor} 8.2%, transparent)` : 'transparent'
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </motion.button>
          </div>
        </motion.div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1"
          >
             <span>{error}</span>
          </motion.p>
        )}
      </div>
    );
  }

  // Fallback to original implementation for other uses
  return (
    <div className="w-full">
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
          <Lock
            className={`w-5 h-5 flex-shrink-0 mr-3 transition-colors duration-200 ${
              isFocused
                ? 'text-accent'
                : error
                  ? 'text-red-500'
                : 'text-gray-500 dark:text-white/50'
            }`}
          />
          <input
            ref={ref}
            id={id}
            type={showPassword ? 'text' : 'password'}
            placeholder={placeholder}
            className={`flex-1 w-full bg-transparent outline-none placeholder:opacity-50 transition-colors text-sm font-normal font-sans text-primary dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50 ${className}`}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...inputProps}
          />
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`ml-2 transition-colors p-1 rounded-lg ${
              isFocused
                ? 'text-accent'
                : 'text-gray-500 dark:text-white/50 hover:text-accent dark:hover:text-accent'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </motion.button>
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

PasswordInput.displayName = 'PasswordInput'; // Importante para devtools
