import type { LucideIcon } from 'lucide-react';
import type { ReportProblemRequestContext } from '../../../reporting/report-problem.contract';

export interface ReporteProblemProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCategory?: string;
  fromLia?: boolean;
  reportContext?: ReportProblemRequestContext;
}

export type Categoria = 'bug' | 'sugerencia' | 'contenido' | 'performance' | 'ui-ux' | 'otro';
export type Prioridad = 'baja' | 'media' | 'alta' | 'critica';

export interface CategoryOption {
  value: Categoria;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}
