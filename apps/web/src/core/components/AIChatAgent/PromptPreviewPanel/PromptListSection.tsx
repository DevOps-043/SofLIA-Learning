import { Lightbulb } from 'lucide-react';

interface PromptListSectionProps {
  title: string;
  items: string[];
  icon?: 'tips';
}

export function PromptListSection({ title, items, icon }: PromptListSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {icon === 'tips' && <Lightbulb className="w-3 h-3" />}
        {title}
      </label>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li
            key={item}
            className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2"
          >
            <span className={icon === 'tips' ? 'text-yellow-500 mt-0.5' : 'text-purple-500 mt-0.5'}>
              -
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
