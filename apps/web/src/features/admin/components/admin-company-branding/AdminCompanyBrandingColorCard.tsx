'use client'

interface AdminCompanyBrandingColorCardProps {
  label: string
  value: string
  onChange: (value: string) => void
  dark?: boolean
}

export function AdminCompanyBrandingColorCard({
  label,
  value,
  onChange,
  dark = false,
}: AdminCompanyBrandingColorCardProps) {
  const containerClass = dark
    ? 'border-white/10 bg-white/5 hover:bg-white/10'
    : 'border-gray-200 bg-gray-100 hover:bg-gray-200'
  const swatchClass = dark ? 'border-white/20' : 'border-gray-300'
  const inputClass = dark
    ? 'text-white focus:border-white/30'
    : 'text-gray-900 focus:border-gray-300'

  return (
    <div className={`rounded-xl border p-3 transition-colors ${containerClass}`}>
      <p className="mb-2 text-[10px] font-medium uppercase text-gray-400">{label}</p>
      <div className="flex items-center gap-3">
        <div className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border shadow-lg ${swatchClass}`}>
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 h-full w-full scale-150 cursor-pointer border-none p-0"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full border-b border-transparent bg-transparent text-sm font-mono outline-none ${inputClass}`}
        />
      </div>
    </div>
  )
}
