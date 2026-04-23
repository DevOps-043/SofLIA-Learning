interface PlayerLoadingOverlayProps {
  tone?: 'loading' | 'buffering';
}

export function PlayerLoadingOverlay({
  tone = 'loading',
}: PlayerLoadingOverlayProps) {
  const backgroundClass =
    tone === 'buffering' ? 'bg-[#0F1419]/50 z-20' : 'bg-[#0F1419]/80 backdrop-blur-sm z-30';

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${backgroundClass}`}>
      <div className="w-12 h-12 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full animate-spin" />
    </div>
  );
}
