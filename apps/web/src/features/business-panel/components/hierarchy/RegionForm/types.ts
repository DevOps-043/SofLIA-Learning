import type { ManagerInfo, Region } from '../../../types/hierarchy.types';

export interface RegionFormProps {
  region?: Region | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Region>) => Promise<void>;
  isLoading?: boolean;
  availableManagers?: ManagerInfo[];
}

export interface RegionFormData {
  name: string;
  description: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  manager_id: string;
}

export type RegionFormField = keyof RegionFormData;
export type RegionFieldUpdater = (field: RegionFormField, value: string) => void;
