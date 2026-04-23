import { Play } from 'lucide-react';

export function VideoUnavailablePanel() {
  return (
    <div className="aspect-video bg-gradient-to-br from-[#0A2540]/20 to-[#00D4B3]/20 rounded-xl flex items-center justify-center border border-[#E9ECEF] dark:border-[#6C757D]/30 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A2540]/10 via-[#00D4B3]/10 to-[#00D4B3]/10 animate-pulse" />
      <div className="text-center relative z-10">
        <div className="w-20 h-20 bg-[#0A2540] rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-[#0d2f4d] transition-all transform group-hover:scale-110">
          <Play className="w-10 h-10 text-white ml-1" />
        </div>
        <p className="text-gray-700 dark:text-white/70">Video no disponible</p>
      </div>
    </div>
  );
}
