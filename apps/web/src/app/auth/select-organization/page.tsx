'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, ChevronRight, Loader2, Users, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { useOrganization } from '@/core/hooks/useOrganization';
import type { Organization } from '@/core/stores/organizationStore';

/**
 * Organization Selection Page
 *
 * Shown after login when a user belongs to multiple organizations.
 * Allows them to choose which organization context to enter.
 */
export default function SelectOrganizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organizations: userOrganizations = [], isLoading, setCurrentOrganization } = useOrganization();
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Get redirect URL from query params (where to go after selection)
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  // If user has only one org, auto-select and redirect
  useEffect(() => {
    if (!isLoading && userOrganizations.length === 1) {
      handleSelectOrganization(userOrganizations[0]);
    }
  }, [isLoading, userOrganizations]);

  // If user has no orgs, redirect to regular dashboard (B2C user)
  useEffect(() => {
    if (!isLoading && userOrganizations.length === 0) {
      router.replace(redirectTo);
    }
  }, [isLoading, userOrganizations, redirectTo, router]);

  const handleSelectOrganization = async (org: Organization) => {
    setSelectedOrg(org.id);
    setIsNavigating(true);

    // Set the organization in the store
    setCurrentOrganization(org);

    let targetUrl = redirectTo;

    // If redirecting to generic dashboard, go to specific role-based dashboard
    if (targetUrl === '/dashboard' || targetUrl === '/') {
        if (['owner', 'admin'].includes(org.role)) {
            targetUrl = `/${org.slug}/business-panel/dashboard`;
        } else {
            targetUrl = `/${org.slug}/business-user/dashboard`;
        }
    } else if (targetUrl.startsWith('/')) {
        // If it's a relative path that doesn't include the slug yet, prepend it
        if (!targetUrl.startsWith(`/${org.slug}`)) {
             targetUrl = `/${org.slug}${targetUrl}`;
        }
    }

    router.push(targetUrl);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Propietario';
      case 'admin':
        return 'Administrador';
      case 'member':
        return 'Miembro';
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
      case 'admin':
        return <Shield className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  const getRoleStyles = (role: string) => {
    switch (role) {
      case 'owner':
        return {
          bg: 'bg-amber-100 dark:bg-amber-500/10',
          text: 'text-amber-800 dark:text-amber-400',
          border: 'border-amber-200 dark:border-amber-500/20'
        };
      case 'admin':
        return {
          bg: 'bg-blue-100 dark:bg-blue-500/10',
          text: 'text-blue-800 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-500/20'
        };
      default:
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-500/10',
          text: 'text-emerald-800 dark:text-emerald-400',
          border: 'border-emerald-200 dark:border-emerald-500/20'
        };
    }
  };

  // Render loading state while auto-redirecting or loading context
  if (isLoading || userOrganizations.length <= 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050B14] relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100 dark:bg-[#0A2540] blur-[120px] opacity-60 dark:opacity-30" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-100 dark:bg-[#00D4B3] blur-[120px] opacity-40 dark:opacity-10" />
        </div>
        
        <div className="flex flex-col items-center gap-4 relative z-10">
          <Loader2 className="w-10 h-10 animate-spin text-[#0A2540] dark:text-[#00D4B3]" />
          <p className="text-gray-600 dark:text-gray-400 font-medium tracking-wide text-sm">
            {isLoading ? "Cargando organizaciones..." : "Redirigiendo..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050B14] p-4 relative overflow-hidden font-sans">
      {/* Premium Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden select-none pointer-events-none">
        <div className="absolute top-[-10%] left-1/4 w-[600px] h-[600px] rounded-full bg-blue-200 dark:bg-[#0A2540] blur-[120px] opacity-[0.4] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] rounded-full bg-teal-200 dark:bg-[#00D4B3] blur-[150px] opacity-[0.2] dark:opacity-[0.08]" />
        
        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04] dark:hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236C757D' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl relative z-10"
      >
        {/* Header Section */}
        <div className="text-center mb-10">
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight"
          >
            Selecciona tu Organización
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 dark:text-gray-400 text-lg max-w-md mx-auto"
          >
            Hemos encontrado <span className="text-gray-900 dark:text-white font-semibold">{userOrganizations.length}</span> espacios de trabajo.
          </motion.p>
        </div>

        {/* Organization List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {userOrganizations.map((org, index) => {
            const roleStyle = getRoleStyles(org.role);
            const isSelected = selectedOrg === org.id;
            
            return (
              <motion.button
                key={org.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 * (index + 2) }}
                onClick={() => handleSelectOrganization(org)}
                disabled={isNavigating}
                className={`
                  group w-full p-6 rounded-2xl border text-left relative overflow-hidden transition-all duration-300 flex flex-col justify-between min-h-[160px]
                  ${isSelected
                    ? 'bg-blue-50 dark:bg-[#0A2540]/50 border-blue-200 dark:border-[#00D4B3]/50 shadow-lg dark:shadow-[0_0_30px_rgba(0,212,179,0.15)] ring-2 ring-[#0A2540] dark:ring-[#00D4B3] ring-offset-2 ring-offset-gray-50 dark:ring-offset-[#050B14]'
                    : 'bg-white dark:bg-[#1E2329]/50 border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 hover:shadow-xl dark:hover:shadow-black/20 hover:-translate-y-1 shadow-sm'
                  }
                  ${isNavigating && !isSelected ? 'opacity-40 blur-[1px]' : ''}
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00D4B3]/[0.02] dark:via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]" />

                <div className="flex justify-between items-start w-full relative z-10">
                  {/* Logo Container */}
                  <div className="h-16 lg:h-20 flex items-center justify-start transition-transform duration-300 group-hover:scale-105 origin-left">
                    {org.brandLogoUrl || org.logoUrl ? (
                      <img
                        src={org.brandLogoUrl || org.logoUrl || ''}
                        alt={org.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gray-100 dark:bg-[#0F1419] border border-gray-200 dark:border-white/5 flex items-center justify-center">
                        <span className="text-[#0A2540] dark:text-[#00D4B3] text-3xl font-bold">
                          {org.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Icon */}
                  <div className={`
                    w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 mt-1
                    ${isSelected 
                      ? 'bg-[#0A2540] dark:bg-[#00D4B3] text-white dark:text-[#0A2540]' 
                      : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-400 group-hover:bg-[#0A2540]/10 dark:group-hover:bg-[#00D4B3]/20 group-hover:text-[#0A2540] dark:group-hover:text-[#00D4B3]'
                    }
                  `}>
                    {isSelected && isNavigating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* Info Text */}
                <div className="relative z-10 mt-6">
                  <h3 className={`font-bold text-xl truncate transition-colors ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                    {org.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider font-bold border transition-colors
                        ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}
                      `}
                    >
                      {getRoleIcon(org.role)}
                      {getRoleLabel(org.role)}
                    </span>
                    {org.slug && (
                      <span className="text-gray-400 dark:text-gray-500 text-xs font-medium truncate">
                        /{org.slug}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Puedes cambiar de organización en cualquier momento desde el panel de control.
          </p>
          <div className="mt-8 flex justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0A2540]/20 dark:bg-[#00D4B3]/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#0A2540]/40 dark:bg-[#00D4B3]/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#0A2540]/20 dark:bg-[#00D4B3]/20" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
