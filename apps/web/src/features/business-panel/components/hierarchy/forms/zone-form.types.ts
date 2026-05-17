import type { ManagerInfo, Region, Zone } from '../../../types/hierarchy.types';

export interface ZoneFormProps {
  availableManagers?: ManagerInfo[];
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Zone> & { region_id: string }) => Promise<void>;
  regions: Region[];
  selectedRegionId?: string;
  zone?: Zone | null;
}
