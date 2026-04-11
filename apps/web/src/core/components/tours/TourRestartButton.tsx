'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Map } from 'lucide-react';

import { useTourRestart } from '../../contexts/TourRestartContext';

const RESTART_BUTTON_SIZE_PX = 40;
const DEFAULT_BUTTON_GAP_PX = 12;
const DEFAULT_Z_INDEX = 9997;
const TOOLTIP_OFFSET_PX = 12;

export type TourRestartButtonAnchor = {
  bottom: number;
  right: number;
  size: number;
  gap?: number;
  zIndex?: number;
};

type TourRestartButtonProps = {
  anchor: TourRestartButtonAnchor;
};

export function TourRestartButton({
  anchor,
}: TourRestartButtonProps): JSX.Element {
  const { restartFn, tourLabel } = useTourRestart();
  const [showTooltip, setShowTooltip] = useState(false);

  const buttonGap = anchor.gap ?? DEFAULT_BUTTON_GAP_PX;
  const zIndex = anchor.zIndex ?? DEFAULT_Z_INDEX;
  const buttonBottom = anchor.bottom + anchor.size + buttonGap;
  const buttonRight =
    anchor.right + (anchor.size - RESTART_BUTTON_SIZE_PX) / 2;
  const label = tourLabel ?? 'Reiniciar tour';

  return (
    <AnimatePresence>
      {restartFn ? (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          style={{
            position: 'fixed',
            bottom: `${buttonBottom}px`,
            right: `${buttonRight}px`,
            zIndex,
          }}
        >
          <AnimatePresence>
            {showTooltip ? (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  right: `${RESTART_BUTTON_SIZE_PX + TOOLTIP_OFFSET_PX}px`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: '#1E2329',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '6px 10px',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  pointerEvents: 'none',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {label}
                <span
                  style={{
                    position: 'absolute',
                    right: '-5px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 0,
                    height: 0,
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    borderLeft: '5px solid #1E2329',
                  }}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.93 }}
            onClick={restartFn}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label={label}
            style={{
              width: `${RESTART_BUTTON_SIZE_PX}px`,
              height: `${RESTART_BUTTON_SIZE_PX}px`,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.45)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <Map size={18} strokeWidth={2} />
          </motion.button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
