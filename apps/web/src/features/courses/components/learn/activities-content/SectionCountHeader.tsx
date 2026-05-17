import type { LucideIcon } from "lucide-react";

export function SectionCountHeader(props: {
  count: number;
  icon: LucideIcon;
  label: string;
}) {
  const Icon = props.icon;

  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-white/5 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-white/50" />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-white/70">
        {props.label}
      </span>
      <span className="text-xs text-gray-500 dark:text-white/30">
        {props.count}
      </span>
    </div>
  );
}
