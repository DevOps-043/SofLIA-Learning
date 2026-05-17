import { CheckCircle } from 'lucide-react';
import { fontStyle } from './formStyles';

export function SuccessScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#10B981]/20">
        <CheckCircle className="h-10 w-10 text-[#10B981]" />
      </div>
      <h3 className="mb-3 text-2xl font-bold text-[#0A2540] dark:text-white" style={fontStyle}>
        Reporte Enviado con Exito
      </h3>
      <p className="mb-6 text-[#6C757D] dark:text-[#6C757D]" style={fontStyle}>
        Gracias por ayudarnos a mejorar. Revisaremos tu reporte pronto.
      </p>
      <button
        className="rounded-xl bg-[#0A2540] px-8 py-3 font-semibold text-white transition-all hover:bg-[#0d2f4d] hover:shadow-lg dark:bg-[#0A2540] dark:hover:bg-[#0d2f4d]"
        onClick={onClose}
        style={fontStyle}
        type="button"
      >
        Cerrar
      </button>
    </div>
  );
}
