import { Palette } from 'lucide-react';
import type { NanoBananaSchema } from '../../../../lib/nanobana/templates';

interface NanoBananaStatsGridProps {
  schema: NanoBananaSchema;
}

export function NanoBananaStatsGrid({ schema }: NanoBananaStatsGridProps) {
  const entityCount = schema.entities?.length || 0;
  const variationCount = schema.variations?.length || 0;
  const colorScheme = schema.scene.environment.colorScheme || 'custom';

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard value={entityCount} label="Entidades" />
      <StatCard value={variationCount} label="Variaciones" />
      <div className="bg-white/5 rounded-xl p-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Palette className="w-4 h-4 text-white" />
        </div>
        <div className="text-xs text-gray-400">{colorScheme}</div>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}
