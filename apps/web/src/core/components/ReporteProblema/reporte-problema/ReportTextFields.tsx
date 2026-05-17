import { fieldClass, fieldLabelClass, fontStyle } from './formStyles';
import type { ProblemReportFormController } from './useProblemReportForm';

export function ReportTextFields({ form }: { form: ProblemReportFormController }) {
  return (
    <>
      <TextInput label="Titulo *" maxLength={200} onChange={form.setTitulo} placeholder="Resumen breve del problema" required value={form.titulo} />
      <TextArea label="Descripcion *" onChange={form.setDescripcion} placeholder="Describe el problema en detalle..." required rows={4} value={form.descripcion} />
      <TextArea label="Pasos para reproducir (opcional)" onChange={form.setPasosReproducir} placeholder={'1. Haz clic en...\n2. Navega a...\n3. El error ocurre cuando...'} rows={3} value={form.pasosReproducir} />
      <TextArea label="Comportamiento esperado (opcional)" onChange={form.setComportamientoEsperado} placeholder="Que esperabas que sucediera?" rows={2} value={form.comportamientoEsperado} />
    </>
  );
}

function TextInput({ label, maxLength, onChange, placeholder, required, value }: { label: string; maxLength?: number; onChange: (value: string) => void; placeholder: string; required?: boolean; value: string }) {
  return (
    <div>
      <label className={fieldLabelClass} style={fontStyle}>{label}</label>
      <input className={fieldClass} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} style={fontStyle} type="text" value={value} />
    </div>
  );
}

function TextArea({ label, onChange, placeholder, required, rows, value }: { label: string; onChange: (value: string) => void; placeholder: string; required?: boolean; rows: number; value: string }) {
  return (
    <div>
      <label className={fieldLabelClass} style={fontStyle}>{label}</label>
      <textarea className={`${fieldClass} resize-none`} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} rows={rows} style={fontStyle} value={value} />
    </div>
  );
}
