import type { Region } from '../../../types/hierarchy.types';
import type { RegionFormData } from './types';

const EMPTY_REGION_FORM_DATA: RegionFormData = {
  name: '',
  description: '',
  code: '',
  address: '',
  city: '',
  state: '',
  country: 'Mexico',
  postal_code: '',
  latitude: '',
  longitude: '',
  phone: '',
  email: '',
  manager_id: ''
};

export function createRegionFormData(region?: Region | null): RegionFormData {
  if (!region) {
    return { ...EMPTY_REGION_FORM_DATA };
  }

  return {
    name: region.name || '',
    description: region.description || '',
    code: region.code || '',
    address: region.address || '',
    city: region.city || '',
    state: region.state || '',
    country: region.country || 'Mexico',
    postal_code: region.postal_code || '',
    latitude: region.latitude?.toString() || '',
    longitude: region.longitude?.toString() || '',
    phone: region.phone || '',
    email: region.email || '',
    manager_id: region.manager_id || ''
  };
}

export function createRegionPayload(formData: RegionFormData): Partial<Region> {
  return {
    name: formData.name.trim(),
    description: formData.description.trim() || undefined,
    code: formData.code.trim() || undefined,
    address: formData.address.trim() || undefined,
    city: formData.city.trim() || undefined,
    state: formData.state.trim() || undefined,
    country: formData.country.trim() || undefined,
    postal_code: formData.postal_code.trim() || undefined,
    latitude: parseOptionalNumber(formData.latitude),
    longitude: parseOptionalNumber(formData.longitude),
    phone: formData.phone.trim() || undefined,
    email: formData.email.trim() || undefined,
    manager_id: formData.manager_id || undefined
  };
}

export function hasGeocodingInput(formData: RegionFormData) {
  return Boolean(formData.city || formData.address);
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}
