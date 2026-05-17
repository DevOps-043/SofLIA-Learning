import {
  COMMON_PASSWORDS,
  DANGEROUS_PATTERNS,
  PERSONAL_INFO_PATTERNS,
} from './constants';
import type { PasswordPersonalInfo } from './types';

export function isCommonPassword(password: string): boolean {
  const lowerPassword = password.toLowerCase();

  if (COMMON_PASSWORDS.includes(lowerPassword as typeof COMMON_PASSWORDS[number])) {
    return true;
  }

  const basePassword = lowerPassword.replace(/\d+$/, '');
  return COMMON_PASSWORDS.includes(basePassword as typeof COMMON_PASSWORDS[number]);
}

export function hasDangerousPattern(password: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(password));
}

export function containsPersonalInfo(
  password: string,
  personalInfo?: PasswordPersonalInfo,
): boolean {
  const lowerPassword = password.toLowerCase();

  if (PERSONAL_INFO_PATTERNS.some((pattern) => pattern.test(lowerPassword))) {
    return true;
  }

  if (!personalInfo) {
    return false;
  }

  return hasUserIdentifier(lowerPassword, personalInfo);
}

function hasUserIdentifier(
  lowerPassword: string,
  personalInfo: PasswordPersonalInfo,
): boolean {
  const { email, username, firstName, lastName } = personalInfo;

  if (email) {
    const emailUser = email.split('@')[0].toLowerCase();
    if (emailUser.length >= 3 && lowerPassword.includes(emailUser)) {
      return true;
    }
  }

  return [username, firstName, lastName].some((value) => {
    return Boolean(value && value.length >= 3 && lowerPassword.includes(value.toLowerCase()));
  });
}
