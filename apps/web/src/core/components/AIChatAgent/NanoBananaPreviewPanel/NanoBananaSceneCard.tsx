import type { NanoBananaSchema } from '../../../../lib/nanobana/templates';

interface NanoBananaSceneCardProps {
  scene: NanoBananaSchema['scene'];
}

export function NanoBananaSceneCard({ scene }: NanoBananaSceneCardProps) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <h4 className="text-sm font-medium text-white mb-2">Escena</h4>
      <p className="text-sm text-gray-300">{scene.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <SceneTag value={scene.environment.lighting} />
        <SceneTag value={scene.environment.mood} />
      </div>
    </div>
  );
}

function SceneTag({ value }: { value: string }) {
  return (
    <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
      {value}
    </span>
  );
}
