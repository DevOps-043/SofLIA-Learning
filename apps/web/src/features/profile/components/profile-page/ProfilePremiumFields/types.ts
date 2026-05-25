import type { ProfileColorPalette } from '@/features/profile/types/profile.types'

export interface PremiumInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  icon?: JSX.Element | null
  type?: string
  placeholder?: string
  max?: string
  colors: ProfileColorPalette
}

export interface PremiumDateInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  colors: ProfileColorPalette
}

export interface PremiumSelectOption {
  value: string
  label: string
}

export interface PremiumSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: PremiumSelectOption[]
  placeholder: string
  colors: ProfileColorPalette
}

export interface PremiumTextareaProps {
  label: string
  value: string
  onChange: (value: string) => void
  maxLength?: number
  rows?: number
  colors: ProfileColorPalette
}

export interface PremiumPasswordProps {
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggle: () => void
  error?: string
  colors: ProfileColorPalette
}
