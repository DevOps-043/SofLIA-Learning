import type React from 'react';
import type { LucideIcon } from 'lucide-react';
import { getChartTheme } from './chart-theme';

interface ChartShellProps {
  children: React.ReactNode;
  darkMode?: boolean;
  icon?: LucideIcon;
  title: string;
  totalLabel?: string;
}

export function ChartShell({
  children,
  darkMode = true,
  icon: Icon,
  title,
  totalLabel
}: ChartShellProps) {
  const theme = getChartTheme(darkMode);

  return (
    <div className={`rounded-xl border p-6 ${theme.borderClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-5 h-5 ${theme.iconClass}`} />}
          <h3 className={`text-lg font-semibold ${theme.textClass}`}>{title}</h3>
        </div>
        {totalLabel && (
          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
            {totalLabel}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
