'use client'

import { ChevronDown } from 'lucide-react'
import { colors } from '../courses-section.types'

interface AssignSelectFieldProps {
  label: string
  placeholder: string
  value: string | null
  onChange: (value: string) => void
  options: Array<{ id: string; label: string }>
}

export function AssignSelectField({
  label,
  placeholder,
  value,
  onChange,
  options,
}: AssignSelectFieldProps) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.grayMedium }}>{label}</label>
      <div className="relative group">
        <select
          className="w-full h-14 pl-5 pr-10 rounded-2xl bg-black/20 border-white/5 border text-white text-sm appearance-none outline-none focus:ring-2"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map(option => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
      </div>
    </div>
  )
}
