import type { ManagerInfo, Region } from '../../../types/hierarchy.types';

export interface RegionFormProps {
  availableManagers?: ManagerInfo[];
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Region>) => Promise<void>;
  region?: Region | null;
}
