import { BookOpen } from 'lucide-react';

export function EmptyCourseContentState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0A2540]/20 to-[#00D4B3]/20 flex items-center justify-center mx-auto mb-4 border border-[#0A2540]/30">
          <BookOpen className="w-10 h-10 text-[#00D4B3]" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Este curso aun no tiene contenido
        </h3>
        <p
          className="text-[#6C757D] dark:text-white/60"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
        >
          Los modulos y lecciones se agregaran pronto
        </p>
      </div>
    </div>
  );
}
