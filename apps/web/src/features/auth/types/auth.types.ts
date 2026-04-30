import type { UserGender } from '../../../lib/schemas/user-demographics.schema'

export interface LoginFormData {
  emailOrUsername: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  username: string;
  countryCode: string;
  phoneNumber: string;
  dateOfBirth?: string | null;
  gender?: UserGender | null;
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  cargo_titulo?: string;
  acceptTerms: boolean;
}

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export type AuthTab = 'login' | 'register';

export type LegalDocumentTab = 'terms' | 'privacy' | 'conduct';
