import { CheckCircle } from 'lucide-react';
import { fontStyle } from './formStyles';

export function SuccessScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
        <CheckCircle className="h-10 w-10 text-success" />
      </div>
      <h3 className="mb-3 text-2xl font-bold text-primary dark:text-white" style={fontStyle}>
        Reporte Enviado con Exito
      </h3>
      <p className="mb-6 text-gray-500 dark:text-gray-500" style={fontStyle}>
        Gracias por ayudarnos a mejorar. Revisaremos tu reporte pronto.
      </p>
      <button
        className="rounded-xl bg-primary px-8 py-3 font-semibold text-white transition-all hover:bg-primary hover:shadow-lg dark:bg-primary dark:hover:bg-primary"
        onClick={onClose}
        style={fontStyle}
        type="button"
      >
        Cerrar
      </button>
    </div>
  );
}
