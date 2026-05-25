import { PASSWORD_REQUIREMENTS } from './types';

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';

export function generateSecurePassword(length: number = 16): string {
  const special = PASSWORD_REQUIREMENTS.allowedSpecialChars;
  const allChars = LOWERCASE + UPPERCASE + NUMBERS + special;

  let password = '';

  password += randomChar(LOWERCASE);
  password += randomChar(UPPERCASE);
  password += randomChar(NUMBERS);
  password += randomChar(special);

  for (let i = password.length; i < length; i++) {
    password += randomChar(allChars);
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

function randomChar(characters: string): string {
  return characters[Math.floor(Math.random() * characters.length)];
}
