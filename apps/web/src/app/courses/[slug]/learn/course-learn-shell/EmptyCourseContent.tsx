'use client'

import { BookOpen } from 'lucide-react'

export function EmptyCourseContent() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[#0A2540]/30 bg-gradient-to-br from-[#0A2540]/20 to-[#00D4B3]/20"><BookOpen className="h-10 w-10 text-[#00D4B3]" /></div>
        <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Este curso aun no tiene contenido</h3>
        <p className="text-[#6C757D] dark:text-white/60" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Los modulos y lecciones se agregaran pronto</p>
      </div>
    </div>
  )
}
