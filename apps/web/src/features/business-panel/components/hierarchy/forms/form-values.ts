export const DEFAULT_COUNTRY = 'México';

export interface LocationContactFormFields {
  address: string;
  city: string;
  country: string;
  email: string;
  latitude: string;
  longitude: string;
  phone: string;
  postal_code: string;
  state: string;
}

export const createEmptyLocationContactFields = (): LocationContactFormFields => ({
  address: '',
  city: '',
  country: DEFAULT_COUNTRY,
  email: '',
  latitude: '',
  longitude: '',
  phone: '',
  postal_code: '',
  state: '',
});

export const trimOptional = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed || undefined;
};

export const parseOptionalCoordinate = (value: string): number | null => {
  if (!value || value.trim() === '') return null;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const numberToFormValue = (value?: number | null): string => {
  if (value == null || Number.isNaN(Number(value))) return '';
  return Number(value).toString();
};

export const buildLocationContactPayload = (formData: LocationContactFormFields) => ({
  address: trimOptional(formData.address),
  city: trimOptional(formData.city),
  country: trimOptional(formData.country),
  email: trimOptional(formData.email),
  latitude: parseOptionalCoordinate(formData.latitude),
  longitude: parseOptionalCoordinate(formData.longitude),
  phone: trimOptional(formData.phone),
  postal_code: trimOptional(formData.postal_code),
  state: trimOptional(formData.state),
});
