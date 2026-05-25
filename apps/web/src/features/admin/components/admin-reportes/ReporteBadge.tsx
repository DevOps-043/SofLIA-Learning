interface ReporteBadgeProps {
  children: string
  className: string
}

export function ReporteBadge({ children, className }: ReporteBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${className}`}>
      {children}
    </span>
  )
}
