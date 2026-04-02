'use client'

import { AnimatePresence } from 'framer-motion'
import { useProfilePageLogic } from '../../hooks/useProfilePageLogic'
import { ProfileHero } from './ProfileHero'
import { ProfilePageHeader } from './ProfilePageHeader'
import { ProfilePersonalTab } from './ProfilePersonalTab'
import { ProfileSecurityTab } from './ProfileSecurityTab'
import { ProfileTabs } from './ProfileTabs'

type ProfilePageLogic = ReturnType<typeof useProfilePageLogic>

export function ProfilePageContent(logic: ProfilePageLogic) {
  const {
    colors,
    profile,
    stats,
    activeTab,
    setActiveTab,
    formData,
    showSaveSuccess,
    imageError,
    setImageError,
    passwordErrors,
    currentPassword,
    newPassword,
    confirmPassword,
    showCurrentPassword,
    showNewPassword,
    showConfirmPassword,
    setShowCurrentPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    passwordChangeError,
    passwordChangeSuccess,
    isChangingPassword,
    saving,
    setPasswordValue,
    handleInputChange,
    handleSave,
    handleProfilePictureUpload,
    handleChangePassword,
    goBack,
    formatDate
  } = logic

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: colors.bgPrimary }}>
      <ProfilePageHeader colors={colors} saving={saving} showSaveSuccess={showSaveSuccess} goBack={goBack} handleSave={handleSave} />

      <main className="pt-16 min-h-screen">
        <ProfileHero
          profile={profile}
          stats={stats}
          colors={colors}
          imageError={imageError}
          setImageError={setImageError}
          handleProfilePictureUpload={handleProfilePictureUpload}
          formatDate={formatDate}
        />

        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} colors={colors} />

        <div className="px-6 lg:px-12 py-10">
          <AnimatePresence mode="wait">
            {activeTab === 'personal' ? (
              <ProfilePersonalTab formData={formData} handleInputChange={handleInputChange} colors={colors} />
            ) : (
              <ProfileSecurityTab
                formData={formData}
                handleInputChange={handleInputChange}
                colors={colors}
                passwordChangeSuccess={passwordChangeSuccess}
                passwordChangeError={passwordChangeError}
                currentPassword={currentPassword}
                newPassword={newPassword}
                confirmPassword={confirmPassword}
                showCurrentPassword={showCurrentPassword}
                showNewPassword={showNewPassword}
                showConfirmPassword={showConfirmPassword}
                setShowCurrentPassword={setShowCurrentPassword}
                setShowNewPassword={setShowNewPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                setPasswordValue={setPasswordValue}
                passwordErrors={passwordErrors}
                isChangingPassword={isChangingPassword}
                handleChangePassword={handleChangePassword}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
