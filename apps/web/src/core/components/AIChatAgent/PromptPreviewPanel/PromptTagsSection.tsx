import { Tag } from 'lucide-react';

interface PromptTagsSectionProps {
  tags: string[];
}

export function PromptTagsSection({ tags }: PromptTagsSectionProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        <Tag className="w-3 h-3" />
        Etiquetas
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
