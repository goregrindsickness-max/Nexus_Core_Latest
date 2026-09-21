import { useState, useMemo, useCallback, useEffect } from 'react';
import { getSocialTheme } from '../utils/themeUtils';

export type PortalRoleType = 'industry_pro' | 'fan_only' | 'label' | 'promoter' | 'creative' | 'band' | string;

interface UseSocialPortalRoleOptions {
  initialRole?: PortalRoleType;
  userProfile?: any;
}

export function useSocialPortalRole({ initialRole, userProfile }: UseSocialPortalRoleOptions = {}) {
  const normalizeRole = (r: string) => {
    if (!r) return 'fan_only';
    if (r === 'fan' || r === 'fan_only') return 'fan_only';
    if (r === 'industry pro' || r === 'industry_pro' || r === 'pro') return 'industry_pro';
    return r;
  };

  const resolvedInitial = initialRole || userProfile?.active_workspace || userProfile?.account_type || 'fan_only';
  const normInitial = normalizeRole(resolvedInitial);

  const [activeRole, setActiveRole] = useState<PortalRoleType>(normInitial);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    if (initialRole) {
      setActiveRole(normalizeRole(initialRole));
    } else if (userProfile?.active_workspace) {
      setActiveRole(normalizeRole(userProfile.active_workspace));
    }
  }, [initialRole, userProfile?.active_workspace]);

  const rawRole = activeRole || normInitial;
  const portalRole = normalizeRole(rawRole);

  const isProfessional = useMemo(() => {
    const accType = (userProfile?.account_type || '').toLowerCase();
    const isFanAccount = accType === 'fan' || accType === 'fan_only' || portalRole === 'fan_only';
    if (isFanAccount) return false;

    const proWorkspaces = ['creative', 'promoter', 'label', 'band', 'industry_pro'];
    const userWorkspaces = [
      ...(userProfile?.registered_workspaces || []),
      ...(userProfile?.allowed_workspaces || [])
    ].map((w: string) => (typeof w === 'string' ? w.toLowerCase() : ''));

    const hasProWorkspace = userWorkspaces.some(w => proWorkspaces.includes(w));

    return !!(
      hasProWorkspace ||
      userProfile?.isPro ||
      userProfile?.hasProAccess ||
      userProfile?.role?.toLowerCase()?.includes('professional') ||
      userProfile?.role?.toLowerCase()?.includes('operator') ||
      userProfile?.role?.toLowerCase()?.includes('director') ||
      userProfile?.role?.toLowerCase()?.includes('admin') ||
      proWorkspaces.includes(accType)
    );
  }, [userProfile, portalRole]);

  const { activeRoleTheme, currentTheme } = useMemo(() => {
    return getSocialTheme(portalRole, isProfessional);
  }, [portalRole, isProfessional]);

  const dataTheme = useMemo(() => {
    return portalRole === 'label'
      ? 'label'
      : portalRole === 'promoter'
      ? 'promoter'
      : portalRole === 'band'
      ? 'band'
      : portalRole === 'fan_only'
      ? 'fan-only'
      : portalRole === 'industry_pro'
      ? isProfessional
        ? 'pro-violet'
        : 'fan-blue'
      : 'pro-violet';
  }, [portalRole, isProfessional]);

  const switchRole = useCallback((newRole: PortalRoleType) => {
    setActiveRole(newRole);
    setRoleMenuOpen(false);
  }, []);

  return {
    portalRole,
    setPortalRole: setActiveRole,
    roleMenuOpen,
    setRoleMenuOpen,
    isProfessional,
    activeRoleTheme,
    currentTheme,
    dataTheme,
    switchRole
  };
}
