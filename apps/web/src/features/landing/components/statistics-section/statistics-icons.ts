import { Briefcase, Clock, Star, Users, type LucideIcon } from 'lucide-react';

const statIcons = {
  'Estudiantes Activos': Users,
  'Cursos en la Plataforma': Briefcase,
  '% de Satisfaccion': Star,
  '% de Satisfacción': Star,
  'Horas de Contenido': Clock,
} as const;

export function getStatisticIcon(label: string): LucideIcon {
  return statIcons[label as keyof typeof statIcons] ?? Users;
}
