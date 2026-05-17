import type { Zone } from '../../../types/hierarchy.types';
import {
  buildLocationContactPayload,
  createEmptyLocationContactFields,
  numberToFormValue,
  trimOptional,
  type LocationContactFormFields,
} from './form-values';

export interface ZoneFormData extends LocationContactFormFields {
  code: string;
  description: string;
  manager_id: string;
  name: string;
  region_id: string;
}

export const createEmptyZoneFormData = (regionId = ''): ZoneFormData => ({
  ...createEmptyLocationContactFields(),
  code: '',
  description: '',
  manager_id: '',
  name: '',
  region_id: regionId,
});

export const mapZoneToFormData = (zone: Zone | null | undefined, fallbackRegionId: string): ZoneFormData => {
  if (!zone) return createEmptyZoneFormData(fallbackRegionId);

  return {
    address: zone.address || '',
    city: zone.city || '',
    code: zone.code || '',
    country: zone.country || 'México',
    description: zone.description || '',
    email: zone.email || '',
    latitude: numberToFormValue(zone.latitude),
    longitude: numberToFormValue(zone.longitude),
    manager_id: zone.manager_id || '',
    name: zone.name || '',
    phone: zone.phone || '',
    postal_code: zone.postal_code || '',
    region_id: zone.region_id || '',
    state: zone.state || '',
  };
};

export const buildZonePayload = (formData: ZoneFormData): Partial<Zone> & { region_id: string } => ({
  ...buildLocationContactPayload(formData),
  code: trimOptional(formData.code),
  description: trimOptional(formData.description),
  manager_id: formData.manager_id || undefined,
  name: formData.name.trim(),
  region_id: formData.region_id,
});
