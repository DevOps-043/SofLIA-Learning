'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map } from 'lucide-react';
import { useLiaPanel } from '../../contexts/LiaPanelContext';
import { useTourRestart } from '../../contexts/TourRestartContext';

// ─── Tour restart button ──────────────────────────────────────────────────────
function TourRestartButton() {
  const { restartFn, tourLabel } = useTourRestart();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <AnimatePresence>
      {restartFn && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          style={{
            position: 'fixed',
            bottom: '92px', // 24px base + 56px botón LIA + 12px gap
            right: '32px',  // centrado sobre el botón LIA (56px ancho, right 24px → centro en 52px, botón 40px → right 32px)
            zIndex: 9997,
          }}
        >
          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  right: '52px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: '#1E2329',
                  color: '#fff',
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
                {tourLabel ?? 'Reiniciar tour'}
                {/* Flecha */}
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
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.93 }}
            onClick={restartFn}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label={tourLabel ?? 'Reiniciar tour'}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.45)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Map size={18} strokeWidth={2} />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── LIA floating button ──────────────────────────────────────────────────────
function LiaFloatingButtonContent() {
  const { isOpen, togglePanel } = useLiaPanel();

  return (
    <>
      <TourRestartButton />

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            id="tour-lia-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePanel}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00D4B3 0%, #00a893 100%)',
              boxShadow: '0 4px 20px rgba(0, 212, 179, 0.4)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9998,
            }}
            aria-label="Abrir asistente LIA"
          >
            {/* Pulse effect */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                backgroundColor: '#00D4B3',
                zIndex: 0,
              }}
              animate={{
                scale: [1, 1.4, 1.4],
                opacity: [0.4, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />

            <img
              src="/lia-avatar.png"
              alt="LIA"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                position: 'relative',
                zIndex: 1,
              }}
            />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

export function LiaFloatingButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(<LiaFloatingButtonContent />, document.body);
}
