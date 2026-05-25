import type { ActionButtonProps } from './types'

export function ActionButton({
  label,
  icon,
  onClick,
  backgroundColor,
  color,
  borderColor,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl px-4 py-3 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor,
        color,
        border: `1px solid ${borderColor}`,
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
