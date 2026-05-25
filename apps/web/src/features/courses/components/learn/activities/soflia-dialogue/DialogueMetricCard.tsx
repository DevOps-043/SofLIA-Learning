import type { ReactNode } from "react";

interface DialogueMetricCardProps {
  children?: ReactNode;
  icon: ReactNode;
  label: string;
  value: string | number;
}

export function DialogueMetricCard({ children, icon, label, value }: DialogueMetricCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 dark:text-white/40">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
      {children}
    </div>
  );
}
