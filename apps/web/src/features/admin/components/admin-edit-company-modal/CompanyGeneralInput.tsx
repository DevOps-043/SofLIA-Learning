'use client'

export function CompanyGeneralInput(props: { label: string; value: string | number; placeholder?: string; type?: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-2 ml-1 block text-xs text-gray-400">{props.label}</label>
      <input type={props.type || 'text'} value={props.value} onChange={(e) => props.onChange(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all placeholder-white/20 focus:border-white/20" placeholder={props.placeholder} />
    </div>
  )
}
