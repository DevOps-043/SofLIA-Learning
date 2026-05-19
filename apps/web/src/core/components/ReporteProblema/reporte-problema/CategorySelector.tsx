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
      <label className="mb-3 block text-sm font-medium text-primary dark:text-white" style={fontStyle}>
        Categoria *
      </label>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {categorias.map((cat) => {
          const Icon = cat.icon;
          const isSelected = categoria === cat.value;
          return (
            <button
              key={cat.value}
              className={`rounded-xl border-2 p-3 transition-all ${isSelected ? `${cat.borderColor} ${cat.bgColor} shadow-sm` : 'border-gray-200 bg-white hover:border-accent/50 dark:border-gray-500/30 dark:bg-carbon-800 dark:hover:border-accent/50'}`}
              onClick={() => onChange(cat.value)}
              type="button"
            >
              <Icon className={`mx-auto mb-1.5 h-5 w-5 ${cat.color}`} />
              <span className={`text-xs font-medium ${isSelected ? 'text-primary dark:text-white' : 'text-primary dark:text-white/80'}`} style={fontStyle}>
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
