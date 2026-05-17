import type React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { BusinessInviteTheme } from './types';

interface InviteTextFieldProps {
  icon: LucideIcon;
  label: string;
  maxLength?: number;
  name: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  optionalLabel?: string;
  placeholder: string;
  required?: boolean;
  rows?: number;
  status: string;
  theme: BusinessInviteTheme;
  type?: string;
  value: string;
}

export function InviteTextField({
  icon: Icon,
  label,
  maxLength,
  name,
  onChange,
  optionalLabel,
  placeholder,
  required,
  rows,
  status,
  theme,
  type = 'text',
  value
}: InviteTextFieldProps) {
  const isTextArea = rows !== undefined;

  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: theme.mutedTextColor }}>
        {label} {required && <span className="text-red-400">*</span>}
        {optionalLabel && <span className="ml-1" style={{ color: theme.mutedTextColor }}>({optionalLabel})</span>}
      </label>
      <div className="relative">
        <Icon className={`absolute left-3 w-4 h-4 ${isTextArea ? 'top-3' : 'top-1/2 -translate-y-1/2'}`} style={{ color: theme.mutedTextColor }} />
        {isTextArea ? (
          <textarea name={name} value={value} onChange={onChange} disabled={status === 'loading'} rows={rows} className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors resize-none disabled:opacity-50" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }} placeholder={placeholder} maxLength={maxLength} />
        ) : (
          <input type={type} name={name} value={value} onChange={onChange} required={required} disabled={status === 'loading'} className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }} placeholder={placeholder} maxLength={maxLength} />
        )}
      </div>
      {maxLength && (
        <p className="text-xs mt-1 text-right" style={{ color: theme.mutedTextColor }}>
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}
