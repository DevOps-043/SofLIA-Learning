import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  COURSE_MANAGEMENT_MUTED_TEXT_CLASS,
  COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS,
} from '../../courseManagementTheme';

export function PanelSection({
  children,
  className,
  icon: Icon,
  iconClassName,
  subtitle,
  title,
}: {
  children: ReactNode;
  className: string;
  icon: LucideIcon;
  iconClassName: string;
  subtitle: string;
  title: string;
}) {
  return (
    <div className={className}>
      <div className="mb-6 flex items-center gap-3">
        <div className={iconClassName}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className={`text-lg font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>{title}</h3>
          <p className={`text-xs ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
