import { User } from 'lucide-react';
import type { ManagerInfo } from '../../../types/hierarchy.types';
import { getManagerDisplayName } from '../../../types/hierarchy.types';

interface DescriptionBlockProps {
  description?: string | null;
  label: string;
}

interface ManagerCardProps {
  label: string;
  manager?: ManagerInfo | null;
  unassignedLabel: string;
}

export function DescriptionBlock({ description, label }: DescriptionBlockProps) {
  if (!description) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">{label}</h4>
      <p className="text-neutral-700 dark:text-neutral-300">{description}</p>
    </div>
  );
}

export function ManagerCard({ label, manager, unassignedLabel }: ManagerCardProps) {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4">
      <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">{label}</h4>
      {manager ? (
        <div className="flex items-center gap-3">
          {manager.profile_picture_url ? (
            <img src={manager.profile_picture_url} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center">
              <User className="w-6 h-6 text-neutral-500" />
            </div>
          )}
          <div>
            <p className="font-medium text-neutral-900 dark:text-white">{getManagerDisplayName(manager)}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{manager.email}</p>
          </div>
        </div>
      ) : (
        <p className="text-neutral-500 dark:text-neutral-400 italic">{unassignedLabel}</p>
      )}
    </div>
  );
}
