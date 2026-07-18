'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { OrganizationRegisterFieldProps } from './types'

export function OrganizationRegisterField({
  id,
  label,
  type,
  placeholder,
  registration,
  palette,
  error,
  icon: Icon,
  disabled = false,
  readOnly = false,
  onPaste,
  rightAdornment,
  helperText,
  max,
}: OrganizationRegisterFieldProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-wider mb-1.5"
        style={{ color: palette.textColor }}
      >
        {label}
      </label>
      <div className="relative group">
        <motion.div
          className="relative rounded-xl border transition-all duration-300 overflow-hidden"
          style={{
            backgroundColor: palette.inputBgColor,
            borderColor: isFocused
              ? palette.focusColor
              : error
                ? 'var(--color-error)'
                : palette.borderColor,
            boxShadow: isFocused
              ? `0 0 0 3px color-mix(in srgb, ${palette.focusColor} 13%, transparent)`
              : 'none',
          }}
          animate={{ scale: isFocused ? 1.003 : 1 }}
        >
          <div className="flex items-center px-4 py-3">
            {Icon ? (
              <Icon
                className="w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200"
                style={{
                  color: isFocused
                    ? palette.focusColor
                    : `color-mix(in srgb, ${palette.textColor} 38%, transparent)`,
                }}
              />
            ) : null}
            <input
              id={id}
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              max={max}
              onPaste={onPaste}
              className={`flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal ${
                disabled || readOnly ? 'cursor-not-allowed opacity-60' : ''
              }`}
              style={{ color: palette.textColor }}
              {...registration}
              onFocus={() => setIsFocused(true)}
              onBlur={(event) => {
                setIsFocused(false)
                registration.onBlur(event)
              }}
            />
            {rightAdornment}
          </div>
        </motion.div>
      </div>
      {error ? <p className="auth-error">{error}</p> : null}
      {helperText ? (
        <p className="text-xs mt-1" style={{ color: `color-mix(in srgb, ${palette.textColor} 37.6%, transparent)` }}>
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
