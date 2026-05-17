import { prioridades } from './constants';
import { fieldClass, fieldLabelClass, fontStyle } from './formStyles';
import type { Prioridad } from './types';

export function PrioritySelect({ onChange, value }: { onChange: (value: Prioridad) => void; value: Prioridad }) {
  return (
    <div>
      <label className={fieldLabelClass} style={fontStyle}>Prioridad</label>
      <select
        className={fieldClass}
        onChange={(event) => onChange(event.target.value as Prioridad)}
        style={fontStyle}
        value={value}
      >
        {prioridades.map((priority) => (
          <option key={priority.value} value={priority.value}>{priority.label}</option>
        ))}
      </select>
    </div>
  );
}
