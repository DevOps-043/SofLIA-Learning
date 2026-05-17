export type FieldUpdater<TFormData> = <K extends keyof TFormData>(
  field: K,
  value: string
) => void;

export interface FieldProps<TFormData> {
  className?: string;
  disabled?: boolean;
  field: keyof TFormData;
  label: string;
  onChange: FieldUpdater<TFormData>;
  placeholder?: string;
  required?: boolean;
  value: string;
}

export interface SelectOption {
  label: string;
  value: string;
}
