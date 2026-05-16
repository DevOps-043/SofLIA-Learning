'use client'

export function CustomizationColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-white/70">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border-0"
          style={{ backgroundColor: 'transparent' }}
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none dark:border-white/10 dark:bg-[#0F1419] dark:text-white"
        />
      </div>
    </div>
  )
}
