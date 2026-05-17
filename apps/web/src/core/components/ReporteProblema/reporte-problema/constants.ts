import { AlertCircle, FileText, HelpCircle, Lightbulb, Palette, Zap } from 'lucide-react';
import type { CategoryOption, Prioridad } from './types';

export const categorias: CategoryOption[] = [
  { value: 'bug', label: 'Bug / Error', icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-500' },
  { value: 'sugerencia', label: 'Sugerencia', icon: Lightbulb, color: 'text-[#F59E0B] dark:text-[#F59E0B]', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-[#F59E0B]' },
  { value: 'contenido', label: 'Problema de Contenido', icon: FileText, color: 'text-[#0A2540] dark:text-[#00D4B3]', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-[#0A2540] dark:border-[#00D4B3]' },
  { value: 'performance', label: 'Performance', icon: Zap, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-500' },
  { value: 'ui-ux', label: 'Diseno / UX', icon: Palette, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-50 dark:bg-pink-900/20', borderColor: 'border-pink-500' },
  { value: 'otro', label: 'Otro', icon: HelpCircle, color: 'text-[#6C757D] dark:text-[#6C757D]', bgColor: 'bg-gray-50 dark:bg-gray-800/50', borderColor: 'border-[#6C757D]' },
];

export const prioridades: Array<{ value: Prioridad; label: string }> = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Critica' },
];
