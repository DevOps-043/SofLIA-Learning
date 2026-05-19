import { Loader2, Send } from 'lucide-react';
import { fontStyle } from './formStyles';
import type { ProblemReportFormController } from './useProblemReportForm';

export function FormActions({ form, onClose }: { form: ProblemReportFormController; onClose: () => void }) {
  return (
    <div className="flex gap-3 pt-4">
      <button
        className="flex-1 rounded-xl border border-gray-200 bg-white px-6 py-3 font-medium text-primary transition-colors hover:bg-gray-200 disabled:opacity-50 dark:border-gray-500/30 dark:bg-carbon-800 dark:text-white dark:hover:bg-carbon-900"
        disabled={form.isSubmitting}
        onClick={onClose}
        style={fontStyle}
        type="button"
      >
        Cancelar
      </button>
      <button
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary dark:hover:bg-primary"
        disabled={form.isSubmitting || !form.titulo.trim() || !form.descripcion.trim()}
        style={fontStyle}
        type="submit"
      >
        {form.isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Enviar Reporte
          </>
        )}
      </button>
    </div>
  );
}
