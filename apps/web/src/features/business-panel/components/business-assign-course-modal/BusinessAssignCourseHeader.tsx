import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Users, X } from 'lucide-react';
import type { TFunction } from 'i18next';
import type { BusinessAssignCourseModalState, BusinessAssignCourseTheme } from './view-types';

interface BusinessAssignCourseHeaderProps {
  courseTitle: string;
  modal: BusinessAssignCourseModalState;
  t: TFunction<'business'>;
  theme: BusinessAssignCourseTheme;
}

export function BusinessAssignCourseHeader({ courseTitle, modal, t, theme }: BusinessAssignCourseHeaderProps) {
  return (
    <div className="relative shrink-0 pt-8 pb-6 px-6 lg:px-12 border-b" style={{ borderColor: theme.borderColor }}>
      <div className="flex flex-col sm:flex-row items-center gap-8">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl border-4" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`, borderColor: theme.borderColor }}>
            <BookOpen className="w-8 h-8" style={{ color: theme.onPrimaryColor }} strokeWidth={2.5} />
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: theme.accentColor }}>
              <Sparkles className="w-4 h-4" style={{ color: theme.onPrimaryColor }} />
            </motion.div>
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-2xl font-black tracking-tight mb-1" style={{ color: theme.textColor }}>
            {t('assignCourse.title', 'Asignar Curso')}
          </h2>
          <div className="px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.mutedTextColor }}>
            <Users className="w-3.5 h-3.5" />
            <span>{courseTitle}</span>
          </div>
        </div>
        <button
          onClick={modal.handleClose}
          className="p-3 rounded-2xl border transition-all"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.mutedTextColor }}
          onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = theme.hoverBg; }}
          onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = theme.inputBg; }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
