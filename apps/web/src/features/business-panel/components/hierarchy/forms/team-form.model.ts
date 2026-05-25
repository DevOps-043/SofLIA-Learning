import type { Team } from '../../../types/hierarchy.types';
import {
  buildLocationContactPayload,
  createEmptyLocationContactFields,
  numberToFormValue,
  trimOptional,
  type LocationContactFormFields,
} from './form-values';

export interface TeamFormData extends LocationContactFormFields {
  code: string;
  description: string;
  leader_id: string;
  max_members: string;
  monthly_target: string;
  name: string;
  target_goal: string;
  zone_id: string;
}

export const createEmptyTeamFormData = (zoneId = ''): TeamFormData => ({
  ...createEmptyLocationContactFields(),
  code: '',
  description: '',
  leader_id: '',
  max_members: '',
  monthly_target: '',
  name: '',
  target_goal: '',
  zone_id: zoneId,
});

export const mapTeamToFormData = (team: Team | null | undefined, fallbackZoneId: string): TeamFormData => {
  if (!team) return createEmptyTeamFormData(fallbackZoneId);

  return {
    address: team.address || '',
    city: team.city || '',
    code: team.code || '',
    country: team.country || 'México',
    description: team.description || '',
    email: team.email || '',
    latitude: numberToFormValue(team.latitude),
    leader_id: team.leader_id || '',
    longitude: numberToFormValue(team.longitude),
    max_members: numberToFormValue(team.max_members),
    monthly_target: numberToFormValue(team.monthly_target),
    name: team.name || '',
    phone: team.phone || '',
    postal_code: team.postal_code || '',
    state: team.state || '',
    target_goal: team.target_goal || '',
    zone_id: team.zone_id || '',
  };
};

export const buildTeamPayload = (formData: TeamFormData): Partial<Team> & { zone_id: string } => ({
  ...buildLocationContactPayload(formData),
  code: trimOptional(formData.code),
  description: trimOptional(formData.description),
  leader_id: formData.leader_id || undefined,
  max_members: formData.max_members ? Number.parseInt(formData.max_members, 10) : undefined,
  monthly_target: formData.monthly_target ? Number.parseFloat(formData.monthly_target) : undefined,
  name: formData.name.trim(),
  target_goal: trimOptional(formData.target_goal),
  zone_id: formData.zone_id,
});
