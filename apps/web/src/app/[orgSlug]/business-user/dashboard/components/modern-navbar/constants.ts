import { Monitor, Moon, Sun } from 'lucide-react';
import type { Theme } from '../../../../../../core/stores/themeStore';

export const LANGUAGE_OPTIONS = [
  { value: 'es', compactLabel: 'ES', label: 'Español' },
  { value: 'en', compactLabel: 'EN', label: 'English' },
  { value: 'pt', compactLabel: 'PT', label: 'Português' },
] as const;

export const THEME_OPTIONS: Array<{
  value: Theme;
  label: string;
  icon: typeof Sun;
}> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];
