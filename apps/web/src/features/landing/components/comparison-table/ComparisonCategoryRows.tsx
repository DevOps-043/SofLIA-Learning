import type { ComparisonCategory } from '@aprende-y-aplica/shared';

import { ComparisonFeatureRow } from './ComparisonFeatureRow';

interface ComparisonCategoryRowsProps {
  categories: ComparisonCategory[];
}

export function ComparisonCategoryRows({ categories }: ComparisonCategoryRowsProps) {
  return (
    <>
      {categories.map((category, categoryIndex) => (
        <div key={category.name} className="border-b border-glass-light last:border-b-0">
          <div className="bg-carbon/50 p-4">
            <h3 className="text-lg font-semibold">{category.name}</h3>
          </div>
          {category.features.map((feature, featureIndex) => (
            <ComparisonFeatureRow
              key={`${category.name}-${feature.name}`}
              categoryIndex={categoryIndex}
              feature={feature}
              featureIndex={featureIndex}
            />
          ))}
        </div>
      ))}
    </>
  );
}
