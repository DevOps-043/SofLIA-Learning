import { categorias } from './constants';
import { fieldLabelClass, fontStyle } from './formStyles';
import type { Categoria } from './types';

interface CategorySelectorProps {
  categoria: Categoria;
  onChange: (categoria: Categoria) => void;
}

export function CategorySelector({ categoria, onChange }: CategorySelectorProps) {
  return (
    <div>
      <label className="mb-3 block text-sm font-medium text-[#0A2540] dark:text-white" style={fontStyle}>
        Categoria *
      </label>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {categorias.map((cat) => {
          const Icon = cat.icon;
          const isSelected = categoria === cat.value;
          return (
            <button
              key={cat.value}
              className={`rounded-xl border-2 p-3 transition-all ${isSelected ? `${cat.borderColor} ${cat.bgColor} shadow-sm` : 'border-[#E9ECEF] bg-white hover:border-[#00D4B3]/50 dark:border-[#6C757D]/30 dark:bg-[#1E2329] dark:hover:border-[#00D4B3]/50'}`}
              onClick={() => onChange(cat.value)}
              type="button"
            >
              <Icon className={`mx-auto mb-1.5 h-5 w-5 ${cat.color}`} />
              <span className={`text-xs font-medium ${isSelected ? 'text-[#0A2540] dark:text-white' : 'text-[#0A2540] dark:text-white/80'}`} style={fontStyle}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { fieldLabelClass };
