import React, { createContext, useContext } from 'react';
import { useSocialPortalRole, PortalRoleType } from '../hooks/useSocialPortalRole';

type SocialRoleContextType = ReturnType<typeof useSocialPortalRole>;

const SocialRoleContext = createContext<SocialRoleContextType | null>(null);

export const SocialRoleProvider: React.FC<{
  children: React.ReactNode;
  initialRole?: PortalRoleType;
  userProfile?: any;
  value?: SocialRoleContextType;
}> = ({ children, initialRole, userProfile, value }) => {
  const roleState = useSocialPortalRole({ initialRole, userProfile });
  return <SocialRoleContext.Provider value={value || roleState}>{children}</SocialRoleContext.Provider>;
};

export function useSocialRoleContext() {
  const context = useContext(SocialRoleContext);
  if (!context) {
    throw new Error('useSocialRoleContext must be used within a SocialRoleProvider');
  }
  return context;
}
