import type { FieldProps, SelectOption } from './form-field.types';

const inputClassName =
  'w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50';

export function TextInputField<TFormData>({
  className,
  disabled,
  field,
  label,
  onChange,
  placeholder,
  required,
  value,
}: FieldProps<TFormData>) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
        {label}{required ? ' *' : ''}
      </label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
        className={inputClassName}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

export function TextAreaField<TFormData>({
  disabled,
  field,
  label,
  onChange,
  placeholder,
  value,
}: FieldProps<TFormData>) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
        rows={2}
        className={`${inputClassName} resize-none`}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

export function SelectField<TFormData>({
  disabled,
  field,
  label,
  onChange,
  options,
  required,
  value,
}: FieldProps<TFormData> & { options: SelectOption[] }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
        {label}{required ? ' *' : ''}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
        disabled={disabled}
        className={inputClassName}
      >
        {options.map((option) => (
          <option key={option.value || 'empty'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
