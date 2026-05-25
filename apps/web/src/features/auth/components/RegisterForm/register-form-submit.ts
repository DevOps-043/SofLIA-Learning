import type { RegisterFormData } from '../../types/auth.types';

export function toRegisterActionFormData(
  data: RegisterFormData,
  captchaToken = '',
): FormData {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      formData.append(key, value ? 'true' : 'false');
      return;
    }

    formData.append(key, value === null || value === undefined ? '' : String(value));
  });

  formData.append('captchaToken', captchaToken);

  return formData;
}
