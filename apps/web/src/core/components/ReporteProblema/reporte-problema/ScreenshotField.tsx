import { Upload, X } from 'lucide-react';
import { fieldLabelClass, fontStyle } from './formStyles';
import type { ProblemReportFormController } from './useProblemReportForm';

export function ScreenshotField({ form }: { form: ProblemReportFormController }) {
  return (
    <div>
      <label className={fieldLabelClass} style={fontStyle}>Captura de pantalla (opcional)</label>
      {form.screenshotPreview ? <ScreenshotPreview form={form} /> : <ScreenshotUpload form={form} />}
    </div>
  );
}

function ScreenshotPreview({ form }: { form: ProblemReportFormController }) {
  return (
    <div className="relative">
      <img
        alt="Screenshot preview"
        className="max-h-64 w-full rounded-xl border border-[#E9ECEF] object-contain dark:border-[#6C757D]/30"
        src={form.screenshotPreview || undefined}
      />
      <button
        className="absolute right-2 top-2 rounded-xl bg-red-500 p-2 text-white shadow-lg transition-colors hover:bg-red-600"
        onClick={form.handleRemoveScreenshot}
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function ScreenshotUpload({ form }: { form: ProblemReportFormController }) {
  return (
    <div>
      <input
        ref={form.fileInputRef}
        accept="image/*"
        className="hidden"
        id="screenshot-upload"
        onChange={form.handleFileSelect}
        type="file"
      />
      <label
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E9ECEF] bg-white px-4 py-3 text-[#6C757D] transition-colors hover:border-[#00D4B3] hover:text-[#00D4B3] dark:border-[#6C757D]/30 dark:bg-[#1E2329] dark:text-[#6C757D] dark:hover:border-[#00D4B3] dark:hover:text-[#00D4B3]"
        htmlFor="screenshot-upload"
        style={fontStyle}
      >
        <Upload className="h-5 w-5" />
        Subir Imagen
      </label>
      <p className="mt-2 text-center text-xs text-[#6C757D] dark:text-[#6C757D]" style={fontStyle}>
        Maximo 10MB. Formatos: JPG, PNG, GIF
      </p>
    </div>
  );
}
