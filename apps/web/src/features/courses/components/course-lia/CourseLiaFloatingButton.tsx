'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { SHARED_TOUR_TARGET_IDS } from '../../../../core/constants/tourTargets';
import { useLiaCourse } from '../../context/LiaCourseContext';
import {
  COURSE_LIA_BUTTON_BOTTOM_PX,
  COURSE_LIA_BUTTON_RIGHT_PX,
  COURSE_LIA_BUTTON_SIZE_PX,
} from './course-lia.constants';

export function CourseLiaFloatingButton() {
  const { isOpen, toggleLia } = useLiaCourse();

  return (
    <AnimatePresence>
      {!isOpen && (
        <div
          id={SHARED_TOUR_TARGET_IDS.liaTrigger}
          data-tour="lia-button"
          className="hidden md:block"
          style={{
            position: 'fixed',
            bottom: `${COURSE_LIA_BUTTON_BOTTOM_PX}px`,
            right: `${COURSE_LIA_BUTTON_RIGHT_PX}px`,
            width: `${COURSE_LIA_BUTTON_SIZE_PX}px`,
            height: `${COURSE_LIA_BUTTON_SIZE_PX}px`,
            zIndex: 9998,
            background: 'rgba(0,0,0,0.01)',
            borderRadius: '50%',
          }}
        >
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLia}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#1E2329',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              border: '2px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              overflow: 'hidden',
            }}
            aria-label="Abrir asistente SofLIA"
          >
            <img
              src="/lia-avatar.png"
              alt="SofLIA"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
}
