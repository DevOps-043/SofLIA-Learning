import type { ReactNode } from "react";

interface DialogueMetricBarProps {
  icon: ReactNode;
  label: string;
  progress: number;
  valueText: string;
}

export function DialogueMetricBar({ icon, label, progress, valueText }: DialogueMetricBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 text-[11px] font-medium">
        <span className="flex min-w-0 items-center gap-1.5 text-gray-500 dark:text-white/50">
          <span className="flex-shrink-0 text-accent">{icon}</span>
          <span className="truncate">{label}</span>
        </span>
        <span className="flex-shrink-0 tabular-nums font-semibold text-gray-900 dark:text-white">
          {valueText}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200/80 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
