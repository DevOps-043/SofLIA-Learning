import {
  containsPersonalInfo,
  hasDangerousPattern,
  isCommonPassword,
} from './checks';
import { calculatePasswordScore, getPasswordStrengthLevel } from './scoring';
import {
  PASSWORD_REQUIREMENTS,
  PasswordStrength,
  type PasswordPersonalInfo,
  type PasswordValidationResult,
} from './types';

export function validatePassword(
  password: string,
  personalInfo?: PasswordPersonalInfo,
): PasswordValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  addRequirementErrors(password, errors);
  addRiskFeedback(password, personalInfo, errors, warnings, suggestions);

  const score = calculatePasswordScore(password, personalInfo);
  const strength = getPasswordStrengthLevel(score);

  if (strength < PasswordStrength.STRONG) {
    addStrengthSuggestions(password, suggestions);
  }

  return {
    isValid: errors.length === 0,
    strength,
    score,
    errors,
    warnings,
    suggestions,
  };
}

function addRequirementErrors(password: string, errors: string[]): void {
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`La contraseña debe tener al menos ${PASSWORD_REQUIREMENTS.minLength} caracteres`);
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`La contraseña no puede exceder ${PASSWORD_REQUIREMENTS.maxLength} caracteres`);
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !specialCharsRegex().test(password)) {
    errors.push(
      `La contraseña debe contener al menos un carácter especial (${PASSWORD_REQUIREMENTS.allowedSpecialChars})`,
    );
  }
}

function addRiskFeedback(
  password: string,
  personalInfo: PasswordPersonalInfo | undefined,
  errors: string[],
  warnings: string[],
  suggestions: string[],
): void {
  if (isCommonPassword(password)) {
    errors.push('Esta contraseña es muy común y fácil de adivinar. Por favor elige otra');
    suggestions.push('Usa una combinación única de palabras, números y símbolos');
  }

  if (hasDangerousPattern(password)) {
    warnings.push('La contraseña contiene un patrón repetitivo que la hace menos segura');
    suggestions.push('Evita secuencias o caracteres repetidos');
  }

  if (containsPersonalInfo(password, personalInfo)) {
    warnings.push('La contraseña contiene información personal que la hace menos segura');
    suggestions.push('No uses tu nombre, email o username en la contraseña');
  }
}

function addStrengthSuggestions(password: string, suggestions: string[]): void {
  if (password.length < 12) suggestions.push('Usa al menos 12 caracteres para mayor seguridad');
  if (!/[!@#$%^&*()]/.test(password)) suggestions.push('Incluye caracteres especiales como !@#$%^&*()');
  if (password.length < 16) {
    suggestions.push('Considera usar una frase de contraseña (passphrase) de 16+ caracteres');
  }
}

function specialCharsRegex(): RegExp {
  const escapedChars = PASSWORD_REQUIREMENTS.allowedSpecialChars.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`[${escapedChars}]`);
}
