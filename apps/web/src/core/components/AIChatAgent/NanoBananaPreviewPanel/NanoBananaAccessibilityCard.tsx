import type { NanoBananaSchema } from '../../../../lib/nanobana/templates';

interface NanoBananaAccessibilityCardProps {
  accessibility: NonNullable<NanoBananaSchema['constraints']['accessibility']>;
}

export function NanoBananaAccessibilityCard({
  accessibility
}: NanoBananaAccessibilityCardProps) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <h4 className="text-sm font-medium text-white mb-2">Accesibilidad</h4>
      <div className="flex flex-wrap gap-2">
        {accessibility.minTouchTarget && (
          <AccessibilityBadge label={`Touch: ${accessibility.minTouchTarget}`} />
        )}
        {accessibility.contrastRatio && (
          <AccessibilityBadge label={`Contraste: ${accessibility.contrastRatio}`} />
        )}
        {accessibility.colorBlindSafe && <AccessibilityBadge label="Daltonismo" />}
      </div>
    </div>
  );
}

function AccessibilityBadge({ label }: { label: string }) {
  return (
    <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
      {label}
    </span>
  );
}
