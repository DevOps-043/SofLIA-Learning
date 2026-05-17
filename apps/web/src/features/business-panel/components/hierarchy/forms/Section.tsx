import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  defaultOpen?: boolean;
  icon: ReactNode;
  title: string;
}

export function Section({ children, defaultOpen = true, icon, title }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-neutral-900 dark:text-white">{title}</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}
