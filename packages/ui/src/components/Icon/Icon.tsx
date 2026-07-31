import React from 'react';
import {
  Award,
  BarChart,
  BookOpen,
  DollarSign,
  GraduationCap,
  Headphones,
  Link,
  Settings,
  Shield,
  TrendingUp,
  User,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Registro explícito de iconos compartidos.
 *
 * Evita importar `* as LucideIcons`, que obliga a Webpack a evaluar el índice
 * completo de `lucide-react` y puede dejar referencias de módulo indefinidas
 * durante cargas dinámicas o Hot Module Replacement.
 */
const iconRegistry = {
  Award,
  BarChart,
  BookOpen,
  DollarSign,
  GraduationCap,
  Headphones,
  Link,
  Settings,
  Shield,
  TrendingUp,
  User,
  Users,
  Wrench,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconRegistry;

export interface IconProps extends React.SVGAttributes<SVGElement> {
  name: IconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  color?: string;
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

function Icon({ 
  name, 
  size = 'md', 
  color = 'currentColor', 
  className, 
  animate = false,
  ...props 
}: IconProps) {
  const IconComponent = iconRegistry[name];
  
  if (!IconComponent) {
    return null;
  }

  const iconSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <IconComponent
      width={iconSize}
      height={iconSize}
      strokeWidth={2.5}
      className={cn(
        'transition-all duration-200',
        animate && 'hover:scale-110 hover:rotate-3',
        className
      )}
      style={{ color }}
      {...props}
    />
  );
}

export { Icon };
