'use client'

import { AlertCircle } from 'lucide-react'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { useBusinessThemeCustomizerLogic } from '../hooks/useBusinessThemeCustomizerLogic'
import {
  BusinessThemeCustomizerActions,
  BusinessThemeCustomizerControls,
  BusinessThemeCustomizerHeader,
  BusinessThemeCustomizerPreview,
  BusinessThemeCustomizerThemes,
} from './business-theme-customizer'

export function BusinessThemeCustomizer() {
  const theme = useBusinessPanelTheme()
  const {
    styles,
    loading,
    error,
    activePanel,
    currentStyles,
    saveSuccess,
    saveError,
    isSaving,
    allThemes,
    gradientColors,
    gradientAngle,
    setGradientAngle,
    copiedGradient,
    generateGradientCSS,
    addGradientColor,
    removeGradientColor,
    updateGradientColor,
    copyGradientToClipboard,
    getThemeIcon,
    getThemeColor,
    isThemeSelected,
    updateStyle,
    handleApplyTheme,
    handleSave,
    handleDiscard,
    handleReset,
  } = useBusinessThemeCustomizerLogic()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="h-16 w-16 animate-spin rounded-full border-4"
          style={{
            borderColor: `${theme.actionColor}33`,
            borderTopColor: theme.actionColor,
          }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="rounded-lg border p-6 text-center"
        style={{
          backgroundColor: `${theme.dangerColor}12`,
          borderColor: `${theme.dangerColor}33`,
        }}
      >
        <AlertCircle className="mx-auto mb-2 h-8 w-8" style={{ color: theme.dangerColor }} />
        <p style={{ color: theme.dangerColor }}>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BusinessThemeCustomizerHeader />
      <BusinessThemeCustomizerThemes
        allThemes={allThemes}
        isSaving={isSaving}
        selectedThemeId={styles?.selectedTheme}
        getThemeIcon={getThemeIcon}
        getThemeColor={getThemeColor}
        isThemeSelected={isThemeSelected}
        onApplyTheme={handleApplyTheme}
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <BusinessThemeCustomizerControls
          activePanel={activePanel}
          currentStyles={currentStyles}
          gradientColors={gradientColors}
          gradientAngle={gradientAngle}
          copiedGradient={copiedGradient}
          setGradientAngle={setGradientAngle}
          generateGradientCSS={generateGradientCSS}
          addGradientColor={addGradientColor}
          removeGradientColor={removeGradientColor}
          updateGradientColor={updateGradientColor}
          copyGradientToClipboard={copyGradientToClipboard}
          updateStyle={updateStyle}
        />
        <BusinessThemeCustomizerPreview currentStyles={currentStyles} />
      </div>
      <BusinessThemeCustomizerActions
        saveSuccess={saveSuccess}
        saveError={saveError}
        isSaving={isSaving}
        onDiscard={handleDiscard}
        onReset={handleReset}
        onSave={handleSave}
      />
    </div>
  )
}
