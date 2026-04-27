'use client'

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
            borderColor: palette.borderColor,
            borderWidth: '1px',
          }}
        >
          <div className="flex items-center px-4 py-3">
            {Icon ? (
              <Icon
                className="w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200"
                style={{ color: `${palette.textColor}50` }}
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
            />
            {rightAdornment}
          </div>
        </motion.div>
      </div>
      {error ? <p className="auth-error">{error}</p> : null}
      {helperText ? (
        <p className="text-xs mt-1" style={{ color: `${palette.textColor}60` }}>
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
