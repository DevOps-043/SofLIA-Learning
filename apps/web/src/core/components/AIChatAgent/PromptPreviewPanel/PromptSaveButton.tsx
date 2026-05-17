import { motion } from 'framer-motion';
import { Save, Sparkles } from 'lucide-react';

interface PromptSaveButtonProps {
  completeness: number;
  isSaving: boolean;
  onSave: () => void;
}

export function PromptSaveButton({
  completeness,
  isSaving,
  onSave
}: PromptSaveButtonProps) {
  const isDisabled = isSaving || completeness < 50;

  return (
    <button
      onClick={onSave}
      disabled={isDisabled}
      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
        isDisabled
          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg'
      }`}
    >
      {isSaving ? <SavingLabel /> : <ReadyLabel />}
    </button>
  );
}

function SavingLabel() {
  return (
    <>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Sparkles className="w-4 h-4" />
      </motion.div>
      Guardando...
    </>
  );
}

function ReadyLabel() {
  return (
    <>
      <Save className="w-4 h-4" />
      Guardar en Biblioteca
    </>
  );
}
