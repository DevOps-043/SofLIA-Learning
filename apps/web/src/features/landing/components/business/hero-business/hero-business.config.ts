import {
  Shield,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface HeroBusinessStat {
  label: string;
  value: string;
}

export interface HeroBusinessBenefit {
  icon: LucideIcon;
  label: string;
}

export const heroBusinessStats: HeroBusinessStat[] = [
  { value: '500+', label: 'Empresas' },
  { value: '50K+', label: 'Usuarios' },
  { value: '100+', label: 'Instructores' },
];

export const heroBusinessBenefits: HeroBusinessBenefit[] = [
  {
    icon: TrendingUp,
    label: 'Capacitación escalable para toda tu organización',
  },
  {
    icon: Users,
    label: 'Gestión centralizada de aprendizaje',
  },
  {
    icon: Shield,
    label: 'Reportes detallados de progreso y certificaciones',
  },
];
