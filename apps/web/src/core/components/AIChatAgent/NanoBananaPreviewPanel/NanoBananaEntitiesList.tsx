import type { NanoBananaSchema } from '../../../../lib/nanobana/templates';

interface NanoBananaEntitiesListProps {
  entities: NanoBananaSchema['entities'];
}

export function NanoBananaEntitiesList({ entities }: NanoBananaEntitiesListProps) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <h4 className="text-sm font-medium text-white mb-3">
        Entidades ({entities.length})
      </h4>
      <div className="space-y-2 max-h-[150px] overflow-y-auto">
        {entities.map((entity) => (
          <div
            key={entity.id}
            className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
          >
            <span className="text-xs font-mono text-cyan-400">{entity.id}</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs ${getEmphasisClass(entity.emphasis)}`}>
                {entity.emphasis}
              </span>
              <span className="text-xs text-gray-500">{entity.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getEmphasisClass(emphasis: string) {
  const emphasisClasses: Record<string, string> = {
    primary: 'bg-blue-500/20 text-blue-300',
    secondary: 'bg-gray-500/20 text-gray-300',
    accent: 'bg-amber-500/20 text-amber-300',
    background: 'bg-gray-700/20 text-gray-400'
  };

  return emphasisClasses[emphasis] || 'bg-gray-700/20 text-gray-400';
}
