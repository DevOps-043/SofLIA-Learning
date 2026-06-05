'use client'

import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LiaQuickAction, LiaThemeColors } from './types'

interface LiaQuickActionsChipsProps {
  quickActions: LiaQuickAction[]
  isLoading: boolean
  isLightTheme: boolean
  themeColors: LiaThemeColors
  onActionClick: (action: LiaQuickAction) => void
  forceCollapse?: boolean | number
}

const SKELETON_PLACEHOLDERS = 3
const ANIMATION_DURATION = 0.18

export function LiaQuickActionsChips(props: LiaQuickActionsChipsProps) {
  const { quickActions, isLoading, isLightTheme, themeColors, onActionClick, forceCollapse } = props
  const { t } = useTranslation('common')

  const [isExpanded, setIsExpanded] = useState(!forceCollapse)

  React.useEffect(() => {
    if (forceCollapse) {
      setIsExpanded(false)
    }
  }, [forceCollapse])

  if (!isLoading && quickActions.length === 0) {
    return null
  }

  const skeletonBg = isLightTheme
    ? 'rgba(15, 23, 42, 0.06)'
    : 'rgba(255, 255, 255, 0.06)'
  const chipHoverBg = isLightTheme
    ? 'rgba(0, 212, 179, 0.08)'
    : 'rgba(0, 212, 179, 0.12)'

  return (
    <div
      role="region"
      aria-label={t('lia.lessonSuggestions.title', 'Sugerencias')}
      style={{
        padding: '0 clamp(14px, 4vw, 20px) 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flexShrink: 0,
        maxHeight: 'clamp(96px, 28dvh, 168px)',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          color: themeColors.textSecondary,
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles
            aria-hidden="true"
            style={{ width: '12px', height: '12px', color: themeColors.accentColor }}
          />
          <span>
            {isLoading
              ? t('lia.lessonSuggestions.loading', 'Cargando sugerencias...')
              : t('lia.lessonSuggestions.title', 'Sugerencias')}
          </span>
        </div>
        
        {!isLoading && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '2px 4px',
              cursor: 'pointer',
              color: themeColors.accentColor,
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '4px',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {isExpanded ? t('actions.hide', 'Ocultar') : t('actions.show', 'Mostrar')}
            <motion.span
              animate={{ rotate: isExpanded ? 0 : 180 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'inline-block' }}
            >
              ▼
            </motion.span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
            animate={{ height: 'auto', opacity: 1, overflow: 'visible' }}
            exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                paddingTop: '4px',
              }}
            >
              {isLoading
                ? Array.from({ length: SKELETON_PLACEHOLDERS }).map((_, index) => (
                    <div
                      key={`skeleton-${String(index)}`}
                      aria-hidden="true"
                      style={{
                        height: '34px',
                        width: '40%',
                        minWidth: '120px',
                        borderRadius: '999px',
                        backgroundColor: skeletonBg,
                        border: `1px solid ${themeColors.borderColor}`,
                      }}
                    />
                  ))
                : (
                    <AnimatePresence initial={false}>
                      {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <motion.button
                            key={action.id}
                            type="button"
                            onClick={() => onActionClick(action)}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            transition={{ duration: ANIMATION_DURATION }}
                            aria-label={action.label}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 14px',
                              borderRadius: '999px',
                              border: `1px solid ${themeColors.borderColor}`,
                              backgroundColor: themeColors.inputBg,
                              color: themeColors.textPrimary,
                              fontSize: '12px',
                              fontWeight: 500,
                              lineHeight: 1.3,
                              cursor: 'pointer',
                              maxWidth: '100%',
                              minHeight: '36px',
                              textAlign: 'left',
                              whiteSpace: 'normal',
                              overflowWrap: 'break-word',
                              transition: 'background-color 160ms ease, border-color 160ms ease',
                            }}
                            onMouseEnter={(event) => {
                              event.currentTarget.style.backgroundColor = chipHoverBg
                              event.currentTarget.style.borderColor = themeColors.accentColor
                            }}
                            onMouseLeave={(event) => {
                              event.currentTarget.style.backgroundColor = themeColors.inputBg
                              event.currentTarget.style.borderColor = themeColors.borderColor
                            }}
                            onFocus={(event) => {
                              event.currentTarget.style.borderColor = themeColors.accentColor
                            }}
                            onBlur={(event) => {
                              event.currentTarget.style.borderColor = themeColors.borderColor
                            }}
                          >
                            <Icon style={{ width: '14px', height: '14px' }} color={themeColors.accentColor} />
                            {action.label}
                          </motion.button>
                        )
                      })}
                    </AnimatePresence>
                  )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
