'use client'

import { motion } from 'framer-motion'
import { BookOpen, Briefcase, Calendar, Camera, Check, GraduationCap, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ProfileColorPalette, UserProfile, UserStats } from '../../types/profile.types'

interface ProfileHeroProps {
  profile: UserProfile
  stats: UserStats | null
  colors: ProfileColorPalette
  imageError: boolean
  setImageError: (value: boolean) => void
  handleProfilePictureUpload: (file: File) => Promise<void>
  formatDate: (dateString: string) => string
}

export function ProfileHero({
  profile,
  stats,
  colors,
  imageError,
  setImageError,
  handleProfilePictureUpload,
  formatDate
}: ProfileHeroProps) {
  const { t } = useTranslation('common')
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${colors.accent} 6.3%, transparent) 0%, transparent 100%)` }} />
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px]" style={{ backgroundColor: `color-mix(in srgb, ${colors.accent} 12.5%, transparent)` }} />
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-[120px]" style={{ backgroundColor: `color-mix(in srgb, ${colors.primary} 12.5%, transparent)` }} />

      <div className="relative px-6 lg:px-12 py-12">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative group">
            <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-3xl p-1" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${colors.accent} 18.8%, transparent), color-mix(in srgb, ${colors.primary} 18.8%, transparent))` }}>
              <div className="w-full h-full rounded-[22px] overflow-hidden flex items-center justify-center relative" style={{ backgroundColor: colors.bgSecondary }}>
                {profile.profile_picture_url && !imageError ? (
                  <img
                    src={profile.profile_picture_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <User className="w-16 h-16" style={{ color: colors.textSecondary }} />
                )}
              </div>
            </div>

            <input
              type="file"
              id="avatar-upload"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              onChange={event => {
                const file = event.target.files?.[0]
                if (!file) {
                  return
                }

                void handleProfilePictureUpload(file)
              }}
            />
            <motion.label
              htmlFor="avatar-upload"
              className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 z-10"
              style={{ backgroundColor: colors.accent, boxShadow: `0 10px 30px color-mix(in srgb, ${colors.accent} 25.1%, transparent)` }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Camera className="w-5 h-5" style={{ color: colors.primary }} />
            </motion.label>
          </motion.div>

          <div className="flex-1">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2" style={{ color: colors.text }}>{profile.display_name}</h1>
              <p className="text-lg flex items-center gap-2" style={{ color: colors.textSecondary }}>
                <Briefcase className="w-4 h-4" />
                {profile.job_title || t('profile.hero.noRole')}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm" style={{ color: colors.textSecondary }}>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {t('profile.hero.memberSince')} {formatDate(profile.created_at)}
                </span>
                <span className="flex items-center gap-1.5" style={{ color: colors.success }}>
                  <Check className="w-3.5 h-3.5" />
                  {t('profile.hero.emailVerified')}
                </span>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-3 lg:gap-4">
            {[
              { icon: <BookOpen className="w-5 h-5" />, value: stats?.completedLessons ?? 0, label: t('profile.hero.stats.lessons'), color: colors.accent },
              { icon: <GraduationCap className="w-5 h-5" />, value: stats?.certificates ?? 0, label: t('profile.hero.stats.certificates'), color: colors.primary }
            ].map(stat => (
              <motion.div key={stat.label} className="rounded-2xl p-4 lg:p-5 text-center min-w-[100px]" style={{ backgroundColor: colors.bgSecondary }} whileHover={{ scale: 1.05, y: -3 }}>
                <div className="mb-2 flex justify-center" style={{ color: stat.color }}>{stat.icon}</div>
                <div className="text-2xl font-bold" style={{ color: colors.text }}>{stat.value}</div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
