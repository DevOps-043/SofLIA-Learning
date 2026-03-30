import type { StudyApproach } from '../types/planner-ui.types';

export interface StudyApproachOption {
  value: StudyApproach;
  title: string;
  shortTitle: string;
  description: string;
  sessionRange: string;
  supportingCopy: string;
}

export const STUDY_APPROACH_OPTIONS: StudyApproachOption[] = [
  {
    value: 'corto',
    title: 'Terminar rapido',
    shortTitle: 'Rapido',
    description: 'Sesiones largas para avanzar mas cada dia y terminar antes',
    sessionRange: '60-90 min por sesion',
    supportingCopy: 'Descansos de 15 min',
  },
  {
    value: 'balance',
    title: 'Sesiones equilibradas',
    shortTitle: 'Balance',
    description: 'Distribucion equilibrada para un ritmo comodo y efectivo',
    sessionRange: '45-60 min por sesion',
    supportingCopy: 'Recomendado',
  },
  {
    value: 'largo',
    title: 'Sin prisa',
    shortTitle: 'Sin prisa',
    description: 'Sesiones cortas distribuidas para aprender a tu ritmo',
    sessionRange: '20-35 min por sesion',
    supportingCopy: 'Descansos de 5 min',
  },
];
