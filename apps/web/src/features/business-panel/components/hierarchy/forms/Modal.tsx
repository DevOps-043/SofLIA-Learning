import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  children: ReactNode;
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
  size?: 'md' | 'lg' | 'xl';
  title: string;
}

export function Modal({ children, isLoading, isOpen, onClose, size = 'lg', title }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    lg: 'max-w-2xl',
    md: 'max-w-md',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`bg-white dark:bg-neutral-800 rounded-lg p-6 w-full ${sizeClasses[size]} shadow-xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
