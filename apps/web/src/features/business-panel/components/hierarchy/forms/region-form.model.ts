import type { Region } from '../../../types/hierarchy.types';
import {
  buildLocationContactPayload,
  createEmptyLocationContactFields,
  numberToFormValue,
  trimOptional,
  type LocationContactFormFields,
} from './form-values';

export interface RegionFormData extends LocationContactFormFields {
  code: string;
  description: string;
  manager_id: string;
  name: string;
}

export const createEmptyRegionFormData = (): RegionFormData => ({
  ...createEmptyLocationContactFields(),
  code: '',
  description: '',
  manager_id: '',
  name: '',
});

export const mapRegionToFormData = (region: Region | null | undefined): RegionFormData => {
  if (!region) return createEmptyRegionFormData();

  return {
    address: region.address || '',
    city: region.city || '',
    code: region.code || '',
    country: region.country || 'México',
    description: region.description || '',
    email: region.email || '',
    latitude: numberToFormValue(region.latitude),
    longitude: numberToFormValue(region.longitude),
    manager_id: region.manager_id || '',
    name: region.name || '',
    phone: region.phone || '',
    postal_code: region.postal_code || '',
    state: region.state || '',
  };
};

export const buildRegionPayload = (formData: RegionFormData): Partial<Region> => ({
  ...buildLocationContactPayload(formData),
  code: trimOptional(formData.code),
  description: trimOptional(formData.description),
  manager_id: formData.manager_id || undefined,
  name: formData.name.trim(),
});
