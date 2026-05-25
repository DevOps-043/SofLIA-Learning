import type { ManagerInfo, Team, Zone } from '../../../types/hierarchy.types';

export interface TeamFormProps {
  availableLeaders?: ManagerInfo[];
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Team> & { zone_id: string }) => Promise<void>;
  selectedZoneId?: string;
  team?: Team | null;
  zones: Zone[];
}
