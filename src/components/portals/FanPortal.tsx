import React from 'react';
import { UniversalSocialFeed } from '../social/UniversalSocialFeed';

export interface FanPortalProps {
  userProfile: any;
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
  bandJoinRequests: any[];
  setBandJoinRequests: React.Dispatch<React.SetStateAction<any[]>>;
  bands: any[];
  setBands: React.Dispatch<React.SetStateAction<any[]>>;
  activeBand: any;
  activeBandId: string;
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

export const FanPortal: React.FC<FanPortalProps> = (props) => {
  return <UniversalSocialFeed {...props} portalRole="fan_only" />;
};

export default FanPortal;
