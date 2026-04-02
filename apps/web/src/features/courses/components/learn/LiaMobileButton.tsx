"use client";

import { useLiaCourse } from "../../context/LiaCourseContext";

export function LiaMobileButton() {
  const { isOpen, toggleLia } = useLiaCourse();

  return (
    <button
      onClick={toggleLia}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative ${
        isOpen
          ? "bg-[#00D4B3]/20 text-[#00D4B3]"
          : "text-[#6C757D] dark:text-white/60 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30"
      }`}
    >
      <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-current">
        <img src="/lia-avatar.png" alt="SofLIA" className="w-full h-full object-cover" />
      </div>
      <span className="text-xs font-medium">SofLIA</span>
      <div className="absolute top-1 right-2 w-2 h-2 bg-[#22c55e] rounded-full border border-white dark:border-[#1E2329]" />
    </button>
  );
}
