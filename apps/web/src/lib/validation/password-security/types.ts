export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireLowercase: true,
  requireUppercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  minSpecialChars: 1,
  allowedSpecialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

export enum PasswordStrength {
  VERY_WEAK = 0,
  WEAK = 1,
  FAIR = 2,
  STRONG = 3,
  VERY_STRONG = 4,
}

export interface PasswordValidationResult {
  isValid: boolean;
  strength: PasswordStrength;
  score: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface PasswordPersonalInfo {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}
