import { motion } from 'framer-motion';
import { Loader2, Save } from 'lucide-react';

interface AccountSettingsSaveButtonProps {
  isSaving: boolean;
  onSave: () => void;
}

export function AccountSettingsSaveButton({
  isSaving,
  onSave
}: AccountSettingsSaveButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex justify-end"
    >
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-2 bg-primary hover:opacity-90 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors shadow-sm hover:shadow-md"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Guardar cambios
          </>
        )}
      </button>
    </motion.div>
  );
}
