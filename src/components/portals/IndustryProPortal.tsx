import React from 'react';
import { UniversalSocialFeed } from '../social/UniversalSocialFeed';

export interface IndustryProPortalProps {
  userProfile: any;
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
  portalRole?: string;
  bandJoinRequests: any[];
  setBandJoinRequests: React.Dispatch<React.SetStateAction<any[]>>;
  bands: any[];
  setBands: React.Dispatch<React.SetStateAction<any[]>>;
  activeBand: any;
  activeBandId: string;
  setActiveBandId?: (id: string) => void;
  showSceneRadio?: boolean;
  setShowSceneRadio?: React.Dispatch<React.SetStateAction<boolean>>;
  onLogout: () => void;
  onBack: () => void;
  onNavigateToTab: (tab: string, subNav?: string) => void;
  setActiveTab: (tab: any) => void;
  setDashboardV2ActiveNav: React.Dispatch<React.SetStateAction<any>>;
  dashboardV2ActiveNav: any;
  onUpgradeToPro: () => void;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  onUpdateBandLogo: (newUrl: string) => void;
}

export const IndustryProPortal: React.FC<IndustryProPortalProps> = ({
  portalRole,
  userProfile,
  ...rest
}) => {
  const resolvedRole =
    portalRole ||
    (userProfile?.active_workspace === 'creative'
      ? 'creative'
      : userProfile?.active_workspace === 'label'
      ? 'label'
      : userProfile?.active_workspace === 'promoter'
      ? 'promoter'
      : userProfile?.active_workspace === 'band'
      ? 'band'
      : 'industry_pro');

  return (
    <UniversalSocialFeed
      userProfile={userProfile}
      portalRole={resolvedRole}
      {...rest}
    />
  );
};

export default IndustryProPortal;
