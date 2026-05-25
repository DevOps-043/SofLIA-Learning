import {
  containsPersonalInfo,
  hasDangerousPattern,
  isCommonPassword,
} from './checks';
import type { PasswordPersonalInfo } from './types';
import { PasswordStrength } from './types';

export function calculatePasswordEntropy(password: string): number {
  if (!password) {
    return 0;
  }

  let charsetSize = 0;

  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

  return Math.round(password.length * Math.log2(charsetSize));
}

export function calculatePasswordScore(
  password: string,
  personalInfo?: PasswordPersonalInfo,
): number {
  if (!password) {
    return 0;
  }

  const varietyCount = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  let score = Math.min(30, password.length * 2);
  score += varietyCount * 10;
  score += Math.min(30, (calculatePasswordEntropy(password) / 100) * 30);

  if (isCommonPassword(password)) score -= 50;
  if (hasDangerousPattern(password)) score -= 30;
  if (containsPersonalInfo(password, personalInfo)) score -= 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getPasswordStrengthLevel(score: number): PasswordStrength {
  if (score < 20) return PasswordStrength.VERY_WEAK;
  if (score < 40) return PasswordStrength.WEAK;
  if (score < 60) return PasswordStrength.FAIR;
  if (score < 80) return PasswordStrength.STRONG;
  return PasswordStrength.VERY_STRONG;
}
