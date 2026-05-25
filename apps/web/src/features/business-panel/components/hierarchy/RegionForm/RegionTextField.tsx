import type { RegionFieldUpdater, RegionFormData, RegionFormField } from './types';

interface RegionTextFieldProps {
  field: RegionFormField;
  label: string;
  value: string;
  onChange: RegionFieldUpdater;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
  step?: number;
}

interface RegionTextAreaProps {
  value: RegionFormData['description'];
  onChange: RegionFieldUpdater;
  disabled?: boolean;
}

const FIELD_CLASS = 'w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

export function RegionTextField({
  field,
  label,
  value,
  onChange,
  disabled,
  placeholder,
  type = 'text',
  step
}: RegionTextFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
        {label}
      </label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
        className={FIELD_CLASS}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

export function RegionDescriptionField({
  value,
  onChange,
  disabled
}: RegionTextAreaProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
        Descripcion
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange('description', event.target.value)}
        rows={2}
        className={`${FIELD_CLASS} resize-none`}
        placeholder="Descripcion de la region..."
        disabled={disabled}
      />
    </div>
  );
}
