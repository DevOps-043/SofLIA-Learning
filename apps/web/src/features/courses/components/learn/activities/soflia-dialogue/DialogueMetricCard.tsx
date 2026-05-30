import type { ReactNode } from "react";

interface DialogueMetricCardProps {
  children?: ReactNode;
  icon: ReactNode;
  label: string;
  value: string | number;
}

export function DialogueMetricCard({ children, icon, label, value }: DialogueMetricCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-1.5 sm:p-2.5 dark:border-white/10 dark:bg-white/[0.03] flex flex-col justify-between min-w-0">
      <div>
        <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] font-medium text-gray-500 dark:text-white/40">
          <span className="flex-shrink-0">{icon}</span>
          <span className="truncate">{label}</span>
        </div>
        <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
          {value}
        </p>
      </div>
      {children}
    </div>
  );
}
