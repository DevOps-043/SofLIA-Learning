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
        className="max-h-64 w-full rounded-xl border border-gray-200 object-contain dark:border-gray-500/30"
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
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-white px-4 py-3 text-gray-500 transition-colors hover:border-accent hover:text-accent dark:border-gray-500/30 dark:bg-carbon-800 dark:text-gray-500 dark:hover:border-accent dark:hover:text-accent"
        htmlFor="screenshot-upload"
        style={fontStyle}
      >
        <Upload className="h-5 w-5" />
        Subir Imagen
      </label>
      <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-500" style={fontStyle}>
        Maximo 10MB. Formatos: JPG, PNG, GIF
      </p>
    </div>
  );
}
