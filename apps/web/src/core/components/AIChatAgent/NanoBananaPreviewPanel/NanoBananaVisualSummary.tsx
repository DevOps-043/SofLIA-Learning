import type { NanoBananaSchema } from '../../../../lib/nanobana/templates';
import { NanoBananaAccessibilityCard } from './NanoBananaAccessibilityCard';
import { NanoBananaEntitiesList } from './NanoBananaEntitiesList';
import { NanoBananaSceneCard } from './NanoBananaSceneCard';
import { NanoBananaStatsGrid } from './NanoBananaStatsGrid';

interface NanoBananaVisualSummaryProps {
  schema: NanoBananaSchema;
}

export function NanoBananaVisualSummary({ schema }: NanoBananaVisualSummaryProps) {
  return (
    <div className="p-4 space-y-4">
      <NanoBananaStatsGrid schema={schema} />
      <NanoBananaSceneCard scene={schema.scene} />
      <NanoBananaEntitiesList entities={schema.entities} />
      {schema.constraints.accessibility && (
        <NanoBananaAccessibilityCard accessibility={schema.constraints.accessibility} />
      )}
    </div>
  );
}
