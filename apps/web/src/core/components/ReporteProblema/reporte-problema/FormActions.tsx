import { Loader2, Send } from 'lucide-react';
import { fontStyle } from './formStyles';
import type { ProblemReportFormController } from './useProblemReportForm';

export function FormActions({ form, onClose }: { form: ProblemReportFormController; onClose: () => void }) {
  return (
    <div className="flex gap-3 pt-4">
      <button
        className="flex-1 rounded-xl border border-[#E9ECEF] bg-white px-6 py-3 font-medium text-[#0A2540] transition-colors hover:bg-[#E9ECEF] disabled:opacity-50 dark:border-[#6C757D]/30 dark:bg-[#1E2329] dark:text-white dark:hover:bg-[#0F1419]"
        disabled={form.isSubmitting}
        onClick={onClose}
        style={fontStyle}
        type="button"
      >
        Cancelar
      </button>
      <button
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-6 py-3 font-semibold text-white transition-all hover:bg-[#0d2f4d] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0A2540] dark:hover:bg-[#0d2f4d]"
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
