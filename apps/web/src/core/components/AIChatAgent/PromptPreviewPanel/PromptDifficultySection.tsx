import { Target } from 'lucide-react';
import type { PromptDraft } from './types';

interface PromptDifficultySectionProps {
  difficulty: PromptDraft['difficulty_level'];
}

const DIFFICULTY_LABELS: Record<PromptDraft['difficulty_level'], string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado'
};

const DIFFICULTY_CLASSES: Record<PromptDraft['difficulty_level'], string> = {
  beginner: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  intermediate: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  advanced: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
};

export function PromptDifficultySection({ difficulty }: PromptDifficultySectionProps) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        <Target className="w-3 h-3" />
        Nivel de Dificultad
      </label>
      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${DIFFICULTY_CLASSES[difficulty]}`}>
        {DIFFICULTY_LABELS[difficulty]}
      </span>
    </div>
  );
}
