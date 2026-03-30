import type { Components } from "react-markdown";

type MarkdownComponentOptions = {
  includeCode?: boolean;
};

export function createLessonMarkdownComponents(
  options: MarkdownComponentOptions = {}
): Components {
  const baseComponents: Components = {
    h1: (props) => (
      <h1
        className="text-2xl font-bold text-gray-900 dark:text-white mb-6 mt-8 flex items-center gap-2 not-prose"
        {...props}
      />
    ),
    h2: (props) => (
      <h2
        className="text-xl font-bold text-gray-900 dark:text-white mb-4 mt-8 pb-2 border-b border-gray-200 dark:border-white/5 not-prose"
        {...props}
      />
    ),
    h3: (props) => (
      <h3
        className="text-lg font-semibold text-[#00D4B3] mb-3 mt-6 not-prose"
        {...props}
      />
    ),
    strong: (props) => (
      <strong className="font-bold text-gray-900 dark:text-white" {...props} />
    ),
    p: (props) => (
      <p
        className="mb-4 text-gray-700 dark:text-white/80 leading-relaxed font-light tracking-wide text-base"
        {...props}
      />
    ),
    ul: (props) => (
      <ul
        className="list-disc pl-5 space-y-2 mb-6 marker:text-[#00D4B3]"
        {...props}
      />
    ),
    ol: (props) => (
      <ol
        className="list-decimal pl-5 space-y-2 mb-6 marker:text-[#00D4B3] marker:font-bold text-gray-700 dark:text-white/80"
        {...props}
      />
    ),
    li: (props) => <li className="pl-1 leading-relaxed" {...props} />,
    blockquote: (props) => (
      <blockquote
        className="border-l-4 border-[#00D4B3] pl-4 italic text-gray-600 dark:text-white/60 my-6 bg-gray-50 dark:bg-white/5 py-2 pr-4 rounded-r-lg not-prose"
        {...props}
      />
    ),
  };

  if (!options.includeCode) {
    return baseComponents;
  }

  return {
    ...baseComponents,
    code: (props) => (
      <code
        className="bg-gray-100 dark:bg-black/30 px-1.5 py-0.5 rounded text-sm font-mono text-teal-600 dark:text-[#00D4B3]"
        {...props}
      />
    ),
  };
}
