interface ToggleFieldProps {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}

export function ToggleField({
  checked,
  description,
  label,
  onChange,
}: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-[#0A2540] dark:text-white">{label}</p>
        <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-1">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer ml-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-[#E9ECEF] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00D4B3]/20 rounded-full peer dark:bg-[#0F1419] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E9ECEF] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-[#6C757D]/30 peer-checked:bg-[#00D4B3] dark:peer-checked:bg-[#00D4B3]" />
      </label>
    </div>
  );
}
