'use client';

import { AlertCircle } from 'lucide-react';
import { useBusinessThemeCustomizerLogic } from '../hooks/useBusinessThemeCustomizerLogic';
import {
  BusinessThemeCustomizerActions,
  BusinessThemeCustomizerControls,
  BusinessThemeCustomizerHeader,
  BusinessThemeCustomizerPreview,
  BusinessThemeCustomizerThemes,
} from './business-theme-customizer';

export function BusinessThemeCustomizer() {
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
  } = useBusinessThemeCustomizerLogic();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-16 h-16 border-4 rounded-full animate-spin"
          style={{
            borderColor: 'var(--org-primary-button-color, #3b82f6)33',
            borderTopColor: 'var(--org-primary-button-color, #3b82f6)',
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-400">{error}</p>
      </div>
    );
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
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
  );
}
