'use client'

interface AdminCreateCompanyTextFieldProps {
  label: string
  value: string
  placeholder?: string
  type?: string
  note?: string
  multiline?: boolean
  rows?: number
  onChange: (value: string) => void
}

export function AdminCreateCompanyTextField(props: AdminCreateCompanyTextFieldProps) {
  const baseClassName = 'w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-900 outline-none transition-all placeholder-gray-400 focus:border-gray-300 focus:ring-1 focus:ring-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-white/20 dark:focus:border-white/20 dark:focus:ring-white/20'
  return (
    <div>
      <label className="mb-2 ml-1 block text-xs text-gray-600 dark:text-gray-400">{props.label}{props.note ? <span className="text-xs text-gray-500"> {props.note}</span> : null}</label>
      {props.multiline ? <textarea rows={props.rows || 3} value={props.value} onChange={(e) => props.onChange(e.target.value)} className={`${baseClassName} resize-none`} placeholder={props.placeholder} /> : <input type={props.type || 'text'} value={props.value} onChange={(e) => props.onChange(e.target.value)} className={baseClassName} placeholder={props.placeholder} />}
    </div>
  )
}
