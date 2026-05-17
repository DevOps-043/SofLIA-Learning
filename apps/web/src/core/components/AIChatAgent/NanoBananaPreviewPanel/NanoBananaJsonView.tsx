import type { NanoBananaSchema } from '../../../../lib/nanobana/templates';
import { JsonSection } from './JsonSection';

interface NanoBananaJsonViewProps {
  schema: NanoBananaSchema;
}

export function NanoBananaJsonView({ schema }: NanoBananaJsonViewProps) {
  const hasVariations = (schema.variations?.length || 0) > 0;

  return (
    <div className="p-2">
      <JsonSection title="meta" data={schema.meta} defaultExpanded />
      <JsonSection title="scene" data={schema.scene} defaultExpanded />
      <JsonSection title="entities" data={schema.entities} />
      <JsonSection title="constraints" data={schema.constraints} />
      {hasVariations && <JsonSection title="variations" data={schema.variations} />}
    </div>
  );
}
