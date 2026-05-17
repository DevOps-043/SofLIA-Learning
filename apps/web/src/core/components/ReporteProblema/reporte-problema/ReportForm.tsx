import { CategorySelector } from './CategorySelector';
import { FormActions } from './FormActions';
import { PrioritySelect } from './PrioritySelect';
import { ReportTextFields } from './ReportTextFields';
import { ScreenshotField } from './ScreenshotField';
import { fontStyle } from './formStyles';
import type { ProblemReportFormController } from './useProblemReportForm';

export function ReportForm({ form, onClose }: { form: ProblemReportFormController; onClose: () => void }) {
  return (
    <form className="space-y-6" onSubmit={form.handleSubmit}>
      <CategorySelector categoria={form.categoria} onChange={form.setCategoria} />
      <PrioritySelect onChange={form.setPrioridad} value={form.prioridad} />
      <ReportTextFields form={form} />
      <ScreenshotField form={form} />
      {form.error && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400" style={fontStyle}>
          {form.error}
        </div>
      )}
      <FormActions form={form} onClose={onClose} />
    </form>
  );
}
