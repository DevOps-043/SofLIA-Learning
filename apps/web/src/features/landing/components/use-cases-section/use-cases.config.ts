import {
  Brain,
  GraduationCap,
  Rocket,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface UseCaseItem {
  key: string;
  icon: LucideIcon;
  gradientClassName: string;
  accentClassName: string;
}

export const useCases: UseCaseItem[] = [
  {
    key: 'upskilling',
    icon: Brain,
    gradientClassName: 'from-accent to-success',
    accentClassName: 'text-accent',
  },
  {
    key: 'onboarding',
    icon: Rocket,
    gradientClassName: 'from-violet-500 to-indigo-500',
    accentClassName: 'text-violet-500',
  },
  {
    key: 'salesEnablement',
    icon: TrendingUp,
    gradientClassName: 'from-warning to-error',
    accentClassName: 'text-warning',
  },
  {
    key: 'partnerTraining',
    icon: Users,
    gradientClassName: 'from-pink-500 to-rose-500',
    accentClassName: 'text-pink-500',
  },
  {
    key: 'customerTraining',
    icon: GraduationCap,
    gradientClassName: 'from-cyan-500 to-sky-500',
    accentClassName: 'text-cyan-500',
  },
  {
    key: 'compliance',
    icon: Target,
    gradientClassName: 'from-success to-green-500',
    accentClassName: 'text-success',
  },
];
