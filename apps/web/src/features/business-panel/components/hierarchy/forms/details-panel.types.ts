import type { Region, Team, Zone } from '../../../types/hierarchy.types';

export type DetailsPanelType = 'region' | 'team' | 'zone';

export interface DetailsPanelProps {
  data: Region | Team | Zone | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  type: DetailsPanelType;
}

export const detailsPanelColorClasses: Record<DetailsPanelType, string> = {
  region: 'bg-blue-500',
  team: 'bg-amber-500',
  zone: 'bg-emerald-500',
};
