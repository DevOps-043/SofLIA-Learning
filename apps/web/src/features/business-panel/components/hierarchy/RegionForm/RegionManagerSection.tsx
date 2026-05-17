import { User } from 'lucide-react';
import {
  getManagerDisplayName,
  type ManagerInfo
} from '../../../types/hierarchy.types';
import { Section } from '../HierarchyForms';
import type { RegionFieldUpdater, RegionFormData } from './types';

interface RegionManagerSectionProps {
  availableManagers: ManagerInfo[];
  formData: RegionFormData;
  isLoading?: boolean;
  onFieldChange: RegionFieldUpdater;
}

export function RegionManagerSection({
  availableManagers,
  formData,
  isLoading,
  onFieldChange
}: RegionManagerSectionProps) {
  return (
    <Section title="Gerente Regional" icon={<User className="w-5 h-5 text-purple-500" />} defaultOpen={false}>
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Asignar Gerente Regional
        </label>
        <select
          value={formData.manager_id}
          onChange={(event) => onFieldChange('manager_id', event.target.value)}
          disabled={isLoading || availableManagers.length === 0}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Sin asignar</option>
          {availableManagers.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {getManagerDisplayName(manager)} ({manager.email})
            </option>
          ))}
        </select>
        {availableManagers.length === 0 && (
          <p className="text-xs text-neutral-500 mt-1">
            No hay usuarios disponibles para asignar. Los gerentes se asignan desde la seccion de usuarios.
          </p>
        )}
      </div>
    </Section>
  );
}
