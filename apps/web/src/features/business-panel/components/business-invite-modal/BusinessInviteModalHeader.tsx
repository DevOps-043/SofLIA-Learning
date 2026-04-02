'use client';

import { motion } from 'framer-motion';
import { Link2, Mail, Users, X } from 'lucide-react';
import type { BusinessInviteTabConfig, TabType } from '../../services/business-invite-modal.service';

const TAB_ICONS = {
  Mail,
  Link2,
  Users,
};

interface BusinessInviteModalHeaderProps {
  activeTab: TabType;
  tabs: BusinessInviteTabConfig[];
  onClose: () => void;
  onTabChange: (tab: TabType) => void;
  primaryColor: string;
  accentColor: string;
  borderColor: string;
  inputBg: string;
  mutedText: string;
  textColor: string;
  isDark: boolean;
}

export function BusinessInviteModalHeader({
  activeTab,
  tabs,
  onClose,
  onTabChange,
  primaryColor,
  accentColor,
  borderColor,
  inputBg,
  mutedText,
  textColor,
  isDark,
}: BusinessInviteModalHeaderProps) {
  return (
    <div
      className="p-6 border-b shrink-0"
      style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}10)`, borderColor }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="p-2 rounded-xl"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <Users className="w-6 h-6" style={{ color: accentColor }} />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: textColor }}>
              Invitar Usuarios
            </h3>
            <p className="text-sm" style={{ color: mutedText }}>
              Invita usuarios individualmente o genera enlaces masivos
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <X className="w-5 h-5" style={{ color: mutedText }} />
        </button>
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: inputBg }}>
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.icon];
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative"
              style={{
                backgroundColor: isActive ? (isDark ? primaryColor : '#FFFFFF') : 'transparent',
                color: isActive ? (isDark ? '#FFFFFF' : primaryColor) : mutedText,
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                  style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
