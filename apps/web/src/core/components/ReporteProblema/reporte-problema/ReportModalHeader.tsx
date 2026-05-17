import { X } from 'lucide-react';
import { fontStyle } from './formStyles';

interface ReportModalHeaderProps {
  isSubmitting: boolean;
  onClose: () => void;
  step: 'form' | 'success';
}

export function ReportModalHeader({ isSubmitting, onClose, step }: ReportModalHeaderProps) {
  return (
    <div className="relative bg-[#0A2540] p-6 text-white">
      <button
        className="absolute right-4 top-4 rounded-xl p-2 transition-colors hover:bg-white/10"
        disabled={isSubmitting}
        onClick={onClose}
        type="button"
      >
        <X className="h-5 w-5" />
      </button>
      <h2 className="mb-2 text-2xl font-bold" style={fontStyle}>
        {step === 'form' ? 'Reportar un Problema' : 'Reporte Enviado'}
      </h2>
      <p className="text-base text-white/80" style={fontStyle}>
        {step === 'form'
          ? 'Ayudanos a mejorar reportando problemas o sugerencias'
          : 'Gracias por tu reporte. Lo revisaremos pronto.'}
      </p>
    </div>
  );
}
